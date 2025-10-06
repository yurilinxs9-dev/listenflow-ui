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
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('[useAdmin] Query result:', { data, error });

        if (error) {
          console.error('[useAdmin] Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          const isAdminUser = !!data;
          console.log('[useAdmin] Is admin?', isAdminUser);
          setIsAdmin(isAdminUser);
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
