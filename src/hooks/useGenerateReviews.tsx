import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGenerateReviews = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReviews = async (
    audiobookId: string,
    title: string,
    author: string,
    maxReviews: number = 5
  ) => {
    setIsGenerating(true);
    try {
      console.log(`[useGenerateReviews] Generating reviews for: ${title}`);
      
      const { data, error } = await supabase.functions.invoke('generate-book-reviews', {
        body: {
          audiobookId,
          title,
          author,
          maxReviews,
        },
      });

      if (error) {
        console.error('[useGenerateReviews] Error:', error);
        toast({
          title: 'Erro ao gerar avaliações',
          description: error.message || 'Não foi possível gerar as avaliações',
          variant: 'destructive',
        });
        return null;
      }

      console.log(`[useGenerateReviews] Successfully generated ${data.count} reviews`);
      
      toast({
        title: 'Avaliações geradas!',
        description: `${data.count} avaliações foram criadas com sucesso`,
      });

      return data;
    } catch (error) {
      console.error('[useGenerateReviews] Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao gerar as avaliações',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReviewsForAllBooks = async () => {
    setIsGenerating(true);
    try {
      // Buscar todos os audiobooks que ainda não têm avaliações
      const { data: audiobooks, error: fetchError } = await supabase
        .from('audiobooks')
        .select('id, title, author')
        .not('audio_url', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      if (!audiobooks || audiobooks.length === 0) {
        toast({
          title: 'Nenhum audiobook encontrado',
          description: 'Não há audiobooks para gerar avaliações',
        });
        return;
      }

      console.log(`[useGenerateReviews] Processing ${audiobooks.length} audiobooks`);
      
      let successCount = 0;
      
      for (const audiobook of audiobooks) {
        // Verificar se já tem avaliações
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('id')
          .eq('audiobook_id', audiobook.id);

        if (existingReviews && existingReviews.length > 0) {
          console.log(`[useGenerateReviews] Skipping ${audiobook.title} - already has reviews`);
          continue;
        }

        // Gerar entre 3 e 8 avaliações dependendo do "prestígio" do livro
        const maxReviews = Math.floor(Math.random() * 6) + 3; // 3 a 8 avaliações
        
        const result = await generateReviews(
          audiobook.id,
          audiobook.title,
          audiobook.author,
          maxReviews
        );

        if (result) {
          successCount++;
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast({
        title: 'Processo concluído!',
        description: `Avaliações geradas para ${successCount} audiobooks`,
      });

    } catch (error) {
      console.error('[useGenerateReviews] Error in batch generation:', error);
      toast({
        title: 'Erro ao processar audiobooks',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReviews,
    generateReviewsForAllBooks,
    isGenerating,
  };
};