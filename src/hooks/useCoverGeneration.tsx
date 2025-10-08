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

      // Convert base64 to blob
      console.log('[CoverGen] Converting image to blob...');
      const base64Data = coverResult.imageUrl.split(',')[1];
      
      if (!base64Data) {
        throw new Error('Invalid base64 data received from cover generation');
      }
      
      // More efficient base64 to blob conversion
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const imageBlob = new Blob([bytes], { type: 'image/png' });

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
        .upload(coverPath, imageBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true
        });

      console.log('[CoverGen] Upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('[CoverGen] ❌ Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const publicUrlResult = supabase.storage
        .from('audiobook-covers')
        .getPublicUrl(coverPath);

      console.log('[CoverGen] 📸 Public URL result:', publicUrlResult);
      
      const publicUrl = publicUrlResult.data.publicUrl;
      console.log('[CoverGen] 📸 Extracted public URL:', publicUrl);
      console.log('[CoverGen] 📸 Public URL type:', typeof publicUrl);
      console.log('[CoverGen] 📸 Public URL length:', publicUrl?.length);

      if (!publicUrl || publicUrl.length === 0) {
        throw new Error('Failed to generate public URL');
      }

      console.log('[CoverGen] 💾 Updating audiobook:', audiobookId);
      console.log('[CoverGen] 💾 With cover URL:', publicUrl);
      console.log('[CoverGen] 💾 publicUrl is valid?', !!publicUrl, publicUrl?.length);

      // Verify the URL is accessible before saving
      try {
        const testResponse = await fetch(publicUrl);
        console.log('[CoverGen] 🔍 URL accessibility test:', testResponse.ok, testResponse.status);
      } catch (testError) {
        console.error('[CoverGen] ⚠️ URL not accessible:', testError);
      }

      // Update audiobook record
      const { error: updateError, data: updateData } = await supabase
        .from('audiobooks')
        .update({ cover_url: publicUrl })
        .eq('id', audiobookId)
        .select();

      console.log('[CoverGen] Database update result:', { updateData, updateError });
      
      if (updateData && updateData.length > 0) {
        console.log('[CoverGen] ✅ Updated audiobook cover_url:', updateData[0].cover_url);
      }

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
