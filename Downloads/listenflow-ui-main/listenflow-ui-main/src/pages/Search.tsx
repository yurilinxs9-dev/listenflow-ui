import { Header } from "@/components/Header";
import { AudiobookCard } from "@/components/AudiobookCard";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserStatus } from "@/hooks/useUserStatus";
import { AccessDenied } from "@/components/AccessDenied";

interface Audiobook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  duration_seconds: number;
  genre: string;
}

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(false);
  const { isApproved, isPending, isRejected, loading: statusLoading } = useUserStatus();

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchAudiobooks();
    } else {
      setAudiobooks([]);
    }
  }, [searchQuery]);

  const searchAudiobooks = async () => {
    setLoading(true);
    try {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;
      
      const { data, error } = await supabase
        .from('audiobooks')
        .select('id, title, author, cover_url, duration_seconds, genre')
        .or(`title.ilike.${searchTerm},author.ilike.${searchTerm},genre.ilike.${searchTerm},description.ilike.${searchTerm}`);

      if (error) throw error;
      
      setAudiobooks(data || []);
    } catch (error) {
      console.error('Erro ao buscar audiobooks:', error);
      toast.error('Erro ao buscar audiobooks');
      setAudiobooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const categories = searchQuery.trim()
    ? Array.from(new Set(audiobooks.map((book) => book.genre)))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">
            Buscar Audiobooks
          </h1>

          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Digite o título, autor, categoria..."
              className="pl-12 h-14 text-lg bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>

        {searchQuery.trim() && (
          <>
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Buscando...</p>
              </div>
            ) : audiobooks.length > 0 ? (
              <div className="space-y-12">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">
                      {audiobooks.length} resultado
                      {audiobooks.length !== 1 ? "s" : ""} encontrado
                      {audiobooks.length !== 1 ? "s" : ""}
                    </h2>
                    <p className="text-muted-foreground">
                      para "{searchQuery}"
                    </p>
                  </div>

                  {categories.length > 1 ? (
                    categories.map((category) => {
                      const booksInCategory = audiobooks.filter(
                        (book) => book.genre === category
                      );
                      return (
                        <div key={category} className="mb-12">
                          <h3 className="text-xl font-semibold mb-6">
                            {category} ({booksInCategory.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {booksInCategory.map((audiobook) => (
                              <AudiobookCard
                                key={audiobook.id}
                                id={audiobook.id}
                                title={audiobook.title}
                                author={audiobook.author}
                                duration={formatDuration(audiobook.duration_seconds)}
                                cover={audiobook.cover_url}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                      {audiobooks.map((audiobook) => (
                        <AudiobookCard
                          key={audiobook.id}
                          id={audiobook.id}
                          title={audiobook.title}
                          author={audiobook.author}
                          duration={formatDuration(audiobook.duration_seconds)}
                          cover={audiobook.cover_url}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">
                  Nenhum resultado encontrado
                </h2>
                <p className="text-muted-foreground">
                  Tente buscar com palavras-chave diferentes
                </p>
              </div>
            )}
          </>
        )}

        {!searchQuery.trim() && (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Comece a buscar audiobooks
            </h2>
            <p className="text-muted-foreground">
              Digite o título, autor ou categoria que deseja encontrar
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
