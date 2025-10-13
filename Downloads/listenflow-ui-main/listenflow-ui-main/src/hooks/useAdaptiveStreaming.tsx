/**
 * OTIMIZAÇÃO AVANÇADA: Streaming adaptativo com detecção de rede e dispositivo
 * Ajusta automaticamente qualidade, buffer e preload baseado no contexto
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getNetworkInfo, 
  getDeviceInfo, 
  getOptimalStreamingConfig,
  getOptimalBufferSize,
  shouldEnablePrefetch,
  getRecommendedPreload,
  watchNetworkChanges,
  DownloadSpeedMonitor,
  type NetworkInfo,
  type DeviceInfo,
  type StreamingConfig
} from '@/lib/networkDetection';
import { supabase } from '@/integrations/supabase/client';

interface AdaptiveStreamingOptions {
  audiobookId: string;
  onNetworkChange?: (quality: string) => void;
}

interface AdaptiveState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  buffering: boolean;
  networkQuality: string;
  deviceType: string;
  config: StreamingConfig;
  downloadSpeed: number;
}

// Cache inteligente com TTL
const URL_CACHE_KEY = 'adaptive_audiobook_cache';

interface CachedEntry {
  url: string;
  expiresAt: number;
  audiobookId: string;
  cachedAt: number;
}

const getCachedUrl = (audiobookId: string): CachedEntry | null => {
  try {
    const cache = localStorage.getItem(URL_CACHE_KEY);
    if (!cache) return null;

    const parsed: Record<string, CachedEntry> = JSON.parse(cache);
    const entry = parsed[audiobookId];
    
    if (!entry) return null;
    
    const now = Date.now();
    const timeRemaining = entry.expiresAt - now;
    
    // Margem de segurança: 5 minutos
    if (timeRemaining > 5 * 60 * 1000) {
      return entry;
    }
    
    return null;
  } catch {
    return null;
  }
};

const setCachedUrl = (audiobookId: string, url: string, expiresAt: number) => {
  try {
    const cache = localStorage.getItem(URL_CACHE_KEY);
    const parsed = cache ? JSON.parse(cache) : {};
    
    parsed[audiobookId] = {
      url,
      expiresAt,
      audiobookId,
      cachedAt: Date.now(),
    };
    
    localStorage.setItem(URL_CACHE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('[AdaptiveCache] Erro ao salvar:', error);
  }
};

export const useAdaptiveStreaming = ({ 
  audiobookId,
  onNetworkChange
}: AdaptiveStreamingOptions) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => getNetworkInfo());
  const [deviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());
  const [config, setConfig] = useState<StreamingConfig>(() => getOptimalStreamingConfig());
  
  const [state, setState] = useState<AdaptiveState>({
    url: null,
    isLoading: false,
    error: null,
    buffering: false,
    networkQuality: networkInfo.quality,
    deviceType: deviceInfo.type,
    config,
    downloadSpeed: networkInfo.downlink,
  });
  
  const speedMonitor = useRef(new DownloadSpeedMonitor());
  const renewalTimer = useRef<NodeJS.Timeout | null>(null);
  const prefetchLink = useRef<HTMLLinkElement | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // Monitorar mudanças de rede em tempo real
  useEffect(() => {
    const cleanup = watchNetworkChanges((newInfo) => {
      setNetworkInfo(newInfo);
      
      // Atualizar configuração
      const newConfig = getOptimalStreamingConfig();
      setConfig(newConfig);
      
      setState(prev => ({
        ...prev,
        networkQuality: newInfo.quality,
        config: newConfig,
        downloadSpeed: newInfo.downlink,
      }));
      
      onNetworkChange?.(newInfo.quality);
      
      // Se conexão piorou drasticamente, pode ser necessário recarregar
      if (newInfo.quality === 'poor' && audioElement.current) {
        console.warn('[AdaptiveStreaming] ⚠️ Conexão piorou - pode travar!');
      }
    });
    
    return cleanup;
  }, [onNetworkChange]);

  // Buscar URL de streaming com retry inteligente
  const fetchStreamingUrl = useCallback(async (forceRefresh = false): Promise<string | null> => {
    // 1. Tentar cache primeiro (se não for refresh forçado)
    if (!forceRefresh && config.enableCache) {
      const cached = getCachedUrl(audiobookId);
      if (cached) {
        console.log('[AdaptiveStreaming] ⚡ Cache HIT - carregamento instantâneo!');
        
        setState(prev => ({
          ...prev,
          url: cached.url,
          isLoading: false,
          error: null,
        }));
        
        // Prefetch se apropriado
        if (config.enablePrefetch) {
          prefetchAudio(cached.url);
        }
        
        return cached.url;
      }
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const fetchStart = performance.now();
      
      const { data, error } = await supabase.functions.invoke('get-audiobook-presigned-url', {
        body: { audiobookId },
      });
      
      const fetchTime = performance.now() - fetchStart;
      console.log('[AdaptiveStreaming] ⏱️ URL obtida em', Math.round(fetchTime), 'ms');
      
      if (error) throw error;
      if (!data?.url) throw new Error('URL não recebida');
      
      const expiresAt = Date.now() + (data.expiresIn * 1000);
      
      // Salvar no cache
      if (config.enableCache) {
        setCachedUrl(audiobookId, data.url, expiresAt);
      }
      
      setState(prev => ({
        ...prev,
        url: data.url,
        isLoading: false,
        error: null,
      }));
      
      // Prefetch adaptativo
      if (config.enablePrefetch && shouldEnablePrefetch(networkInfo, deviceInfo)) {
        prefetchAudio(data.url);
      }
      
      // Auto-renovação inteligente
      scheduleRenewal(data.expiresIn);
      
      return data.url;
      
    } catch (err: any) {
      console.error('[AdaptiveStreaming] ❌ Erro:', err);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Erro ao carregar',
      }));
      
      return null;
    }
  }, [audiobookId, config, networkInfo, deviceInfo]);

  // Prefetch com link preload
  const prefetchAudio = useCallback((url: string) => {
    try {
      // Limpar prefetch anterior
      if (prefetchLink.current) {
        document.head.removeChild(prefetchLink.current);
      }
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'audio';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      // Adicionar atributo fetchpriority se suportado
      // @ts-ignore
      if ('fetchPriority' in link) {
        // @ts-ignore
        link.fetchPriority = networkInfo.quality === 'excellent' ? 'high' : 'auto';
      }
      
      document.head.appendChild(link);
      prefetchLink.current = link;
      
      console.log('[AdaptiveStreaming] 🔥 Prefetch iniciado com prioridade:', networkInfo.quality);
    } catch (error) {
      console.error('[AdaptiveStreaming] Erro no prefetch:', error);
    }
  }, [networkInfo]);

  // Agendar renovação inteligente
  const scheduleRenewal = useCallback((expiresIn: number) => {
    if (renewalTimer.current) {
      clearTimeout(renewalTimer.current);
    }
    
    // Calcular delay baseado na qualidade da rede
    let renewBefore = 2 * 60 * 1000; // Padrão: 2 minutos antes
    
    if (networkInfo.quality === 'poor') {
      renewBefore = 5 * 60 * 1000; // 5 minutos (mais margem)
    } else if (networkInfo.quality === 'excellent') {
      renewBefore = 1 * 60 * 1000; // 1 minuto (menos margem)
    }
    
    const delay = (expiresIn * 1000) - renewBefore;
    
    if (delay > 0) {
      console.log('[AdaptiveStreaming] ⏰ Renovação agendada em', Math.round(delay / 1000), 's');
      
      renewalTimer.current = setTimeout(() => {
        console.log('[AdaptiveStreaming] 🔄 Auto-renovando URL...');
        fetchStreamingUrl(true);
      }, delay);
    }
  }, [networkInfo, fetchStreamingUrl]);

  // Anexar elemento de áudio para monitoramento
  const attachAudioElement = useCallback((audio: HTMLAudioElement) => {
    audioElement.current = audio;
    
    const startTime = performance.now();
    let bytesLoaded = 0;
    
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const newBytesLoaded = bufferedEnd * (audio.duration || 1) * 128000 / 8; // Estimativa
        
        if (newBytesLoaded > bytesLoaded) {
          const timeElapsed = performance.now() - startTime;
          const bytesDownloaded = newBytesLoaded - bytesLoaded;
          
          speedMonitor.current.addSample(bytesDownloaded, timeElapsed);
          bytesLoaded = newBytesLoaded;
        }
      }
    };
    
    const handleWaiting = () => {
      console.warn('[AdaptiveStreaming] ⏳ Buffering - conexão pode estar lenta');
      setState(prev => ({ ...prev, buffering: true }));
    };
    
    const handleCanPlay = () => {
      console.log('[AdaptiveStreaming] ✅ Buffer pronto');
      setState(prev => ({ ...prev, buffering: false }));
    };
    
    const handleStalled = () => {
      console.error('[AdaptiveStreaming] 🔴 STALLED - Conexão travou!');
      setState(prev => ({ ...prev, buffering: true }));
      
      // Tentar recovery em conexão ruim
      if (networkInfo.quality === 'poor') {
        console.log('[AdaptiveStreaming] 🔄 Tentando recovery...');
        setTimeout(() => {
          if (audio.paused) {
            audio.load(); // Recarregar
          }
        }, 2000);
      }
    };
    
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('stalled', handleStalled);
    
    return () => {
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [networkInfo]);

  // Buscar URL ao montar
  useEffect(() => {
    if (audiobookId) {
      fetchStreamingUrl();
    }
    
    return () => {
      if (renewalTimer.current) {
        clearTimeout(renewalTimer.current);
      }
      
      if (prefetchLink.current && document.head.contains(prefetchLink.current)) {
        document.head.removeChild(prefetchLink.current);
      }
    };
  }, [audiobookId, fetchStreamingUrl]);

  // Recalcular configuração quando rede mudar significativamente
  useEffect(() => {
    const newConfig = getOptimalStreamingConfig();
    setConfig(newConfig);
    
    setState(prev => ({
      ...prev,
      config: newConfig,
      networkQuality: networkInfo.quality,
    }));
  }, [networkInfo.quality]);

  return {
    ...state,
    refresh: () => fetchStreamingUrl(true),
    attachAudioElement,
    networkInfo,
    deviceInfo,
    getPreloadMode: () => config.preload,
  };
};

