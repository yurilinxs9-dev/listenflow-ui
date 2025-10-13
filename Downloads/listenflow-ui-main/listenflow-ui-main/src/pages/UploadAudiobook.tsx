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
import { useGenerateReviews } from "@/hooks/useGenerateReviews";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validateAudioFile, validateImageFile, validateFileName } from "@/lib/fileValidation";
import { generateSecureFilename } from "@/lib/securityUtils";

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
  uploadProgress: number;
  error: string | null;
}

export default function UploadAudiobook() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { generateReviews } = useGenerateReviews();
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

  const compressImage = async (imageBlob: Blob, maxWidth = 800, quality = 0.85): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionar mantendo proporção
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao comprimir imagem'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const processAudiobookMetadata = async (file: File, id: string) => {
    try {
      console.log(`[Upload] 📝 Processing metadata for: ${file.name}`);
      
      // Get duration
      const duration = await getAudioDuration(file);
      console.log(`[Upload] ⏱️ Duration: ${duration}s`);
      
      // Get metadata from AI
      const { data: metadataResult, error: metadataError } = await supabase.functions.invoke(
        'process-audiobook-metadata',
        { body: { filename: file.name } }
      );

      if (metadataError) {
        console.error('[Upload] ❌ Metadata error:', metadataError);
        throw metadataError;
      }
      
      console.log('[Upload] ✅ Metadata:', metadataResult);

      // Generate cover
      console.log('[Upload] 🎨 Generating cover...');
      const { data: coverResult, error: coverError } = await supabase.functions.invoke(
        'generate-audiobook-cover',
        { 
          body: { 
            title: metadataResult.title,
            author: metadataResult.author,
            genre: metadataResult.genre
          } 
        }
      );

      if (coverError) {
        console.error('[Upload] ❌ Cover generation error:', coverError);
      }

      console.log('[Upload] Cover result:', {
        hasImageUrl: !!coverResult?.imageUrl,
        imageUrlLength: coverResult?.imageUrl?.length,
        imageUrlPrefix: coverResult?.imageUrl?.substring(0, 50)
      });

      return {
        ...metadataResult,
        durationSeconds: duration,
        coverBlob: coverResult?.imageUrl || null,
      };
    } catch (error) {
      console.error('[Upload] ❌ Error processing metadata:', error);
      return null;
    }
  };

  const handleAudioFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // SEGURANÇA: Validar cada arquivo antes de adicionar
    const validatedFiles = await Promise.all(
      files.map(async (file) => {
        // Validar nome do arquivo
        const nameValidation = validateFileName(file.name);
        if (!nameValidation.valid) {
          toast({
            title: "Arquivo inválido",
            description: `${file.name}: ${nameValidation.error}`,
            variant: "destructive",
          });
          return null;
        }
        
        // Validar tipo MIME real
        const validation = await validateAudioFile(file);
        if (!validation.valid) {
          toast({
            title: "Arquivo de áudio inválido",
            description: `${file.name}: ${validation.error}`,
            variant: "destructive",
          });
          return null;
        }
        
        console.log(`[Upload] ✅ Arquivo validado: ${file.name} (${validation.detectedType})`);
        
        return {
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
          uploadProgress: 0,
          error: null,
        };
      })
    );
    
    // Filtrar arquivos nulos (inválidos)
    const newAudiobooks = validatedFiles.filter((ab): ab is AudiobookForm => ab !== null);
    
    if (newAudiobooks.length === 0) {
      toast({
        title: "Nenhum arquivo válido",
        description: "Todos os arquivos selecionados foram rejeitados.",
        variant: "destructive",
      });
      return;
    }
    
    if (newAudiobooks.length < files.length) {
      toast({
        title: "Alguns arquivos foram rejeitados",
        description: `${newAudiobooks.length} de ${files.length} arquivos são válidos.`,
      });
    }
    
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

  const updateAudiobook = async (id: string, field: keyof AudiobookForm, value: any) => {
    // SEGURANÇA: Validar arquivo de capa se for o campo coverFile
    if (field === 'coverFile' && value instanceof File) {
      const validation = await validateImageFile(value);
      if (!validation.valid) {
        toast({
          title: "Imagem inválida",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      console.log(`[Upload] ✅ Capa validada: ${value.name} (${validation.detectedType})`);
    }
    
    setAudiobooks(prev => prev.map(ab => 
      ab.id === id ? { ...ab, [field]: value } : ab
    ));
  };

  const removeAudiobook = (id: string) => {
    setAudiobooks(audiobooks.filter(ab => ab.id !== id));
  };

  const sanitizeFilename = (filename: string): string => {
    return filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Remove caracteres especiais
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_+|_+$/g, ''); // Remove underscores no início/fim
  };

  // NOTA: Função antiga removida, usando generateSecureFilename() da lib de segurança

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[Submit] 🚀 Iniciando processo de upload');
    console.log('[Submit] Total de audiobooks:', audiobooks.length);
    
    // Log detalhado de cada audiobook
    audiobooks.forEach((ab, idx) => {
      console.log(`[Submit] Audiobook ${idx + 1}:`, {
        title: ab.title || '(vazio)',
        author: ab.author || '(vazio)',
        duration: ab.durationSeconds,
        isProcessing: ab.isProcessing,
        hasError: !!ab.error
      });
    });
    
    if (!user) {
      console.log('[Submit] ❌ Usuário não logado');
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    console.log('[Submit] ✅ Usuário logado:', user.id);

    if (audiobooks.length === 0) {
      console.log('[Submit] ❌ Nenhum audiobook selecionado');
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo de áudio",
        variant: "destructive",
      });
      return;
    }

    // Verificar se algum audiobook ainda está processando
    const processingAudiobooks = audiobooks.filter(ab => ab.isProcessing);
    if (processingAudiobooks.length > 0) {
      console.log('[Submit] ⏳ Ainda processando:', processingAudiobooks.length);
      toast({
        title: "Aguarde",
        description: `${processingAudiobooks.length} audiobook(s) ainda está(ão) sendo processado(s) pela IA...`,
        variant: "default",
      });
      return;
    }

    // Validar campos obrigatórios
    console.log('[Submit] Validando campos obrigatórios...');
    const invalidAudiobooks = audiobooks.filter(ab => {
      const isInvalid = !ab.title || !ab.author || ab.durationSeconds === 0;
      if (isInvalid) {
        console.log('[Submit] ❌ Audiobook inválido:', {
          id: ab.id,
          title: ab.title || '(vazio)',
          author: ab.author || '(vazio)',
          duration: ab.durationSeconds,
          fileName: ab.audioFile.name
        });
      }
      return isInvalid;
    });
    
    if (invalidAudiobooks.length > 0) {
      console.log('[Submit] ❌ Audiobooks inválidos encontrados:', invalidAudiobooks.length);
      const missingFields = invalidAudiobooks.map(ab => {
        const missing = [];
        if (!ab.title) missing.push('título');
        if (!ab.author) missing.push('autor');
        if (ab.durationSeconds === 0) missing.push('duração');
        return `${ab.audioFile.name}: ${missing.join(', ')}`;
      });
      toast({
        title: "Campos obrigatórios faltando",
        description: `Preencha: ${missingFields[0]}${missingFields.length > 1 ? ' e mais ' + (missingFields.length - 1) : ''}`,
        variant: "destructive",
      });
      return;
    }

    console.log('[Submit] ✅ Todos os audiobooks são válidos');
    console.log('[Submit] Iniciando uploads sequenciais (um por um)...');
    setIsUploading(true);

    try {
      const results = [];
      
      // Processar uploads sequencialmente, um por um
      for (let index = 0; index < audiobooks.length; index++) {
        const audiobook = audiobooks[index];
        try {
          const fileSize = (audiobook.audioFile.size / 1024 / 1024).toFixed(2);
          console.log(`[Upload ${index + 1}/${audiobooks.length}] 🚀 Iniciando: ${audiobook.title} (${fileSize} MB)`);
          
          // Renovar sessão para garantir token válido
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !currentSession) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          console.log(`[Upload ${index + 1}] 🔐 Token renovado, válido até: ${new Date(currentSession.expires_at! * 1000).toLocaleTimeString()}`);
          
          // Verificar se já existe audiobook com mesmo título e autor
          console.log(`[Upload ${index + 1}] 🔍 Verificando duplicatas...`);
          const { data: existingAudiobooks, error: checkError } = await supabase
            .from('audiobooks')
            .select('id, title, author')
            .eq('title', audiobook.title.trim())
            .eq('author', audiobook.author.trim())
            .eq('user_id', user.id);

          if (checkError) {
            console.error(`[Upload ${index + 1}] ❌ Erro ao verificar duplicatas:`, checkError);
          } else if (existingAudiobooks && existingAudiobooks.length > 0) {
            console.log(`[Upload ${index + 1}] ⏭️ PULADO (já existe): ${audiobook.title}`);
            updateAudiobook(audiobook.id, 'error', 'Já existe no banco de dados');
            results.push({ success: false, title: audiobook.title, skipped: true });
            continue;
          }
          
          // Atualizar progresso: iniciando
          updateAudiobook(audiobook.id, 'uploadProgress', 10);
          console.log(`[Upload ${index + 1}] ⏳ Progresso: 10% (Preparando...)`);
          
          // SEGURANÇA: Gerar nome criptograficamente seguro para o arquivo
          const audioPath = generateSecureFilename(audiobook.audioFile.name, user.id);
          console.log(`[Upload ${index + 1}] 📁 Path: ${audioPath}`);
          
          // Atualizar progresso: fazendo upload do áudio
          updateAudiobook(audiobook.id, 'uploadProgress', 20);
          console.log(`[Upload ${index + 1}] ⏳ Progresso: 20% (Enviando áudio ${fileSize} MB...)`);
          
          const uploadStart = Date.now();
          
          // Use resumable upload for large files (>50MB)
          const fileSizeMB = audiobook.audioFile.size / (1024 * 1024);
          let audioError;
          
          if (fileSizeMB > 50) {
            console.log(`[Upload ${index + 1}] 📦 Usando upload resumable (arquivo grande: ${fileSize} MB)`);
            const { error } = await supabase.storage
              .from("audiobooks")
              .upload(audioPath, audiobook.audioFile, {
                cacheControl: '3600',
                upsert: false,
              });
            audioError = error;
          } else {
            const { error } = await supabase.storage
              .from("audiobooks")
              .upload(audioPath, audiobook.audioFile);
            audioError = error;
          }

          const uploadTime = ((Date.now() - uploadStart) / 1000).toFixed(1);
          
          if (audioError) {
            console.error(`[Upload ${index + 1}] ❌ ERRO ao enviar áudio:`, audioError);
            throw audioError;
          }
          
          console.log(`[Upload ${index + 1}] ✅ Áudio enviado em ${uploadTime}s: ${audiobook.title}`);

          // Atualizar progresso: áudio enviado
          updateAudiobook(audiobook.id, 'uploadProgress', 50);
          console.log(`[Upload ${index + 1}] ⏳ Progresso: 50% (Processando capa...)`);

          const { data: { publicUrl: audioUrl } } = supabase.storage
            .from("audiobooks")
            .getPublicUrl(audioPath);

          console.log(`[Upload] URL do áudio: ${audioUrl}`);

          // Upload cover file if provided
          let coverUrl = "";
          
          updateAudiobook(audiobook.id, 'uploadProgress', 60);
          
          if (audiobook.coverFile) {
            console.log(`[Upload ${index + 1}] 📸 Comprimindo capa customizada...`);
            const originalSize = (audiobook.coverFile.size / 1024).toFixed(2);
            const compressedCover = await compressImage(audiobook.coverFile);
            const compressedSize = (compressedCover.size / 1024).toFixed(2);
            console.log(`[Upload ${index + 1}] ✅ Capa comprimida: ${originalSize}KB → ${compressedSize}KB`);
            
            const coverPath = generateSecureFilename('cover.jpg', user.id);
            const { error: coverError } = await supabase.storage
              .from("audiobook-covers")
              .upload(coverPath, compressedCover);

            if (coverError) {
              console.error(`[Upload ${index + 1}] ❌ Erro ao enviar capa:`, coverError);
              throw coverError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from("audiobook-covers")
              .getPublicUrl(coverPath);
            
            coverUrl = publicUrl;
            console.log(`[Upload ${index + 1}] ✅ Capa enviada: ${coverUrl}`);
          } else if (audiobook.coverBlob) {
            try {
              console.log(`[Upload ${index + 1}] 🎨 Processando capa gerada por IA...`);
              
              // Convert base64 or URL to blob
              let coverBlob: Blob;
              
              if (audiobook.coverBlob.startsWith('data:')) {
                const base64Data = audiobook.coverBlob.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                coverBlob = new Blob([byteArray], { type: 'image/jpeg' });
              } else {
                const response = await fetch(audiobook.coverBlob);
                if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
                coverBlob = await response.blob();
              }
              
              console.log(`[Upload ${index + 1}] 📸 Comprimindo capa IA...`);
              const originalSize = (coverBlob.size / 1024).toFixed(2);
              const compressedCover = await compressImage(coverBlob);
              const compressedSize = (compressedCover.size / 1024).toFixed(2);
              console.log(`[Upload ${index + 1}] ✅ Capa IA comprimida: ${originalSize}KB → ${compressedSize}KB`);
              
              const coverPath = generateSecureFilename('cover.jpg', user.id);
              
              const { error: coverError } = await supabase.storage
                .from("audiobook-covers")
                .upload(coverPath, compressedCover);

              if (coverError) {
                console.error(`[Upload ${index + 1}] ❌ Erro ao enviar capa:`, coverError);
                throw coverError;
              }

              const { data: { publicUrl } } = supabase.storage
                .from("audiobook-covers")
                .getPublicUrl(coverPath);
              
              coverUrl = publicUrl;
              console.log(`[Upload ${index + 1}] ✅ Capa IA enviada: ${coverUrl}`);
            } catch (coverFetchError: any) {
              console.error(`[Upload ${index + 1}] ❌ Falha no upload da capa:`, coverFetchError);
            }
          }
          
          updateAudiobook(audiobook.id, 'uploadProgress', 80);

          // Validação final antes de inserir no banco
          if (!audiobook.title || !audiobook.author || !audiobook.durationSeconds) {
            throw new Error('Metadados incompletos: título, autor ou duração faltando');
          }

          console.log(`[Upload] Inserindo registro no banco de dados`);
          
          // Create audiobook record
          const { data: insertedData, error: dbError } = await supabase
            .from("audiobooks")
            .insert({
              user_id: user.id,
              title: audiobook.title.trim(),
              author: audiobook.author.trim(),
              narrator: audiobook.narrator?.trim() || null,
              description: audiobook.description?.trim() || null,
              genre: audiobook.genre?.trim() || null,
              duration_seconds: audiobook.durationSeconds,
              audio_url: audioUrl,
              cover_url: coverUrl || null,
              file_size: audiobook.audioFile.size,
            })
            .select()
            .single();

          if (dbError) {
            console.error(`[Upload] Erro ao inserir no banco:`, dbError);
            throw dbError;
          }

          console.log(`[Upload ${index + 1}] 🎉 CONCLUÍDO COM SUCESSO: ${audiobook.title}`);
          
          // Gerar avaliações automaticamente em segundo plano
          if (insertedData) {
            console.log(`[Upload ${index + 1}] 📝 Iniciando geração de avaliações...`);
            // Não espera a conclusão, apenas inicia o processo
            const reviewCount = Math.floor(Math.random() * 6) + 3; // 3 a 8 avaliações
            generateReviews(
              insertedData.id,
              audiobook.title.trim(),
              audiobook.author.trim(),
              reviewCount
            ).catch(err => {
              console.error(`[Upload ${index + 1}] Erro ao gerar avaliações:`, err);
            });
          }
          
          updateAudiobook(audiobook.id, 'uploadProgress', 100);
          results.push({ success: true, title: audiobook.title });
        } catch (error: any) {
          console.error(`[Upload ${index + 1}] 💥 FALHOU: ${audiobook.title}`, error);
          updateAudiobook(audiobook.id, 'error', error.message || 'Erro desconhecido');
          updateAudiobook(audiobook.id, 'uploadProgress', 0);
          results.push({ success: false, title: audiobook.title });
        }
      }
      
      const successCount = results.filter((r: any) => r.success).length;
      const skippedCount = results.filter((r: any) => !r.success && r.skipped).length;
      const errorCount = results.filter((r: any) => !r.success && !r.skipped).length;

      console.log('[Submit] 📊 RESUMO FINAL:');
      console.log(`[Submit] ✅ Sucessos: ${successCount}`);
      console.log(`[Submit] ⏭️ Pulados (duplicados): ${skippedCount}`);
      console.log(`[Submit] ❌ Falhas: ${errorCount}`);
      results.forEach((r: any, i) => {
        const icon = r.success ? '✅' : (r.skipped ? '⏭️' : '❌');
        console.log(`[Submit] ${icon} ${i + 1}. ${r.title}`);
      });

      if (successCount > 0) {
        const description = `${successCount} audiobook(s) enviado(s)${skippedCount > 0 ? `, ${skippedCount} pulado(s) (já existente)` : ''}${errorCount > 0 ? `, ${errorCount} falharam` : ''}`;
        toast({
          title: "Sucesso!",
          description,
        });
        navigate("/my-audiobooks");
      } else if (skippedCount > 0) {
        toast({
          title: "Nenhum upload realizado",
          description: `${skippedCount} audiobook(s) já existem no banco de dados`,
        });
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
                            onError={(e) => {
                              console.error('[Upload] ❌ Failed to load cover image:', {
                                audiobookId: audiobook.id,
                                title: audiobook.title,
                                coverBlobPrefix: audiobook.coverBlob?.substring(0, 50)
                              });
                            }}
                            onLoad={() => {
                              console.log('[Upload] ✅ Cover image loaded successfully:', audiobook.title);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Capa gerada por IA</p>
                        </div>
                      )}

                      {audiobook.error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                          <p className="text-sm text-destructive font-medium">Erro: {audiobook.error}</p>
                        </div>
                      )}

                      {audiobook.uploadProgress > 0 && audiobook.uploadProgress < 100 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Enviando...</span>
                            <span>{audiobook.uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${audiobook.uploadProgress}%` }}
                            />
                          </div>
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
