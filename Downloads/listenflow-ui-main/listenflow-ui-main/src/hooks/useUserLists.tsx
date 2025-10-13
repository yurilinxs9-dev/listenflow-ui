import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface UserList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

export interface ListItem {
  id: string;
  audiobook_id: string;
  added_at: string;
}

export const useUserLists = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_lists')
        .select('*, list_items(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listsWithCount = data?.map(list => ({
        ...list,
        items_count: list.list_items?.[0]?.count || 0
      })) || [];

      setLists(listsWithCount);
    } catch (error: any) {
      console.error('Error fetching lists:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as coleções.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user?.id]);

  const createList = async (name: string, description?: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para criar coleções.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Coleção criada",
        description: `"${name}" foi criada com sucesso.`,
      });

      await fetchLists();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a coleção.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateList = async (listId: string, name: string, description?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_lists')
        .update({
          name,
          description: description || null,
        })
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Coleção atualizada",
        description: "As alterações foram salvas.",
      });

      await fetchLists();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a coleção.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteList = async (listId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Coleção excluída",
        description: "A coleção foi removida.",
      });

      await fetchLists();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a coleção.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addToList = async (listId: string, audiobookId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar à coleção.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if already in list
      const { data: existing } = await supabase
        .from('list_items')
        .select('id')
        .eq('list_id', listId)
        .eq('audiobook_id', audiobookId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Já está na coleção",
          description: "Este audiobook já está nesta coleção.",
        });
        return false;
      }

      const { error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          audiobook_id: audiobookId,
        });

      if (error) throw error;

      toast({
        title: "Adicionado à coleção",
        description: "Audiobook adicionado com sucesso.",
      });

      await fetchLists();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar à coleção.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromList = async (listId: string, audiobookId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('audiobook_id', audiobookId);

      if (error) throw error;

      toast({
        title: "Removido da coleção",
        description: "Audiobook removido com sucesso.",
      });

      await fetchLists();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover da coleção.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getListItems = async (listId: string): Promise<ListItem[]> => {
    try {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching list items:', error);
      return [];
    }
  };

  const isInList = async (listId: string, audiobookId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('list_items')
        .select('id')
        .eq('list_id', listId)
        .eq('audiobook_id', audiobookId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  return {
    lists,
    loading,
    createList,
    updateList,
    deleteList,
    addToList,
    removeFromList,
    getListItems,
    isInList,
    refetch: fetchLists,
  };
};
