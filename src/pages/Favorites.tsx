import { Header } from "@/components/Header";
import { AudiobookCard } from "@/components/AudiobookCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();
  const navigate = useNavigate();
  const [favoriteAudiobooks, setFavoriteAudiobooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Buscar audiobooks reais do Supabase baseado nos IDs de favoritos
  useEffect(() => {
    const fetchFavoriteAudiobooks = async () => {
      if (favorites.length === 0) {
        setFavoriteAudiobooks([]);
        setLoadingBooks(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('audiobooks')
          .select('*')
          .in('id', favorites);

        if (error) {
          console.error('Erro ao buscar audiobooks favoritos:', error);
          setFavoriteAudiobooks([]);
        } else {
          // Formatar os dados
          const formatted = data?.map((book: any) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            duration: formatDuration(book.duration_seconds),
            cover: book.cover_url || "/placeholder.svg",
          })) || [];
          setFavoriteAudiobooks(formatted);
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar favoritos:', error);
        setFavoriteAudiobooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchFavoriteAudiobooks();
  }, [favorites]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  if (loading || loadingBooks) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center py-20">
              <p className="text-muted-foreground">Carregando favoritos...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">Meus Favoritos</h1>
            <p className="text-muted-foreground">
              {favoriteAudiobooks.length} {favoriteAudiobooks.length === 1 ? 'audiobook' : 'audiobooks'} na sua lista
            </p>
          </div>

          {favoriteAudiobooks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">
                Você ainda não adicionou nenhum audiobook aos favoritos.
              </p>
              <p className="text-muted-foreground">
                Explore nossa biblioteca e adicione seus audiobooks favoritos!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
              {favoriteAudiobooks.map((audiobook) => (
                <AudiobookCard
                  key={audiobook.id}
                  id={audiobook.id}
                  title={audiobook.title}
                  author={audiobook.author}
                  duration={audiobook.duration}
                  cover={audiobook.cover}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Favorites;
