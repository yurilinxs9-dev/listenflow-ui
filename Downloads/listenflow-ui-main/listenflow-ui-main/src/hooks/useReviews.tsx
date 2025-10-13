import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface Review {
  id: string;
  user_id: string;
  audiobook_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
  };
}

export const useReviews = (audiobookId: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [audiobookId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (display_name)
        `)
        .eq('audiobook_id', audiobookId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      if (user) {
        const myReview = data?.find(r => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (rating: number, reviewText: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para avaliar audiobooks.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          user_id: user.id,
          audiobook_id: audiobookId,
          rating,
          review_text: reviewText || null,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado por compartilhar sua opinião.",
      });

      await fetchReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      });
    }
  };

  const deleteReview = async () => {
    if (!user || !userReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      toast({
        title: "Avaliação removida",
        description: "Sua avaliação foi removida.",
      });

      await fetchReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover sua avaliação.",
        variant: "destructive",
      });
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  return {
    reviews,
    userReview,
    loading,
    submitReview,
    deleteReview,
    getAverageRating,
  };
};
