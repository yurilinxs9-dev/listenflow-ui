import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Music, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoverGeneration } from "@/hooks/useCoverGeneration";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Audiobook {
  id: string;
  title: string;
  author: string;
  narrator: string | null;
  genre: string | null;
  cover_url: string | null;
  duration_seconds: number;
  created_at: string;
}

export default function MyAudiobooks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generatingCoverId, setGeneratingCoverId] = useState<string | null>(null);
  const { generateCover } = useCoverGeneration();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadAudiobooks();
  }, [user, navigate]);

  const loadAudiobooks = async () => {
    try {
      const { data, error } = await supabase
        .from("audiobooks")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAudiobooks(data || []);
    } catch (error: any) {
      console.error("Error loading audiobooks:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus audiobooks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("audiobooks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAudiobooks(audiobooks.filter((book) => book.id !== id));
      toast({
        title: "Sucesso",
        description: "Audiobook removido com sucesso",
      });
    } catch (error: any) {
      console.error("Error deleting audiobook:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o audiobook",
        variant: "destructive",
      });
    }
    setDeleteId(null);
  };

  const handleGenerateCover = async (audiobook: Audiobook) => {
    setGeneratingCoverId(audiobook.id);
    
    const newCoverUrl = await generateCover(
      audiobook.id,
      audiobook.title,
      audiobook.author,
      audiobook.genre || 'Ficção'
    );

    if (newCoverUrl) {
      // Update local state
      setAudiobooks(audiobooks.map(ab => 
        ab.id === audiobook.id 
          ? { ...ab, cover_url: newCoverUrl } 
          : ab
      ));
    }
    
    setGeneratingCoverId(null);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Meus Audiobooks</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full rounded-md mb-4" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : audiobooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhum audiobook ainda</CardTitle>
              <CardDescription>
                Sua biblioteca está vazia. Aguarde novos audiobooks serem adicionados.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audiobooks.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <div className="aspect-[3/4] relative bg-muted">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                  <CardDescription className="space-y-1">
                    <span className="block">Por {book.author}</span>
                    {book.narrator && <span className="block">Narrado por {book.narrator}</span>}
                    {book.genre && <span className="block text-xs">{book.genre}</span>}
                    <span className="block text-xs">{formatDuration(book.duration_seconds)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!book.cover_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateCover(book)}
                      disabled={generatingCoverId === book.id}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generatingCoverId === book.id ? 'Gerando...' : 'Gerar Capa com IA'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(book.id)}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este audiobook? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
