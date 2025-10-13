import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setStatus(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[useUserStatus] Error checking status:', error);
          setStatus(null);
        } else {
          setStatus(data?.status || 'pending');
        }
      } catch (error) {
        console.error('[useUserStatus] Exception:', error);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return { status, isApproved, isPending, isRejected, loading };
};
