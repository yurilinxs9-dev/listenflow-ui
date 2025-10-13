import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamingOptions {
  audiobookId: string;
  autoRenew?: boolean;
  bufferSize?: number;
  enableCache?: boolean;
  prefetch?: boolean;
}

interface StreamingState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  expiresAt: number | null;
  buffering: boolean;
  cached: boolean;
}

interface CachedUrl {
  url: string;
  expiresAt: number;
  audiobookId: string;
}

// Cache de URLs no localStorage com expiração
const URL_CACHE_KEY = 'audiobook_url_cache';

const getCachedUrl = (audiobookId: string): CachedUrl | null => {
  try {
    const cache = localStorage.getItem(URL_CACHE_KEY);
    if (!cache) return null;

    const parsed: Record<string, CachedUrl> = JSON.parse(cache);
    const cached = parsed[audiobookId];
    
    if (!cached) return null;
    
    // Verifica se ainda é válido (com margem de 5 minutos)
    const now = Date.now();
    const timeUntilExpiry = cached.expiresAt - now;
    
    if (timeUntilExpiry > 5 * 60 * 1000) {
      console.log('[Cache] ✅ URL válida encontrada no cache, expira em:', Math.floor(timeUntilExpiry / 1000), 'segundos');
      return cached;
    } else {
      console.log('[Cache] ⚠️ URL expirada ou próxima de expirar');
      return null;
    }
  } catch (error) {
    console.error('[Cache] Erro ao ler cache:', error);
    return null;
  }
};

const setCachedUrl = (audiobookId: string, url: string, expiresAt: number) => {
  try {
    const cache = localStorage.getItem(URL_CACHE_KEY);
    const parsed: Record<string, CachedUrl> = cache ? JSON.parse(cache) : {};
    
    parsed[audiobookId] = { url, expiresAt, audiobookId };
    
    localStorage.setItem(URL_CACHE_KEY, JSON.stringify(parsed));
    console.log('[Cache] 💾 URL armazenada no cache');
  } catch (error) {
    console.error('[Cache] Erro ao salvar cache:', error);
  }
};

