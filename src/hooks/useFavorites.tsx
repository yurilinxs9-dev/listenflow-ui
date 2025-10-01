import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadFavorites = async () => {
      if (user?.id && mounted) {
        // Adiciona um pequeno delay para evitar múltiplas chamadas
        timeoutId = setTimeout(async () => {
          if (mounted) {
            await fetchFavorites();
          }
        }, 100);
      } else if (!user && mounted) {
        setFavorites([]);
        setLoading(false);
      }
    };

    loadFavorites();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id]);

  const toggleFavorite = async (audiobookId: string) => {
    // Previne cliques múltiplos
    if (isToggling[audiobookId]) {
      return;
    }
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar favoritos.",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.includes(audiobookId);

    // Marca como processando
    setIsToggling(prev => ({ ...prev, [audiobookId]: true }));

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('audiobook_id', audiobookId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== audiobookId));
        toast({
          title: "Removido dos favoritos",
          description: "Audiobook removido da sua lista de favoritos.",
        });
      } else {
        // Verifica antes de inserir
        const { data: existing } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('audiobook_id', audiobookId)
          .maybeSingle();

        if (existing) {
          setFavorites(prev => {
            if (!prev.includes(audiobookId)) {
              return [...prev, audiobookId];
            }
            return prev;
          });
          toast({
            title: "Já está nos favoritos",
            description: "Este audiobook já está na sua lista.",
          });
          return;
        }

        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            audiobook_id: audiobookId,
          })
          .select();

        if (error) {
          if (error.code === '23505') {
            setFavorites(prev => {
              if (!prev.includes(audiobookId)) {
                return [...prev, audiobookId];
              }
              return prev;
            });
            toast({
              title: "Já nos favoritos",
              description: "Este audiobook já está na sua lista.",
            });
            return;
          }
          throw error;
        }

        setFavorites(prev => [...prev, audiobookId]);
        toast({
          title: "Adicionado aos favoritos",
          description: "Audiobook adicionado à sua lista de favoritos.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar os favoritos.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsToggling(prev => ({ ...prev, [audiobookId]: false }));
      }, 300);
    }
  };

  const isFavorite = (audiobookId: string) => favorites.includes(audiobookId);

  return { favorites, loading, toggleFavorite, isFavorite, isToggling };
};
