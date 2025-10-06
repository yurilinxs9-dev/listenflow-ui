import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Music, Edit, Loader2, ArrowLeft } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
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
import { Badge } from "@/components/ui/badge";

interface Audiobook {
  id: string;
  title: string;
  author: string;
  narrator: string | null;
  genre: string | null;
  cover_url: string | null;
  duration_seconds: number;
  is_global: boolean;
  user_id: string;
  created_at: string;
}

export default function AdminAudiobooks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) {
      loadAudiobooks();
    }
  }, [isAdmin, adminLoading, navigate]);

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

  const toggleGlobal = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("audiobooks")
        .update({ is_global: !currentState })
        .eq("id", id);

      if (error) throw error;

      setAudiobooks(audiobooks.map(book => 
        book.id === id ? { ...book, is_global: !currentState } : book
      ));

      toast({
        title: "Sucesso",
        description: `Audiobook ${!currentState ? 'publicado' : 'despublicado'} com sucesso`,
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Gerenciar Audiobooks</h1>
            <p className="text-muted-foreground">Todos os audiobooks da plataforma</p>
          </div>
          <Button onClick={() => navigate("/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Audiobook
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : audiobooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhum audiobook ainda</CardTitle>
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
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={book.is_global ? "default" : "secondary"}>
                      {book.is_global ? "Público" : "Privado"}
                    </Badge>
                  </div>
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
                  <Button
                    variant={book.is_global ? "secondary" : "default"}
                    size="sm"
                    onClick={() => toggleGlobal(book.id, book.is_global)}
                    className="w-full"
                  >
                    {book.is_global ? 'Despublicar' : 'Publicar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/audiobook/${book.id}`)}
                    className="w-full"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Button>
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