const clearExpiredCache = () => {
  try {
    const cache = localStorage.getItem(URL_CACHE_KEY);
    if (!cache) return;

    const parsed: Record<string, CachedUrl> = JSON.parse(cache);
    const now = Date.now();
    const filtered = Object.entries(parsed).reduce((acc, [key, value]) => {
      if (value.expiresAt > now) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, CachedUrl>);

    localStorage.setItem(URL_CACHE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[Cache] Erro ao limpar cache:', error);
  }
};

export const useOptimizedStreaming = ({ 
  audiobookId, 
  autoRenew = true, 
  bufferSize = 5 * 1024 * 1024,
  enableCache = true,
  prefetch = true 
}: StreamingOptions) => {
  const [state, setState] = useState<StreamingState>({
    url: null,
    isLoading: false,
    error: null,
    expiresAt: null,
    buffering: false,
    cached: false,
  });
  
  const renewalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const prefetchLinkRef = useRef<HTMLLinkElement | null>(null);

  const fetchStreamingUrl = useCallback(async (skipCache = false) => {
    // 1️⃣ Primeiro: Verificar cache se habilitado
    if (enableCache && !skipCache) {
      const cached = getCachedUrl(audiobookId);
      if (cached) {
        console.log('[OptimizedStreaming] ⚡ Usando URL do cache - INSTANTÂNEO!');
        setState({
          url: cached.url,
          isLoading: false,
          error: null,
          expiresAt: cached.expiresAt,
          buffering: false,
          cached: true,
        });
        
        // Prefetch do áudio em background
        if (prefetch) {
          prefetchAudio(cached.url);
        }
        
        return cached.url;
      }
    }

    console.log('[OptimizedStreaming] 🚀 Buscando nova URL...');
    setState(prev => ({ ...prev, isLoading: true, error: null, cached: false }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[OptimizedStreaming] 📡 Chamando edge function...');
      const startTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('get-audiobook-presigned-url', {
        body: { audiobookId },
      });

      const endTime = performance.now();
      console.log('[OptimizedStreaming] ⏱️ Edge function respondeu em:', Math.round(endTime - startTime), 'ms');

      if (error) {
        throw error;
      }

      if (!data || !data.url) {
        throw new Error('URL não recebida');
      }

      const expiresAt = Date.now() + (data.expiresIn * 1000);
      console.log('[OptimizedStreaming] ✅ Nova URL obtida, expira em:', Math.floor(data.expiresIn / 60), 'minutos');

      // Salvar no cache
      if (enableCache) {
        setCachedUrl(audiobookId, data.url, expiresAt);
      }

      setState({
        url: data.url,
        isLoading: false,
        error: null,
        expiresAt,
        buffering: false,
        cached: false,
      });

      // Prefetch do áudio
      if (prefetch) {
        prefetchAudio(data.url);
      }

      // Schedule automatic renewal before expiration
      if (autoRenew && data.expiresIn) {
        // Only renew if there's at least 10 minutes until expiration
        const renewalTime = (data.expiresIn * 1000) - (2 * 60 * 1000); // Renew 2 minutes before expiration
        
        if (renewalTime > 0) {
          console.log('[OptimizedStreaming] ⏰ Scheduled renewal in', Math.floor(renewalTime / 1000), 'seconds');
          
          if (renewalTimerRef.current) {
            clearTimeout(renewalTimerRef.current);
          }
          
          renewalTimerRef.current = setTimeout(() => {
            console.log('[OptimizedStreaming] 🔄 Auto-renewing URL...');
            fetchStreamingUrl();
          }, renewalTime);
        } else {
          console.log('[OptimizedStreaming] ⚠️ URL expires too soon, no renewal scheduled');
        }
      }

      return data.url;
    } catch (err: any) {
      console.error('[OptimizedStreaming] ❌ Error fetching URL:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Erro ao carregar áudio',
      }));
      return null;
    }
  }, [audiobookId, autoRenew, enableCache, prefetch]);

  // Função para prefetch do áudio usando link preload
  const prefetchAudio = useCallback((url: string) => {
    try {
      // Remover prefetch anterior se existir
      if (prefetchLinkRef.current) {
        document.head.removeChild(prefetchLinkRef.current);
      }

      // Criar link de preload para o áudio
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'audio';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
      prefetchLinkRef.current = link;
      
      console.log('[OptimizedStreaming] 🔥 Prefetch do áudio iniciado');
    } catch (error) {
      console.error('[OptimizedStreaming] Erro no prefetch:', error);
    }
  }, []);

  // Attach audio element for buffering monitoring
  const attachAudioElement = useCallback((audioElement: HTMLAudioElement) => {
    audioElementRef.current = audioElement;

    const handleWaiting = () => {
      console.log('[OptimizedStreaming] ⏳ Buffering...');
      setState(prev => ({ ...prev, buffering: true }));
    };

    const handleCanPlay = () => {
      console.log('[OptimizedStreaming] ✅ Ready to play');
      setState(prev => ({ ...prev, buffering: false }));
    };

    audioElement.addEventListener('waiting', handleWaiting);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('canplaythrough', handleCanPlay);

    return () => {
      audioElement.removeEventListener('waiting', handleWaiting);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('canplaythrough', handleCanPlay);
    };
  }, []);

  // Initial fetch - IMEDIATO ao montar componente
  useEffect(() => {
    if (audiobookId) {
      // Limpar cache expirado
      clearExpiredCache();
      
      // Buscar URL imediatamente
      fetchStreamingUrl();
    }

    return () => {
      if (renewalTimerRef.current) {
        clearTimeout(renewalTimerRef.current);
      }
      
      // Limpar prefetch
      if (prefetchLinkRef.current && document.head.contains(prefetchLinkRef.current)) {
        document.head.removeChild(prefetchLinkRef.current);
      }
    };
  }, [audiobookId, fetchStreamingUrl]);

  return {
    ...state,
    refresh: () => fetchStreamingUrl(true), // Force skip cache
    attachAudioElement,
    clearCache: () => {
      try {
        const cache = localStorage.getItem(URL_CACHE_KEY);
        if (cache) {
          const parsed = JSON.parse(cache);
          delete parsed[audiobookId];
          localStorage.setItem(URL_CACHE_KEY, JSON.stringify(parsed));
          console.log('[Cache] 🗑️ Cache limpo para audiobook:', audiobookId);
        }
      } catch (error) {
        console.error('[Cache] Erro ao limpar cache:', error);
      }
    },
  };
};
