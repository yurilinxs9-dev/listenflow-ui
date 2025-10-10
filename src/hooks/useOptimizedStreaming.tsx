import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamingOptions {
  audiobookId: string;
  autoRenew?: boolean;
  bufferSize?: number;
}

interface StreamingState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  expiresAt: number | null;
  buffering: boolean;
}

export const useOptimizedStreaming = ({ audiobookId, autoRenew = true, bufferSize = 5 * 1024 * 1024 }: StreamingOptions) => {
  const [state, setState] = useState<StreamingState>({
    url: null,
    isLoading: false,
    error: null,
    expiresAt: null,
    buffering: false,
  });
  
  const renewalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const fetchStreamingUrl = useCallback(async () => {
    console.log('[OptimizedStreaming] 🚀 Fetching streaming URL for audiobook:', audiobookId);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[OptimizedStreaming] 📡 Calling edge function...');
      const { data, error } = await supabase.functions.invoke('get-audiobook-presigned-url', {
        body: { audiobookId },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.url) {
        throw new Error('URL não recebida');
      }

      const expiresAt = Date.now() + (data.expiresIn * 1000);
      console.log('[OptimizedStreaming] ✅ URL obtained, expires at:', new Date(expiresAt).toLocaleTimeString());

      setState({
        url: data.url,
        isLoading: false,
        error: null,
        expiresAt,
        buffering: false,
      });

      // Schedule automatic renewal before expiration
      if (autoRenew && data.expiresIn) {
        const renewalTime = (data.expiresIn * 1000) - (5 * 60 * 1000); // Renew 5 minutes before expiration
        console.log('[OptimizedStreaming] ⏰ Scheduled renewal in', renewalTime / 1000, 'seconds');
        
        if (renewalTimerRef.current) {
          clearTimeout(renewalTimerRef.current);
        }
        
        renewalTimerRef.current = setTimeout(() => {
          console.log('[OptimizedStreaming] 🔄 Auto-renewing URL...');
          fetchStreamingUrl();
        }, renewalTime);
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
  }, [audiobookId, autoRenew]);

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

  // Initial fetch
  useEffect(() => {
    if (audiobookId) {
      fetchStreamingUrl();
    }

    return () => {
      if (renewalTimerRef.current) {
        clearTimeout(renewalTimerRef.current);
      }
    };
  }, [audiobookId, fetchStreamingUrl]);

  return {
    ...state,
    refresh: fetchStreamingUrl,
    attachAudioElement,
  };
};
