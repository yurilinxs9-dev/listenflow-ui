import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Plus, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-audiobook.jpg";

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  duration: string;
  cover_url?: string;
  view_count: number;
}

export const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopAudiobooks = async () => {
      try {
        const { data, error } = await supabase
          .from('audiobooks')
          .select('*')
          .not('audio_url', 'is', null)
          .order('view_count', { ascending: false })
          .limit(5);

        if (error) {
          console.error('[HeroCarousel] Error fetching top audiobooks:', error);
        } else if (data && data.length > 0) {
          const transformed = data.map((book: any) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description || "Audiobook disponível para reprodução.",
            duration: formatDuration(book.duration_seconds),
            cover_url: book.cover_url,
            view_count: book.view_count || 0
          }));
          setFeaturedBooks(transformed);
        }
      } catch (error) {
        console.error('[HeroCarousel] Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopAudiobooks();
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  useEffect(() => {
    if (featuredBooks.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredBooks.length);
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [featuredBooks.length]);

  if (loading || featuredBooks.length === 0) {
    return (
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando destaques...</p>
      </div>
    );
  }

  const currentBook = featuredBooks[currentIndex];

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />

      <div className="relative container mx-auto px-4 md:px-8 h-full flex items-end pb-20">
        <div className="max-w-2xl space-y-4 md:space-y-6 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-glow line-clamp-3 break-words">
            {currentBook.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm">
            <span className="text-accent font-semibold">Em Destaque</span>
            <span className="text-muted-foreground">{currentBook.duration}</span>
            <span className="text-muted-foreground">Por {currentBook.author}</span>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-foreground/90 leading-relaxed line-clamp-4">
            {currentBook.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gradient-hero border-0 glow-effect group"
              onClick={() => navigate(`/audiobook/${currentBook.id}`)}
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="currentColor" />
              Ouvir Agora
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(`/audiobook/${currentBook.id}`)}
            >
              <Info className="w-5 h-5 mr-2" />
              Mais Informações
            </Button>
            
            <Button size="lg" variant="secondary">
              <Plus className="w-5 h-5 mr-2" />
              Minha Lista
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            {featuredBooks.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 gradient-hero"
                    : "w-6 bg-muted hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
