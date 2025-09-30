import { Header } from "@/components/Header";
import { AudiobookCard } from "@/components/AudiobookCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import mysteryBook from "@/assets/book-mystery.jpg";
import fantasyBook from "@/assets/book-fantasy.jpg";
import scifiBook from "@/assets/book-scifi.jpg";
import romanceBook from "@/assets/book-romance.jpg";
import businessBook from "@/assets/book-business.jpg";
import biographyBook from "@/assets/book-biography.jpg";

// Mock data - em produção viria do backend
const allAudiobooks: Record<string, any> = {
  "1": {
    title: "O Mistério da Noite Escura",
    author: "Ana Silva",
    duration: "8h 45min",
    cover: mysteryBook,
  },
  "2": {
    title: "Reinos Perdidos",
    author: "Carlos Mendes",
    duration: "12h 30min",
    cover: fantasyBook,
  },
  "3": {
    title: "Estrelas Distantes",
    author: "Maria Costa",
    duration: "10h 15min",
    cover: scifiBook,
  },
  "4": {
    title: "Amor em Paris",
    author: "Beatriz Santos",
    duration: "6h 20min",
    cover: romanceBook,
  },
  "5": {
    title: "O Código do Sucesso",
    author: "João Almeida",
    duration: "7h 10min",
    cover: businessBook,
  },
  "6": {
    title: "Vida de um Gênio",
    author: "Pedro Rocha",
    duration: "9h 45min",
    cover: biographyBook,
  },
};

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
    .map(id => ({ id, ...allAudiobooks[id] }))
    .filter(book => book.title);

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
