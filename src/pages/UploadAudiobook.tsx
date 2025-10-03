import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UploadAudiobook() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    narrator: "",
    description: "",
    genre: "",
    durationSeconds: 0,
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

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

    if (!audioFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de áudio",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      const audioPath = `${user.id}/${Date.now()}_${audioFile.name}`;
      const { error: audioError } = await supabase.storage
        .from("audiobooks")
        .upload(audioPath, audioFile);

      if (audioError) throw audioError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from("audiobooks")
        .getPublicUrl(audioPath);

      // Upload cover file if provided
      let coverUrl = "";
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}_${coverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from("audiobook-covers")
          .upload(coverPath, coverFile);

        if (coverError) throw coverError;

        const { data: { publicUrl } } = supabase.storage
          .from("audiobook-covers")
          .getPublicUrl(coverPath);
        
        coverUrl = publicUrl;
      }

      // Create audiobook record
      const { error: dbError } = await supabase.from("audiobooks").insert({
        user_id: user.id,
        title: formData.title,
        author: formData.author,
        narrator: formData.narrator || null,
        description: formData.description || null,
        genre: formData.genre || null,
        duration_seconds: formData.durationSeconds,
        audio_url: audioUrl,
        cover_url: coverUrl || null,
        file_size: audioFile.size,
      });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso!",
        description: "Audiobook enviado com sucesso",
      });

      navigate("/my-audiobooks");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar o audiobook",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Enviar Audiobook</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="author">Autor *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="narrator">Narrador</Label>
            <Input
              id="narrator"
              value={formData.narrator}
              onChange={(e) => setFormData({ ...formData, narrator: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="genre">Gênero</Label>
            <Input
              id="genre"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              placeholder="Ex: Ficção, Romance, Biografia"
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="duration">Duração (em segundos) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.durationSeconds}
              onChange={(e) => setFormData({ ...formData, durationSeconds: Number(e.target.value) })}
              required
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="audio">Arquivo de Áudio *</Label>
            <Input
              id="audio"
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              required
              disabled={isUploading}
            />
            {audioFile && (
              <p className="text-sm text-muted-foreground mt-1">
                {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cover">Imagem de Capa</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              disabled={isUploading}
            />
            {coverFile && (
              <p className="text-sm text-muted-foreground mt-1">
                {coverFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isUploading} className="flex-1">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Audiobook
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
      </main>
    </div>
  );
}
