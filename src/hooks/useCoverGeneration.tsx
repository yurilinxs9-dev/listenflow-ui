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
      
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated - please login and try again');
      }

      console.log('[CoverGen] 📤 User authenticated:', user.id);
      
      // Call the cover generation edge function with all needed data
      const { data: coverResult, error: coverError } = await supabase.functions.invoke(
        'generate-audiobook-cover',
        { 
          body: { 
            title,
            author,
            genre: genre || 'Ficção',
            audiobookId,
            userId: user.id
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

      const publicUrl = coverResult.imageUrl;
      console.log('[CoverGen] ✅ Cover URL received:', publicUrl);

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
