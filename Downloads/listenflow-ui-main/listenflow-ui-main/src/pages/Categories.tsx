import { Header } from "@/components/Header";
import { CategoryRow } from "@/components/CategoryRow";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserStatus } from "@/hooks/useUserStatus";
import { AccessDenied } from "@/components/AccessDenied";
import { VirtualAudiobookList } from "@/components/VirtualAudiobookList";

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGenre = searchParams.get("genre");
  
  const [audiobooks, setAudiobooks] = useState<any[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { isApproved, isPending, isRejected, loading: statusLoading } = useUserStatus();

  useEffect(() => {
    fetchAudiobooks();
  }, [selectedGenre]);

  const fetchAudiobooks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audiobooks')
        .select('*')
        .not('audio_url', 'is', null)
        .order('created_at', { ascending: false });

      if (selectedGenre) {
        query = query.eq('genre', selectedGenre);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audiobooks:', error);
      } else if (data) {
        const transformed = data.map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          duration: formatDuration(book.duration_seconds),
          cover: book.cover_url || "/placeholder.svg",
          category: book.genre || "Geral",
          viewCount: book.view_count || 0
        }));
        
        setAudiobooks(transformed);
        
        // Extract unique genres
        const uniqueGenres = Array.from(
          new Set(data.map((book: any) => book.genre || "Geral"))
        ).sort() as string[];
        setGenres(uniqueGenres);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const handleGenreClick = (genre: string | null) => {
    if (genre) {
      setSearchParams({ genre });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Categorias</h1>
          
          {/* Genre Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={!selectedGenre ? "default" : "outline"}
              onClick={() => handleGenreClick(null)}
              className="rounded-full"
            >
              Todos os Gêneros
            </Button>
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                onClick={() => handleGenreClick(genre)}
                className="rounded-full"
              >
                {genre}
              </Button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">Carregando audiobooks...</p>
            </div>
          ) : audiobooks.length > 0 ? (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6">
                {selectedGenre ? `Gênero: ${selectedGenre}` : "Todos os Audiobooks"}
              </h2>
              {/* OTIMIZAÇÃO: Virtual scrolling para listas grandes (>20 itens) */}
              <VirtualAudiobookList audiobooks={audiobooks} />
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">
                Nenhum audiobook encontrado{selectedGenre ? ` em ${selectedGenre}` : ''}.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Categories;
