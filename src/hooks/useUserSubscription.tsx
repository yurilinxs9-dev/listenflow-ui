import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Hook para verificar se o usuário tem assinatura premium
// Por enquanto retorna false, mas pode ser integrado com sistema de pagamento
export const useUserSubscription = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aqui você pode adicionar lógica para verificar a assinatura do usuário
    // Por exemplo, consultando uma tabela 'subscriptions' no Supabase
    const checkSubscription = async () => {
      if (user) {
        // Simula verificação de assinatura
        // TODO: Integrar com sistema de pagamento real (Stripe, etc)
        setIsPremium(false);
      }
      setLoading(false);
    };

    checkSubscription();
  }, [user]);

  return { isPremium, loading };
};
