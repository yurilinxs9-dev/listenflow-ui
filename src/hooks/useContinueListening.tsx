import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AudiobookWithProgress {
  id: string;
  title: string;
  author: string;
  cover: string;
  duration: string;
  category: string;
  description: string;
  userId: string;
  isGlobal: boolean;
  progress: number; // Porcentagem de progresso para exibir na UI
  lastPosition: number;
}

export const useContinueListening = () => {
  const { user } = useAuth();
  const [audiobooks, setAudiobooks] = useState<AudiobookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContinueListening = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar progresso do usuário
        const { data: progressData, error: progressError } = await supabase
          .from('audiobook_progress')
          .select('audiobook_id, last_position, duration_seconds')
          .eq('user_id', user.id)
          .gt('last_position', 0) // Apenas audiobooks que foram iniciados
          .order('updated_at', { ascending: false })
          .limit(10);

        if (progressError) throw progressError;

        if (!progressData || progressData.length === 0) {
          setAudiobooks([]);
          setLoading(false);
          return;
        }

        // Buscar detalhes dos audiobooks
        const audiobookIds = progressData.map(p => p.audiobook_id);
        const { data: audiobooksData, error: audiobooksError } = await supabase
          .from('audiobooks')
          .select('*')
          .in('id', audiobookIds);

        if (audiobooksError) throw audiobooksError;

        // Combinar dados de progresso com audiobooks
        const audiobooksWithProgress = progressData
          .map(progress => {
            const audiobook = audiobooksData?.find(a => a.id === progress.audiobook_id);
            if (!audiobook) return null;

            const progressPercent = progress.duration_seconds > 0
              ? Math.round((progress.last_position / progress.duration_seconds) * 100)
              : 0;

            // Não mostrar se já foi concluído (>95%)
            if (progressPercent > 95) return null;

            return {
              id: audiobook.id,
              title: audiobook.title,
              author: audiobook.author,
              cover: audiobook.cover_url || '/placeholder.svg',
              duration: formatDuration(audiobook.duration_seconds),
              category: audiobook.genre || 'Geral',
              description: audiobook.description || '',
              userId: audiobook.user_id,
              isGlobal: audiobook.is_global,
              progress: progressPercent, // ✅ Nome correto para o AudiobookCard
              lastPosition: progress.last_position,
            };
          })
          .filter((book): book is AudiobookWithProgress => book !== null);

        setAudiobooks(audiobooksWithProgress);
      } catch (error) {
        console.error('[useContinueListening] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueListening();
  }, [user]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  return { audiobooks, loading };
};
