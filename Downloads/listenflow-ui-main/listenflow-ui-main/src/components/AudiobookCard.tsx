import { Play, Plus, Info, Heart, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";

interface AudiobookCardProps {
  id: string;
  title: string;
  author: string;
  duration: string;
  cover: string;
  progress?: number;
  viewCount?: number;
  isTopRated?: boolean;
}

export const AudiobookCard = ({
  id,
  title,
  author,
  duration,
  cover,
  progress = 0,
  viewCount,
  isTopRated,
}: AudiobookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite, isToggling } = useFavorites();

  const isProcessing = isToggling[id] || false;

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
    } else {
      navigate(`/audiobook/${id}`);
    }
  };

  return (
    <div
      className="group relative min-w-[140px] sm:min-w-[180px] cursor-pointer transition-all duration-300 ease-out hover:scale-[1.03] will-change-transform"
      style={{ transform: 'translateZ(0)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/audiobook/${id}`)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden card-shine bg-card shadow-lg hover:shadow-2xl transition-shadow duration-300"
        style={{
          boxShadow: isHovered 
            ? '0 20px 40px -10px hsla(var(--glow), 0.4), 0 10px 20px -5px hsla(0, 0%, 0%, 0.3)' 
            : '0 4px 6px -1px hsla(0, 0%, 0%, 0.2), 0 2px 4px -1px hsla(0, 0%, 0%, 0.1)'
        }}
      >
        {isTopRated && (
          <Badge 
            className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground border-0 shadow-lg"
            variant="default"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Mais Lido
          </Badge>
        )}
        
        <img
          src={imageError ? "/placeholder.svg" : cover}
          alt={title}
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full gradient-hero"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            size="icon"
            className="gradient-hero border-0 glow-effect relative"
            onClick={handlePlayClick}
            title={!user ? "Faça login para ouvir" : "Reproduzir"}
          >
            {!user ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              console.log('❤️ Botão de favorito clicado:', id);
              toggleFavorite(id);
            }}
            disabled={isProcessing}
          >
            <Heart className={`w-5 h-5 ${isFavorite(id) ? 'fill-primary text-primary' : ''}`} />
          </Button>
          
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/audiobook/${id}`);
            }}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-1 px-1 max-w-full overflow-hidden">
        <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{author}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{duration}</p>
      </div>
    </div>
  );
};
