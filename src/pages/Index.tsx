import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryRow } from "@/components/CategoryRow";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const [myAudiobooksByCategory, setMyAudiobooksByCategory] = useState<Record<string, any[]>>({});
  const [globalAudiobooksByCategory, setGlobalAudiobooksByCategory] = useState<Record<string, any[]>>({});
  const [featuredAudiobooks, setFeaturedAudiobooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
          .from('audiobooks')
          .select('*')
          .not('audio_url', 'is', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Index] Error fetching audiobooks:', error);
        } else if (data) {
          // Transform database audiobooks to match the expected format
          const transformed = data.map((book: any) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            duration: formatDuration(book.duration_seconds),
            cover: book.cover_url || "/placeholder.svg",
            rating: 4.5,
            category: book.genre || "Geral",
            description: book.description || "Audiobook disponível para reprodução.",
            userId: book.user_id,
            isGlobal: book.is_global,
            viewCount: book.view_count || 0
          }));
          
          // Separar audiobooks destacados
          const featured = data.filter((book: any) => book.is_featured);
          const featuredTransformed = featured.map((book: any) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            duration: formatDuration(book.duration_seconds),
            cover: book.cover_url || "/placeholder.svg",
            rating: 4.5,
            category: book.genre || "Geral",
            description: book.description || "Audiobook disponível para reprodução.",
            userId: book.user_id,
            isGlobal: book.is_global
          }));
          setFeaturedAudiobooks(featuredTransformed);
          
          // Função para agrupar audiobooks por categoria
          const groupByCategory = (books: any[]) => {
            return books.reduce((acc, book) => {
              const category = book.genre || "Geral";
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(book);
              return acc;
            }, {} as Record<string, any[]>);
          };
          
          // Separar audiobooks do usuário dos globais e agrupar por categoria
          if (user) {
            const userBooks = transformed.filter(book => book.userId === user.id);
            const otherBooks = transformed.filter(book => book.userId !== user.id || book.isGlobal);
            setMyAudiobooksByCategory(groupByCategory(userBooks));
            setGlobalAudiobooksByCategory(groupByCategory(otherBooks));
          } else {
            setMyAudiobooksByCategory({});
            setGlobalAudiobooksByCategory(groupByCategory(transformed));
          }
        }
      } catch (error) {
        console.error('[Index] Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobooks();
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <HeroCarousel />
        
        <div className="space-y-8 pb-20">
          {loading ? (
            <div className="container mx-auto px-4 md:px-8 py-20 text-center">
              <p className="text-muted-foreground">Carregando audiobooks...</p>
            </div>
          ) : (
            <>
              {/* Audiobooks em Destaque */}
              {featuredAudiobooks.length > 0 && (
                <CategoryRow title="⭐ Em Destaque" audiobooks={featuredAudiobooks} />
              )}
              
              {/* Meus Audiobooks por Categoria */}
              {Object.keys(myAudiobooksByCategory).length > 0 && (
                <>
                  {Object.keys(myAudiobooksByCategory)
                    .sort()
                    .map((category) => (
                      <CategoryRow
                        key={`my-${category}`}
                        title={`Meus Audiobooks - ${category}`}
                        audiobooks={myAudiobooksByCategory[category]}
                      />
                    ))}
                </>
              )}
              
              {/* Todos os Audiobooks por Categoria */}
              {Object.keys(globalAudiobooksByCategory).length > 0 ? (
                <>
                  {Object.keys(globalAudiobooksByCategory)
                    .sort()
                    .map((category) => (
                      <CategoryRow
                        key={`global-${category}`}
                        title={category}
                        audiobooks={globalAudiobooksByCategory[category]}
                      />
                    ))}
                </>
              ) : (
                Object.keys(myAudiobooksByCategory).length === 0 && 
                !featuredAudiobooks.length && (
                  <div className="container mx-auto px-4 md:px-8 py-20 text-center">
                    <p className="text-muted-foreground">Nenhum audiobook disponível ainda.</p>
                    <p className="text-sm text-muted-foreground mt-2">Faça upload de audiobooks para começar!</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
