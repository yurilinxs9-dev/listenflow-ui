import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewSectionProps {
  audiobookId: string;
}

export const ReviewSection = ({ audiobookId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { reviews, userReview, submitReview, deleteReview, getAverageRating } = useReviews(audiobookId);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [reviewText, setReviewText] = useState(userReview?.review_text || '');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await submitReview(rating, reviewText);
      setReviewText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await deleteReview();
    setRating(0);
    setReviewText('');
  };

  return (
    <div className="space-y-8">
      {/* Average Rating */}
      <div className="bg-card p-6 rounded-xl border border-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl font-bold">{getAverageRating()}</div>
          <div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number(getAverageRating()))
                      ? 'text-accent fill-accent'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>
        </div>

        {/* User Review Form */}
        {user && (
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4">
              {userReview ? 'Sua Avaliação' : 'Avaliar este audiobook'}
            </h3>
            
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || rating)
                        ? 'text-accent fill-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Compartilhe sua opinião sobre este audiobook..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="mb-4"
              rows={4}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="gradient-hero border-0"
              >
                {isSubmitting ? 'Enviando...' : userReview ? 'Atualizar' : 'Enviar Avaliação'}
              </Button>
              
              {userReview && (
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="icon"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Avaliações</h3>
        
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Seja o primeiro a avaliar este audiobook!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">
                      {review.profiles?.display_name || 'Usuário'}
                    </p>
                    <div className="flex gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-accent fill-accent'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), "dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                
                {review.review_text && (
                  <p className="text-foreground/80">{review.review_text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
