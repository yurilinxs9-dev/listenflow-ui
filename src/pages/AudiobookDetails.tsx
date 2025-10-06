import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Share2,
  ChevronLeft,
  Clock,
  Star,
  BookOpen,
  FolderPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { ReviewSection } from "@/components/ReviewSection";
import { PdfViewer } from "@/components/PdfViewer";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { AddToListDialog } from "@/components/AddToListDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAudiobookAccess } from "@/hooks/useAudiobookAccess";

const AudiobookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([25]);
  const [volume, setVolume] = useState([70]);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [audiobook, setAudiobook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toggleFavorite, isFavorite, isToggling } = useFavorites();
  const { isPremium: userIsPremium } = useUserSubscription();
  const { getPresignedUrl, isLoading: isGettingUrl } = useAudiobookAccess();

  useEffect(() => {
    const fetchAudiobook = async () => {
      if (!id) return;
      
      try {
        console.log(`[AudiobookDetails] Fetching audiobook: ${id}`);
        const { data, error } = await supabase
          .from('audiobooks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('[AudiobookDetails] Error fetching audiobook:', error);
          setAudiobook(null);
        } else {
          console.log('[AudiobookDetails] Audiobook loaded:', data);
          setAudiobook(data);
        }
      } catch (error) {
        console.error('[AudiobookDetails] Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobook();
  }, [id]);

  const handlePlayPause = async () => {
    if (!audiobook) return;

    if (!audioUrl && !isPlaying) {
      // Need to get presigned URL first
      const url = await getPresignedUrl(audiobook.id);
      if (url) {
        setAudioUrl(url);
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Carregando...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!audiobook) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Audiobook não encontrado.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const currentIsFavorite = isFavorite(id || "1");
  const isProcessing = isToggling[id || "1"] || false;

  return (
    <>
      {showPdfViewer && (
        <PdfViewer
          pdfUrl="https://pdfobject.com/pdf/sample.pdf"
          title={audiobook.title}
          onClose={() => setShowPdfViewer(false)}
          isPremium={false}
          userIsPremium={userIsPremium}
          previewPages={10}
        />
      )}
      
      <div className="min-h-screen bg-background">
        <Header />

      <main className="pt-20 pb-32">
        <div className="container mx-auto px-4 md:px-8">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>

          <div className="grid md:grid-cols-[400px,1fr] gap-12 items-start">
            {/* Cover */}
            <div className="space-y-6 animate-scale-in">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={audiobook.cover_url || "/placeholder.svg"}
                  alt={audiobook.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 gradient-hero border-0 glow-effect h-12"
                  onClick={handlePlayPause}
                  disabled={isGettingUrl}
                >
                  {isGettingUrl ? (
                    <>Carregando...</>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" fill="currentColor" />
                      Ouvir Agora
                    </>
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12"
                  onClick={() => toggleFavorite(id || "1")}
                  disabled={isProcessing}
                >
                  <Heart
                    className={`w-5 h-5 ${currentIsFavorite ? "fill-primary text-primary" : ""}`}
                  />
                </Button>

                <Button size="icon" variant="secondary" className="h-12 w-12">
                  <Share2 className="w-5 h-5" />
                </Button>

                <AddToListDialog
                  audiobookId={id || "1"}
                  trigger={
                    <Button size="icon" variant="secondary" className="h-12 w-12">
                      <FolderPlus className="w-5 h-5" />
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {audiobook.title}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Por {audiobook.author}
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-semibold">4.5</span>
                    <span className="text-muted-foreground">
                      (avaliações em breve)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDuration(audiobook.duration_seconds || 0)}</span>
                  </div>
                  {audiobook.genre && (
                    <span className="px-3 py-1 bg-secondary rounded-full">
                      {audiobook.genre}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {new Date(audiobook.created_at).getFullYear()}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Sobre este audiobook</h2>
                <p className="text-foreground/80 leading-relaxed">
                  {audiobook.description || "Audiobook disponível para reprodução."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Autor</p>
                  <p className="font-semibold">{audiobook.author}</p>
                </div>
                {audiobook.narrator && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Narrador</p>
                    <p className="font-semibold">{audiobook.narrator}</p>
                  </div>
                )}
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Capítulos</h3>
                <div className="space-y-3">
                  {[
                    "1. Prólogo: A Noite Começa",
                    "2. O Primeiro Sinal",
                    "3. Investigação Inicial",
                    "4. Pistas Ocultas",
                    "5. O Confronto",
                  ].map((chapter, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors flex items-center justify-between group"
                    >
                      <span className="group-hover:text-primary transition-colors">
                        {chapter}
                      </span>
                      <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Section */}
              <ReviewSection audiobookId={id || "1"} />
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-xl shadow-2xl z-50">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground min-w-[100px] text-right">
                2:15 / 8:45
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <img
                  src={audiobook.cover}
                  alt={audiobook.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="hidden md:block">
                  <p className="font-semibold text-sm">{audiobook.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {audiobook.author}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  className="gradient-hero border-0 w-12 h-12"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" fill="currentColor" />
                  )}
                </Button>

                <Button size="icon" variant="ghost">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default AudiobookDetails;
