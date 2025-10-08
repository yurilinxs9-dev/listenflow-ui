import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const UpdateCover = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audiobookId, setAudiobookId] = useState("d3fd102e-674d-4628-bb8d-44ac2b074246");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !audiobookId) {
      toast.error("Selecione uma imagem e informe o ID do audiobook");
      return;
    }

    setUploading(true);
    try {
      // Buscar informações do audiobook
      const { data: audiobook, error: fetchError } = await supabase
        .from('audiobooks')
        .select('user_id, title')
        .eq('id', audiobookId)
        .single();

      if (fetchError || !audiobook) {
        toast.error('Audiobook não encontrado');
        return;
      }

      // Fazer upload da imagem
      const fileName = `${Date.now()}_${audiobook.title.replace(/[^a-zA-Z0-9]/g, '_')}_cover.jpg`;
      const filePath = `${audiobook.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audiobook-covers')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return;
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('audiobook-covers')
        .getPublicUrl(filePath);

      // Atualizar o registro do audiobook
      const { error: updateError } = await supabase
        .from('audiobooks')
        .update({ cover_url: publicUrlData.publicUrl })
        .eq('id', audiobookId);

      if (updateError) {
        console.error('Erro ao atualizar audiobook:', updateError);
        toast.error('Erro ao atualizar audiobook');
        return;
      }

      toast.success('Capa atualizada com sucesso!');
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar capa');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20 container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 gradient-hero bg-clip-text text-transparent">
            Atualizar Capa do Audiobook
          </h1>

          <div className="space-y-6 bg-secondary p-6 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">
                ID do Audiobook
              </label>
              <Input
                value={audiobookId}
                onChange={(e) => setAudiobookId(e.target.value)}
                placeholder="ID do audiobook"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID atual: Mais Esperto que o Diabo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nova Capa
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-background"
              />
            </div>

            {preview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-48 h-auto rounded-lg shadow-lg"
                />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                "Fazendo upload..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Atualizar Capa
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UpdateCover;
