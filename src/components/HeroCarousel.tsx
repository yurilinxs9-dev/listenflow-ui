import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Plus, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-audiobook.jpg";

const featuredBooks = [
  {
    id: "1",
    title: "O Mistério da Noite Escura",
    author: "Ana Silva",
    description:
      "Um thriller psicológico envolvente que irá mantê-lo acordado até as primeiras horas da manhã. Uma história de suspense e mistério.",
    duration: "8h 45min",
  },
  {
    id: "2",
    title: "Reinos Perdidos",
    author: "Carlos Mendes",
    description:
      "Uma épica jornada fantástica através de terras místicas e batalhas lendárias. Aventura e magia se unem nesta saga inesquecível.",
    duration: "12h 30min",
  },
  {
    id: "3",
    title: "Estrelas Distantes",
    author: "Maria Costa",
    description:
      "Ficção científica de tirar o fôlego que explora os limites do universo conhecido. Uma visão única sobre o futuro da humanidade.",
    duration: "10h 15min",
  },
];

export const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredBooks.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const currentBook = featuredBooks[currentIndex];

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />

      <div className="relative container mx-auto px-4 md:px-8 h-full flex items-end pb-20">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-glow">
            {currentBook.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-accent font-semibold">Em Destaque</span>
            <span className="text-muted-foreground">{currentBook.duration}</span>
            <span className="text-muted-foreground">Por {currentBook.author}</span>
          </div>

          <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
            {currentBook.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gradient-hero border-0 glow-effect group"
              onClick={() => navigate(`/audiobook/${currentBook.id}`)}
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="currentColor" />
              Ouvir Agora
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(`/audiobook/${currentBook.id}`)}
            >
              <Info className="w-5 h-5 mr-2" />
              Mais Informações
            </Button>
            
            <Button size="lg" variant="secondary">
              <Plus className="w-5 h-5 mr-2" />
              Minha Lista
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            {featuredBooks.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 gradient-hero"
                    : "w-6 bg-muted hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
