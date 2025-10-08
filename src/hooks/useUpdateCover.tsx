import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUpdateCover = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateCover = async (audiobookId: string, imageFile: File) => {
    setIsUpdating(true);
    try {
      // Converter imagem para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const imageBase64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke('update-book-cover', {
        body: {
          audiobookId,
          imageBase64
        }
      });

      if (error) throw error;

      toast.success('Capa atualizada com sucesso!');
      return data.coverUrl;
    } catch (error) {
      console.error('Erro ao atualizar capa:', error);
      toast.error('Erro ao atualizar capa');
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateCover, isUpdating };
};
