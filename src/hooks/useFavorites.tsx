import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadFavorites = async () => {
      if (user && mounted) {
        await fetchFavorites();
      } else if (!user && mounted) {
        setFavorites([]);
        setLoading(false);
      }
    };

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Mudou para user?.id para evitar re-renders desnecessários

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('audiobook_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }

      setFavorites(data?.map(f => f.audiobook_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os favoritos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (audiobookId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar favoritos.",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.includes(audiobookId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('audiobook_id', audiobookId);

        if (error) throw error;

        setFavorites(favorites.filter(id => id !== audiobookId));
        toast({
          title: "Removido dos favoritos",
          description: "Audiobook removido da sua lista de favoritos.",
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            audiobook_id: audiobookId,
          });

        if (error) throw error;

        setFavorites([...favorites, audiobookId]);
        toast({
          title: "Adicionado aos favoritos",
          description: "Audiobook adicionado à sua lista de favoritos.",
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos.",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (audiobookId: string) => favorites.includes(audiobookId);

  return { favorites, loading, toggleFavorite, isFavorite };
};
