import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export const useAudiobookAccess = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getPresignedUrl = async (audiobookId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para ouvir este audiobook.",
        variant: "destructive",
      });
      navigate('/auth');
      return null;
    }

    setIsLoading(true);
    try {
      console.log(`[useAudiobookAccess] Requesting presigned URL for audiobook: ${audiobookId}`);
      
      const { data, error } = await supabase.functions.invoke('get-audiobook-presigned-url', {
        body: { audiobookId }
      });

      if (error) {
        console.error('[useAudiobookAccess] Error getting presigned URL:', error);
        
        if (error.message?.includes('401') || error.message?.includes('Login necessário')) {
          toast({
            title: "Login necessário",
            description: "Você precisa fazer login para ouvir este audiobook.",
            variant: "destructive",
          });
          navigate('/auth');
        } else if (error.message?.includes('403') || error.message?.includes('assinatura')) {
          toast({
            title: "Assinatura necessária",
            description: "Este audiobook requer uma assinatura premium.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao acessar audiobook",
            description: error.message || "Não foi possível obter acesso ao audiobook.",
            variant: "destructive",
          });
        }
        return null;
      }

      if (!data?.url) {
        console.error('[useAudiobookAccess] No URL in response:', data);
        toast({
          title: "Erro ao acessar audiobook",
          description: "Não foi possível obter URL de acesso.",
          variant: "destructive",
        });
        return null;
      }

      console.log(`[useAudiobookAccess] Successfully obtained presigned URL`);
      return data.url;

    } catch (error) {
      console.error('[useAudiobookAccess] Unexpected error:', error);
      toast({
        title: "Erro ao acessar audiobook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getPresignedUrl,
    isLoading,
    isAuthenticated: !!user,
  };
};