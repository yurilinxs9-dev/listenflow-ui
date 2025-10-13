import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Cache para evitar múltiplas chamadas simultâneas
let adminCheckCache: { 
  userId: string; 
  isAdmin: boolean; 
  timestamp: number;
  promise?: Promise<boolean>;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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

      // Verificar cache primeiro
      const now = Date.now();
      if (adminCheckCache && 
          adminCheckCache.userId === user.id && 
          now - adminCheckCache.timestamp < CACHE_DURATION) {
        console.log('[useAdmin] Using cached admin status');
        setIsAdmin(adminCheckCache.isAdmin);
        setLoading(false);
        return;
      }

      // Se já existe uma promise em andamento, reutilizá-la
      if (adminCheckCache?.promise && adminCheckCache.userId === user.id) {
        console.log('[useAdmin] Reusing pending admin check');
        try {
          const result = await adminCheckCache.promise;
          setIsAdmin(result);
          setLoading(false);
          return;
        } catch (error) {
          console.error('[useAdmin] Error with cached promise:', error);
        }
      }

      console.log('[useAdmin] Checking admin status for user:', user.id);

      try {
        // Criar promise e armazenar no cache
        const checkPromise = (async () => {
          const { data, error } = await supabase.functions.invoke('check-admin-status');

          console.log('[useAdmin] Admin check result:', { data, error });

          if (error) {
            throw error;
          }
          
          const result = data?.isAdmin === true;
          console.log('[useAdmin] Is admin?', result);
          
          // Atualizar cache com resultado
          adminCheckCache = {
            userId: user.id,
            isAdmin: result,
            timestamp: Date.now()
          };
          
          return result;
        })();

        // Armazenar promise no cache
        adminCheckCache = {
          userId: user.id,
          isAdmin: false,
          timestamp: Date.now(),
          promise: checkPromise
        };

        const result = await checkPromise;
        setIsAdmin(result);
      } catch (error) {
        console.error('[useAdmin] Exception checking admin status:', error);
        setIsAdmin(false);
        // Limpar cache em caso de erro
        adminCheckCache = null;
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
