import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('[useAdmin] No user logged in');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('[useAdmin] Checking admin status for user:', user.id);

      try {
        // SEGURANÇA: Usa edge function para verificação server-side
        // que não pode ser burlada pelo cliente
        const { data, error } = await supabase.functions.invoke('check-admin-status');

        console.log('[useAdmin] Admin check result:', { data, error });

        if (error) {
          console.error('[useAdmin] Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.isAdmin === true);
          console.log('[useAdmin] Is admin?', data?.isAdmin);
        }
      } catch (error) {
        console.error('[useAdmin] Exception checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
