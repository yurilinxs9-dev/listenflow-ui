import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Music, Edit, ArrowLeft, Sparkles } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Audiobook {
  id: string;
  title: string;
  author: string;
  narrator: string | null;
  genre: string | null;
  cover_url: string | null;
  duration_seconds: number;
  is_global: boolean | null;
  require_login: boolean | null;
  created_at: string;
}

export default function AdminAudiobooks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generatingCoverId, setGeneratingCoverId] = useState<string | null>(null);
  const { generateCover } = useCoverGeneration();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadAudiobooks();
    }
  }, [isAdmin]);

  const loadAudiobooks = async () => {
    try {
      const { data, error } = await supabase
        .from("audiobooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAudiobooks(data || []);
    } catch (error: any) {
      console.error("Error loading audiobooks:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os audiobooks",
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

  const toggleGlobal = async (id: string, currentValue: boolean | null) => {
    try {
      const { error } = await supabase
        .from("audiobooks")
        .update({ is_global: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setAudiobooks(audiobooks.map(ab => 
        ab.id === id ? { ...ab, is_global: !currentValue } : ab
      ));

      toast({
        title: "Atualizado",
        description: !currentValue ? "Audiobook agora é público" : "Audiobook agora é privado",
      });
    } catch (error: any) {
      console.error("Error updating audiobook:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o audiobook",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCover = async (audiobook: Audiobook) => {
    console.log('[Admin] 🚀 Starting cover generation for:', {
      id: audiobook.id,
      title: audiobook.title,
      author: audiobook.author,
      genre: audiobook.genre,
      currentCoverUrl: audiobook.cover_url
    });
    
    setGeneratingCoverId(audiobook.id);
    
    try {
      const newCoverUrl = await generateCover(
        audiobook.id,
        audiobook.title,
        audiobook.author,
        audiobook.genre || 'Ficção'
      );

      console.log('[Admin] Cover generation result:', newCoverUrl);

      if (newCoverUrl) {
        console.log('[Admin] ✅ Reloading audiobooks to get updated cover');
        // Reload audiobooks to get the updated cover
        await loadAudiobooks();
        
        toast({
          title: "Sucesso!",
          description: "Capa gerada e atualizada com sucesso",
        });
      } else {
        console.error('[Admin] ❌ No cover URL returned');
        toast({
          title: "Erro",
          description: "Não foi possível gerar a capa. Verifique os logs do console.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[Admin] ❌ Error in handleGenerateCover:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro desconhecido ao gerar capa",
        variant: "destructive",
      });
    } finally {
      setGeneratingCoverId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">Gerenciar Audiobooks</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Total de audiobooks: {audiobooks.length}
          </p>
          <Button onClick={() => navigate("/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Audiobook
          </Button>
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
              <CardTitle className="mb-2">Nenhum audiobook cadastrado</CardTitle>
              <CardDescription className="mb-4">
                Comece adicionando seu primeiro audiobook
              </CardDescription>
              <Button onClick={() => navigate("/upload")}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Audiobook
              </Button>
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
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`global-${book.id}`}>Público</Label>
                    <Switch
                      id={`global-${book.id}`}
                      checked={book.is_global ?? false}
                      onCheckedChange={() => toggleGlobal(book.id, book.is_global)}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('[Admin] 🎯 Button clicked for:', book.title);
                      handleGenerateCover(book);
                    }}
                    disabled={generatingCoverId === book.id}
                    className="w-full"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {generatingCoverId === book.id ? 'Gerando Capa...' : book.cover_url ? 'Regerar Capa com IA' : 'Gerar Capa com IA'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/audiobook/${book.id}`)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(book.id)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
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
