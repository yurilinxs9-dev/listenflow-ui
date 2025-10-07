import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryRow } from "@/components/CategoryRow";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const [myAudiobooks, setMyAudiobooks] = useState<any[]>([]);
  const [globalAudiobooks, setGlobalAudiobooks] = useState<any[]>([]);
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
            isGlobal: book.is_global
          }));
          
          // Separar audiobooks do usuário dos globais
          if (user) {
            const userBooks = transformed.filter(book => book.userId === user.id);
            const otherBooks = transformed.filter(book => book.userId !== user.id || book.isGlobal);
            setMyAudiobooks(userBooks);
            setGlobalAudiobooks(otherBooks);
          } else {
            setMyAudiobooks([]);
            setGlobalAudiobooks(transformed);
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
              {myAudiobooks.length > 0 && (
                <CategoryRow title="Meus Audiobooks" audiobooks={myAudiobooks} />
              )}
              {globalAudiobooks.length > 0 ? (
                <CategoryRow title="Todos os Audiobooks" audiobooks={globalAudiobooks} />
              ) : (
                !myAudiobooks.length && (
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
