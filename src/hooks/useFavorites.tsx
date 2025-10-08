import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

// Cache global para evitar múltiplas requisições
let favoritesCache: string[] = [];
let cacheTimestamp = 0;
let fetchPromise: Promise<string[]> | null = null;
const CACHE_DURATION = 5000; // 5 segundos

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(favoritesCache);
  const [loading, setLoading] = useState(false);
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(true);

  const fetchFavorites = async (): Promise<string[]> => {
    if (!user) return [];

    // Verifica se já existe uma requisição em andamento
    if (fetchPromise) {
      return fetchPromise;
    }

    // Verifica se o cache ainda é válido
    const now = Date.now();
    if (cacheTimestamp && now - cacheTimestamp < CACHE_DURATION && favoritesCache.length >= 0) {
      return favoritesCache;
    }

    // Cria uma nova promise de fetch
    fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('audiobook_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching favorites:', error);
          throw error;
        }

        const newFavorites = data?.map(f => f.audiobook_id) || [];
        favoritesCache = newFavorites;
        cacheTimestamp = Date.now();
        return newFavorites;
      } catch (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  };

  useEffect(() => {
    mountedRef.current = true;
    
    const loadFavorites = async () => {
      if (!user?.id) {
        if (mountedRef.current) {
          setFavorites([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const result = await fetchFavorites();
        if (mountedRef.current) {
          setFavorites(result);
        }
      } catch (error) {
        if (mountedRef.current) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os favoritos.",
            variant: "destructive",
          });
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadFavorites();

    return () => {
      mountedRef.current = false;
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

        const newFavorites = favorites.filter(id => id !== audiobookId);
        setFavorites(newFavorites);
        favoritesCache = newFavorites;
        cacheTimestamp = Date.now();
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

        const newFavorites = [...favorites, audiobookId];
        setFavorites(newFavorites);
        favoritesCache = newFavorites;
        cacheTimestamp = Date.now();
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
