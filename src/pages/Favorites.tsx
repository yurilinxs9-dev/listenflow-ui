import { Header } from "@/components/Header";
import { AudiobookCard } from "@/components/AudiobookCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getAudiobookById } from "@/data/mockAudiobooks";

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const favoriteAudiobooks = favorites
    .map(id => getAudiobookById(id))
    .filter(book => book !== undefined);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center py-20">
              <p className="text-muted-foreground">Carregando...</p>
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
