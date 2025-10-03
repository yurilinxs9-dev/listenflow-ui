import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, X, FileAudio, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AudiobookForm {
  id: string;
  audioFile: File;
  coverFile: File | null;
  coverBlob: string | null;
  title: string;
  author: string;
  narrator: string;
  description: string;
  genre: string;
  durationSeconds: number;
  isProcessing: boolean;
}

export default function UploadAudiobook() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [audiobooks, setAudiobooks] = useState<AudiobookForm[]>([]);

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const processAudiobookMetadata = async (file: File, id: string) => {
    try {
      // Get duration
      const duration = await getAudioDuration(file);
      
      // Get metadata from AI
      const { data: metadataResult, error: metadataError } = await supabase.functions.invoke(
        'process-audiobook-metadata',
        { body: { filename: file.name } }
      );

      if (metadataError) throw metadataError;

      // Generate cover
      const { data: coverResult } = await supabase.functions.invoke(
        'generate-audiobook-cover',
        { 
          body: { 
            title: metadataResult.title,
            author: metadataResult.author,
            genre: metadataResult.genre
          } 
        }
      );

      return {
        ...metadataResult,
        durationSeconds: duration,
        coverBlob: coverResult?.imageUrl || null,
      };
    } catch (error) {
      console.error('Error processing metadata:', error);
      return null;
    }
  };

  const handleAudioFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAudiobooks = files.map(file => ({
      id: crypto.randomUUID(),
      audioFile: file,
      coverFile: null,
      coverBlob: null,
      title: file.name.replace(/\.[^/.]+$/, ""),
      author: "",
      narrator: "",
      description: "",
      genre: "",
      durationSeconds: 0,
      isProcessing: true,
    }));
    
    setAudiobooks([...audiobooks, ...newAudiobooks]);

    // Process each audiobook in parallel
    newAudiobooks.forEach(async (audiobook) => {
      const metadata = await processAudiobookMetadata(audiobook.audioFile, audiobook.id);
      
      if (metadata) {
        setAudiobooks(prev => prev.map(ab => 
          ab.id === audiobook.id 
            ? { 
                ...ab, 
                ...metadata,
                isProcessing: false 
              } 
            : ab
        ));
      } else {
        setAudiobooks(prev => prev.map(ab => 
          ab.id === audiobook.id 
            ? { ...ab, isProcessing: false } 
            : ab
        ));
      }
    });
  };

  const updateAudiobook = (id: string, field: keyof AudiobookForm, value: any) => {
    setAudiobooks(audiobooks.map(ab => 
      ab.id === id ? { ...ab, [field]: value } : ab
    ));
  };

  const removeAudiobook = (id: string) => {
    setAudiobooks(audiobooks.filter(ab => ab.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (audiobooks.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo de áudio",
        variant: "destructive",
      });
      return;
    }

    // Validar campos obrigatórios
    const invalidAudiobooks = audiobooks.filter(ab => !ab.title || !ab.author || ab.durationSeconds === 0);
    if (invalidAudiobooks.length > 0) {
      toast({
        title: "Erro",
        description: "Preencha título, autor e duração para todos os audiobooks",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const audiobook of audiobooks) {
        try {
          // Upload audio file
          const audioPath = `${user.id}/${Date.now()}_${audiobook.audioFile.name}`;
          const { error: audioError } = await supabase.storage
            .from("audiobooks")
            .upload(audioPath, audiobook.audioFile);

          if (audioError) throw audioError;

          const { data: { publicUrl: audioUrl } } = supabase.storage
            .from("audiobooks")
            .getPublicUrl(audioPath);

          // Upload cover file if provided
          let coverUrl = "";
          if (audiobook.coverFile) {
            const coverPath = `${user.id}/${Date.now()}_${audiobook.coverFile.name}`;
            const { error: coverError } = await supabase.storage
              .from("audiobook-covers")
              .upload(coverPath, audiobook.coverFile);

            if (coverError) throw coverError;

            const { data: { publicUrl } } = supabase.storage
              .from("audiobook-covers")
              .getPublicUrl(coverPath);
            
            coverUrl = publicUrl;
          } else if (audiobook.coverBlob) {
            // Upload AI-generated cover
            const coverBlob = await fetch(audiobook.coverBlob).then(r => r.blob());
            const coverPath = `${user.id}/${Date.now()}_cover.png`;
            const { error: coverError } = await supabase.storage
              .from("audiobook-covers")
              .upload(coverPath, coverBlob);

            if (!coverError) {
              const { data: { publicUrl } } = supabase.storage
                .from("audiobook-covers")
                .getPublicUrl(coverPath);
              coverUrl = publicUrl;
            }
          }

          // Create audiobook record
          const { error: dbError } = await supabase.from("audiobooks").insert({
            user_id: user.id,
            title: audiobook.title,
            author: audiobook.author,
            narrator: audiobook.narrator || null,
            description: audiobook.description || null,
            genre: audiobook.genre || null,
            duration_seconds: audiobook.durationSeconds,
            audio_url: audioUrl,
            cover_url: coverUrl || null,
            file_size: audiobook.audioFile.size,
          });

          if (dbError) throw dbError;

          successCount++;
        } catch (error: any) {
          console.error(`Erro ao enviar ${audiobook.title}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Sucesso!",
          description: `${successCount} audiobook(s) enviado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falharam` : ''}`,
        });
        navigate("/my-audiobooks");
      } else {
        toast({
          title: "Erro",
          description: "Nenhum audiobook foi enviado com sucesso",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar os audiobooks",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload em Massa</h1>
          <p className="text-muted-foreground">
            Selecione múltiplos arquivos de áudio e preencha os detalhes de cada um
          </p>
        </div>
        
        <div className="space-y-6">
          <Card className="p-6">
            <Label htmlFor="audio-files" className="block mb-2">
              Selecionar Arquivos de Áudio *
            </Label>
            <Input
              id="audio-files"
              type="file"
              accept="audio/*"
              multiple
              onChange={handleAudioFilesSelect}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {audiobooks.length} arquivo(s) selecionado(s)
            </p>
          </Card>

          {audiobooks.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <ScrollArea className="h-[600px] rounded-md border p-4">
                <div className="space-y-6">
                  {audiobooks.map((audiobook, index) => (
                    <Card key={audiobook.id} className="p-6 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4"
                        onClick={() => removeAudiobook(audiobook.id)}
                        disabled={isUploading || audiobook.isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-3 mb-4">
                        {audiobook.isProcessing ? (
                          <>
                            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            <h3 className="text-lg font-semibold">Processando com IA... {index + 1}</h3>
                          </>
                        ) : (
                          <>
                            <FileAudio className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Audiobook {index + 1}</h3>
                          </>
                        )}
                      </div>

                      {audiobook.coverBlob && (
                        <div className="mb-4">
                          <img 
                            src={audiobook.coverBlob} 
                            alt="Capa gerada"
                            className="w-32 h-32 object-cover rounded"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Capa gerada por IA</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`title-${audiobook.id}`}>Título *</Label>
                          <Input
                            id={`title-${audiobook.id}`}
                            value={audiobook.title}
                            onChange={(e) => updateAudiobook(audiobook.id, 'title', e.target.value)}
                            required
                            disabled={isUploading || audiobook.isProcessing}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`author-${audiobook.id}`}>Autor *</Label>
                          <Input
                            id={`author-${audiobook.id}`}
                            value={audiobook.author}
                            onChange={(e) => updateAudiobook(audiobook.id, 'author', e.target.value)}
                            required
                            disabled={isUploading || audiobook.isProcessing}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`narrator-${audiobook.id}`}>Narrador</Label>
                          <Input
                            id={`narrator-${audiobook.id}`}
                            value={audiobook.narrator}
                            onChange={(e) => updateAudiobook(audiobook.id, 'narrator', e.target.value)}
                            disabled={isUploading || audiobook.isProcessing}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`genre-${audiobook.id}`}>Gênero</Label>
                          <Input
                            id={`genre-${audiobook.id}`}
                            value={audiobook.genre}
                            onChange={(e) => updateAudiobook(audiobook.id, 'genre', e.target.value)}
                            placeholder="Ex: Ficção, Romance, Biografia"
                            disabled={isUploading || audiobook.isProcessing}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`duration-${audiobook.id}`}>Duração (segundos) *</Label>
                          <Input
                            id={`duration-${audiobook.id}`}
                            type="number"
                            value={audiobook.durationSeconds}
                            onChange={(e) => updateAudiobook(audiobook.id, 'durationSeconds', Number(e.target.value))}
                            required
                            disabled={isUploading || audiobook.isProcessing}
                            placeholder="Calculado automaticamente..."
                          />
                        </div>

                        <div>
                          <Label htmlFor={`cover-${audiobook.id}`}>Imagem de Capa</Label>
                          <Input
                            id={`cover-${audiobook.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => updateAudiobook(audiobook.id, 'coverFile', e.target.files?.[0] || null)}
                            disabled={isUploading || audiobook.isProcessing}
                          />
                          {audiobook.coverFile && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {audiobook.coverFile.name}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor={`description-${audiobook.id}`}>Descrição</Label>
                          <Textarea
                            id={`description-${audiobook.id}`}
                            value={audiobook.description}
                            onChange={(e) => updateAudiobook(audiobook.id, 'description', e.target.value)}
                            rows={3}
                            disabled={isUploading || audiobook.isProcessing}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">
                            Arquivo: {audiobook.audioFile.name} ({(audiobook.audioFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t">
                <Button type="submit" disabled={isUploading} className="flex-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando {audiobooks.length} audiobook(s)...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Todos ({audiobooks.length})
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
