import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCoverGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateCover = async (audiobookId: string, title: string, author: string, genre: string) => {
    setIsGenerating(true);
    
    try {
      console.log('[CoverGen] 🎨 Starting cover generation for:', { title, author, genre });
      
      // Call the cover generation edge function
      const { data: coverResult, error: coverError } = await supabase.functions.invoke(
        'generate-audiobook-cover',
        { 
          body: { 
            title,
            author,
            genre: genre || 'Ficção'
          } 
        }
      );

      console.log('[CoverGen] Edge function response:', { coverResult, coverError });

      if (coverError) {
        console.error('[CoverGen] ❌ Edge function error:', coverError);
        throw coverError;
      }

      if (!coverResult?.imageUrl) {
        console.error('[CoverGen] ❌ No image URL in response:', coverResult);
        throw new Error('No image URL returned from cover generation');
      }

      console.log('[CoverGen] ✅ Cover URL received, uploading to storage...');

      let imageBlob: Blob;

      // Check if the image is already in base64 format
      if (coverResult.imageUrl.startsWith('data:')) {
        console.log('[CoverGen] Image is in base64 format, converting to blob...');
        // Convert base64 to blob
        const base64Data = coverResult.imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        imageBlob = new Blob([byteArray], { type: 'image/jpeg' });
      } else {
        console.log('[CoverGen] Downloading image from URL...');
        // Download the image
        imageBlob = await fetch(coverResult.imageUrl).then(r => {
          if (!r.ok) throw new Error(`Failed to download image: ${r.status}`);
          return r.blob();
        });
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('[CoverGen] 📤 User authenticated:', user.id);

      // Upload to storage
      const coverPath = `${user.id}/${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}_cover.png`;
      console.log('[CoverGen] 📤 Uploading to path:', coverPath);
      console.log('[CoverGen] 📦 Blob size:', imageBlob.size, 'bytes');
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('audiobook-covers')
        .upload(coverPath, imageBlob);

      console.log('[CoverGen] Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('[CoverGen] ❌ Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audiobook-covers')
        .getPublicUrl(coverPath);

      console.log('[CoverGen] 📸 Public URL:', publicUrl);
      console.log('[CoverGen] 💾 Updating audiobook:', audiobookId, 'with cover URL:', publicUrl);

      // Update audiobook record
      const { error: updateError, data: updateData } = await supabase
        .from('audiobooks')
        .update({ cover_url: publicUrl })
        .eq('id', audiobookId);

      console.log('[CoverGen] Database update result:', { updateData, updateError });

      if (updateError) {
        console.error('[CoverGen] ❌ Database update error:', updateError);
        throw updateError;
      }

      console.log('[CoverGen] ✅ Cover generated successfully');

      toast({
        title: 'Capa gerada!',
        description: 'A capa foi gerada e salva com sucesso.',
      });

      return publicUrl;
    } catch (error: any) {
      console.error('[CoverGen] ❌ Complete error:', error);
      
      let errorMessage = 'Não foi possível gerar a capa';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Erro ao gerar capa',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCover, isGenerating };
};
