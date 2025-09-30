import { useState, useEffect } from 'react';
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

    try {
      const { data, error } = await supabase
        .from('audiobook_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('audiobook_id', audiobookId)
        .maybeSingle();

      if (error) throw error;

      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (
    audiobookId: string,
    progressSeconds: number,
    durationSeconds: number,
    lastPosition: number
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audiobook_progress')
        .upsert({
          user_id: user.id,
          audiobook_id: audiobookId,
          progress_seconds: progressSeconds,
          duration_seconds: durationSeconds,
          last_position: lastPosition,
        });

      if (error) throw error;

      await fetchProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getProgressPercentage = () => {
    if (!progress || !progress.duration_seconds) return 0;
    return Math.round((progress.progress_seconds / progress.duration_seconds) * 100);
  };

  return { progress, loading, updateProgress, getProgressPercentage };
};
