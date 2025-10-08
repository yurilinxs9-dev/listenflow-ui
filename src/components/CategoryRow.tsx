import { AudiobookCard } from "./AudiobookCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

interface Audiobook {
  id: string;
  title: string;
  author: string;
  duration: string;
  cover: string;
  progress?: number;
  viewCount?: number;
}

interface CategoryRowProps {
  title: string;
  audiobooks: Audiobook[];
  topAudiobookIds?: Set<string>;
}

export const CategoryRow = ({ title, audiobooks, topAudiobookIds }: CategoryRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      
      setTimeout(() => {
        if (scrollRef.current) {
          setShowLeftArrow(scrollRef.current.scrollLeft > 0);
          setShowRightArrow(
            scrollRef.current.scrollLeft <
              scrollRef.current.scrollWidth - scrollRef.current.clientWidth
          );
        }
      }, 300);
    }
  };

  return (
    <div className="group/row relative mb-12 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-8">{title}</h2>
      
      <div className="relative">
        {showLeftArrow && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity h-full rounded-none bg-background/80 hover:bg-background/90"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 scroll-smooth"
        >
          {audiobooks.map((audiobook) => {
            // Verifica se o audiobook está entre os top 5 globalmente mais lidos
            const isTopRated = topAudiobookIds?.has(audiobook.id) || false;
            
            return (
              <AudiobookCard
                key={audiobook.id}
                {...audiobook}
                isTopRated={isTopRated}
              />
            );
          })}
        </div>

        {showRightArrow && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity h-full rounded-none bg-background/80 hover:bg-background/90"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>
    </div>
  );
};
