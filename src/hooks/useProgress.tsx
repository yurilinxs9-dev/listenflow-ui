import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AudiobookProgress {
  audiobook_id: string;
  progress_seconds: number;
  duration_seconds: number;
  last_position: number;
  updated_at: string;
}

export const useProgress = (audiobookId?: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<AudiobookProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && audiobookId) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user, audiobookId]);

  const fetchProgress = async () => {
    if (!user || !audiobookId) return;

    console.log('[useProgress] 🔍 Buscando progresso para audiobook:', audiobookId);
    
    try {
      const { data, error } = await supabase
        .from('audiobook_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('audiobook_id', audiobookId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('[useProgress] ✅ Progresso encontrado:', data.last_position, 'segundos');
      } else {
        console.log('[useProgress] ℹ️ Nenhum progresso salvo anteriormente');
      }

      setProgress(data);
    } catch (error) {
      console.error('[useProgress] ❌ Erro ao buscar progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoizar updateProgress para evitar re-renders infinitos
  const updateProgress = useCallback(async (
    audiobookId: string,
    progressSeconds: number,
    durationSeconds: number,
    lastPosition: number
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audiobook_progress')
        .upsert(
          {
            user_id: user.id,
            audiobook_id: audiobookId,
            progress_seconds: progressSeconds,
            duration_seconds: durationSeconds,
            last_position: lastPosition,
          },
          {
            onConflict: 'user_id,audiobook_id',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      // ✅ CRÍTICO: Atualizar estado local sem fazer nova busca no banco
      // Isso evita loop infinito e re-renders desnecessários
      setProgress({
        audiobook_id: audiobookId,
        progress_seconds: progressSeconds,
        duration_seconds: durationSeconds,
        last_position: lastPosition,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[useProgress] ❌ Erro ao salvar progresso:', error);
    }
  }, [user]);

  const getProgressPercentage = () => {
    if (!progress || !progress.duration_seconds) return 0;
    return Math.round((progress.progress_seconds / progress.duration_seconds) * 100);
  };

  return { progress, loading, updateProgress, getProgressPercentage };
};
