import { Play, Plus, Info, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";

interface AudiobookCardProps {
  id: string;
  title: string;
  author: string;
  duration: string;
  cover: string;
  progress?: number;
}

export const AudiobookCard = ({
  id,
  title,
  author,
  duration,
  cover,
  progress = 0,
}: AudiobookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <div
      className="group relative min-w-[180px] cursor-pointer transition-all duration-300 ease-out hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/audiobook/${id}`)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden card-shine bg-card">
        <img
          src={cover}
          alt={title}
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
            className="gradient-hero border-0 glow-effect"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/audiobook/${id}`);
            }}
          >
            <Play className="w-5 h-5" fill="currentColor" />
          </Button>
          
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              console.log('❤️ Botão de favorito clicado:', id);
              toggleFavorite(id);
            }}
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

      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{author}</p>
        <p className="text-xs text-muted-foreground">{duration}</p>
      </div>
    </div>
  );
};
