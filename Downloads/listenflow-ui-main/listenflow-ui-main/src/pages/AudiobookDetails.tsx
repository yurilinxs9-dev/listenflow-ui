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
  Sparkles,
  Gauge,
  Captions,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { ReviewSection } from "@/components/ReviewSection";
import { PdfViewer } from "@/components/PdfViewer";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { AddToListDialog } from "@/components/AddToListDialog";
import { supabase } from "@/integrations/supabase/client";
import { useCoverGeneration } from "@/hooks/useCoverGeneration";
import { useAuth } from "@/hooks/useAuth";
import { useUserStatus } from "@/hooks/useUserStatus";
import { AccessDenied } from "@/components/AccessDenied";
import { useProgress } from "@/hooks/useProgress";
import { useOptimizedStreaming } from "@/hooks/useOptimizedStreaming";

// Audio player with speed control and synchronized subtitles
const AudiobookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasRestoredRef = useRef(false); // Flag para garantir restauração única
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce para salvar progresso
  const userWantsToPlayRef = useRef(false); // Flag para controlar quando o usuário realmente quer reproduzir
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [volume, setVolume] = useState([70]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [audiobook, setAudiobook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [showSubtitles, setShowSubtitles] = useState(true);
  const { toggleFavorite, isFavorite, isToggling } = useFavorites();
  const { isPremium: userIsPremium } = useUserSubscription();
  const { generateCover, isGenerating: isGeneratingCover } = useCoverGeneration();
  const { user } = useAuth();
  const { isApproved, isPending, isRejected, loading: statusLoading } = useUserStatus();
  const { progress: savedProgress, updateProgress } = useProgress(id);
  
  // Streaming otimizado com cache agressivo e prefetch
  const streaming = useOptimizedStreaming({ 
    audiobookId: id || '', 
    autoRenew: true,
    enableCache: true,  // ✅ Cache ativado
    prefetch: true      // ✅ Prefetch ativado
  });

  useEffect(() => {
    const fetchAudiobookDetails = async () => {
      if (!id) return;

      try {
        // Increment view count
        console.log(`[AudiobookDetails] Incrementing view count for: ${id}`);
        const { error: incrementError } = await supabase
          .rpc('increment_audiobook_views', { audiobook_id: id });
        
        if (incrementError) {
          console.error('[AudiobookDetails] Error incrementing views:', incrementError);
        }

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

    fetchAudiobookDetails();
  }, [id]);

  // Fetch chapters and transcriptions
  useEffect(() => {
    const fetchChaptersAndTranscriptions = async () => {
      if (!id) return;
      
      try {
        console.log(`[AudiobookDetails] Fetching chapters for audiobook: ${id}`);
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('audiobook_id', id)
          .order('chapter_number', { ascending: true });

        if (chaptersError) {
          console.error('[AudiobookDetails] Error fetching chapters:', chaptersError);
          setChapters([]);
        } else {
          console.log('[AudiobookDetails] Chapters loaded:', chaptersData);
          setChapters(chaptersData || []);
        }

        // Fetch transcriptions
        console.log(`[AudiobookDetails] Fetching transcriptions for audiobook: ${id}`);
        const { data: transcriptionsData, error: transcriptionsError } = await supabase
          .from('audiobook_transcriptions')
          .select('*')
          .eq('audiobook_id', id)
          .order('start_time', { ascending: true });

        if (transcriptionsError) {
          console.error('[AudiobookDetails] Error fetching transcriptions:', transcriptionsError);
          setTranscriptions([]);
        } else {
          console.log('[AudiobookDetails] Transcriptions loaded:', transcriptionsData);
          setTranscriptions(transcriptionsData || []);
        }
      } catch (error) {
        console.error('[AudiobookDetails] Unexpected error:', error);
      }
    };

    fetchChaptersAndTranscriptions();
  }, [id]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Attach streaming optimization
    const cleanup = streaming.attachAudioElement(audio);

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress([progressPercent]);
      
      // Update subtitle
      if (transcriptions.length > 0 && showSubtitles) {
        const currentTranscription = transcriptions.find(
          (sub) => audio.currentTime >= Number(sub.start_time) && audio.currentTime <= Number(sub.end_time)
        );
        setCurrentSubtitle(currentTranscription?.text || "");
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      cleanup();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [streaming.url, transcriptions, showSubtitles, streaming]);

  // Restore saved progress when available (ONLY ONCE on load)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !savedProgress || !streaming.url || hasRestoredRef.current) return;

    const restoreProgress = () => {
      // Só restaura se ainda não restaurou E se tem progresso válido
      if (hasRestoredRef.current) return;
      
      if (savedProgress.last_position > 0 && audio.duration > 0) {
        audio.currentTime = savedProgress.last_position;
        // ✅ Converter para porcentagem (0-100) para o slider
        const progressPercent = (savedProgress.last_position / audio.duration) * 100;
        setProgress([progressPercent]);
        hasRestoredRef.current = true;
        console.log('[AudiobookDetails] ✅ Progresso restaurado para:', savedProgress.last_position, 'segundos');
      }
    };

    if (audio.readyState >= 2) {
      // Audio is ready (HAVE_CURRENT_DATA or higher)
      restoreProgress();
    } else {
      // Wait for audio to be ready
      audio.addEventListener('loadeddata', restoreProgress);
      return () => audio.removeEventListener('loadeddata', restoreProgress);
    }
  }, [savedProgress, streaming.url]); // ✅ Depende de AMBOS: savedProgress E streaming.url

  // Reset flags quando muda de audiobook
  useEffect(() => {
    hasRestoredRef.current = false;
    userWantsToPlayRef.current = false;
    setIsPlaying(false);
  }, [id]);

  // Auto-save progress every 10 seconds (reduzido de 5 para evitar overhead)
  useEffect(() => {
    if (!id || !user || !audioRef.current || !isPlaying) return;

    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && audio.duration > 0 && !audio.paused) {
        updateProgress(id, audio.currentTime, audio.duration, audio.currentTime);
      }
    }, 10000); // ✅ Aumentado para 10 segundos

    return () => clearInterval(interval);
  }, [id, user, isPlaying, updateProgress]);

  // Save progress on pause and unmount
  useEffect(() => {
    const audio = audioRef.current;
    
    const handlePause = () => {
      if (id && user && audio && audio.duration > 0) {
        updateProgress(id, audio.currentTime, audio.duration, audio.currentTime);
        console.log('[AudiobookDetails] Progress saved on pause');
      }
    };

    if (audio) {
      audio.addEventListener('pause', handlePause);
    }

    return () => {
      // Limpar timeout pendente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      if (audio) {
        audio.removeEventListener('pause', handlePause);
        // Save on unmount
        if (id && user && audio.duration > 0) {
          updateProgress(id, audio.currentTime, audio.duration, audio.currentTime);
          console.log('[AudiobookDetails] Progress saved on unmount');
        }
      }
    };
  }, [id, user, updateProgress]);

  // Volume and playback rate control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  const handlePlayPause = async () => {
    if (!audiobook) return;

    if (!streaming.url) {
      // Mark that user wants to play
      userWantsToPlayRef.current = true;
      console.log('[AudiobookDetails] ⏳ Waiting for streaming URL...');
      return;
    }

    // Toggle play/pause
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        userWantsToPlayRef.current = false;
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          userWantsToPlayRef.current = true;
        } catch (error) {
          console.error('[AudiobookDetails] Error playing audio:', error);
          setIsPlaying(false);
          userWantsToPlayRef.current = false;
        }
      }
    }
  };

  // Auto-play only when URL is ready AND user explicitly requested play
  useEffect(() => {
    if (streaming.url && audioRef.current && userWantsToPlayRef.current && !isPlaying) {
      console.log('[AudiobookDetails] 🎵 Starting playback as requested by user');
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('[AudiobookDetails] Error auto-playing:', error);
          setIsPlaying(false);
          userWantsToPlayRef.current = false;
        });
    }
  }, [streaming.url, isPlaying]);

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current && duration && id) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(value);
      
      // ✅ Debounce: só salva 1 segundo após usuário parar de arrastar
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        updateProgress(id, newTime, duration, newTime);
        console.log('[AudiobookDetails] 💾 Progresso salvo após busca manual:', newTime);
      }, 1000); // Aguarda 1 segundo após parar de arrastar
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current && id && duration) {
      const newTime = Math.min(audioRef.current.currentTime + 15, duration);
      audioRef.current.currentTime = newTime;
      
      // ✅ Salvar imediatamente
      updateProgress(id, newTime, duration, newTime);
      console.log('[AudiobookDetails] 💾 Progresso salvo após skip forward');
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current && id && duration) {
      const newTime = Math.max(audioRef.current.currentTime - 15, 0);
      audioRef.current.currentTime = newTime;
      
      // ✅ Salvar imediatamente
      updateProgress(id, newTime, duration, newTime);
      console.log('[AudiobookDetails] 💾 Progresso salvo após skip back');
    }
  };

  const handleChapterClick = async (startTime: number) => {
    if (!audioRef.current) {
      console.log('[AudiobookDetails] ⏳ Audio not ready yet');
      return;
    }

    if (!streaming.url) {
      console.log('[AudiobookDetails] ⏳ Waiting for streaming URL...');
      return;
    }

    audioRef.current.currentTime = startTime;
    if (!isPlaying) {
      userWantsToPlayRef.current = true;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('[AudiobookDetails] Error playing from chapter:', error);
        userWantsToPlayRef.current = false;
      }
    }
    
    // Save chapter jump to progress
    if (id && duration) {
      updateProgress(id, startTime, duration, startTime);
      console.log('[AudiobookDetails] 📖 Jumped to chapter at', startTime);
    }
  };

  const handleGenerateCover = async () => {
    if (!audiobook) return;
    
    const newCoverUrl = await generateCover(
      audiobook.id,
      audiobook.title,
      audiobook.author,
      audiobook.genre || 'Ficção'
    );

    if (newCoverUrl) {
      // Update local state
      setAudiobook({ ...audiobook, cover_url: newCoverUrl });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show access denied if user is not approved
  if (!statusLoading && (isPending || isRejected)) {
    return <AccessDenied status={isPending ? 'pending' : 'rejected'} />;
  }

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

          <div className="grid md:grid-cols-[minmax(300px,400px),1fr] gap-8 md:gap-12 items-start">
            {/* Cover */}
            <div className="space-y-6 animate-scale-in w-full max-w-md mx-auto md:mx-0">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-card">
                <img
                  src={audiobook.cover_url || "/placeholder.svg"}
                  alt={audiobook.title}
                  loading="lazy"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {!audiobook.cover_url && user && audiobook.user_id === user.id && (
                <Button
                  onClick={handleGenerateCover}
                  disabled={isGeneratingCover}
                  variant="outline"
                  className="w-full mb-3"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingCover ? 'Gerando capa...' : 'Gerar Capa com IA'}
                </Button>
              )}

              <div className="flex flex-wrap sm:flex-nowrap gap-3">
                <Button
                  className="flex-1 min-w-[180px] gradient-hero border-0 glow-effect h-12"
                  onClick={handlePlayPause}
                  disabled={streaming.isLoading || streaming.buffering}
                >
                  {streaming.isLoading ? (
                    <>Carregando...</>
                  ) : streaming.buffering ? (
                    <>Buffering...</>
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
                  className="h-12 w-12 flex-shrink-0"
                  onClick={() => toggleFavorite(id || "1")}
                  disabled={isProcessing}
                >
                  <Heart
                    className={`w-5 h-5 ${currentIsFavorite ? "fill-primary text-primary" : ""}`}
                  />
                </Button>

                <Button size="icon" variant="secondary" className="h-12 w-12 flex-shrink-0">
                  <Share2 className="w-5 h-5" />
                </Button>

                <AddToListDialog
                  audiobookId={id || "1"}
                  trigger={
                    <Button size="icon" variant="secondary" className="h-12 w-12 flex-shrink-0">
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
                  {audiobook.created_at && (
                    <span className="text-muted-foreground">
                      {new Date(audiobook.created_at).getFullYear()}
                    </span>
                  )}
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

              {chapters.length > 0 && (
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-semibold mb-4">Capítulos</h3>
                  <div className="space-y-3">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter.start_time)}
                        className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors flex items-center justify-between group"
                        disabled={streaming.isLoading || streaming.buffering}
                      >
                        <span className="group-hover:text-primary transition-colors">
                          {chapter.chapter_number}. {chapter.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(chapter.start_time)}
                          </span>
                          <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Section */}
              <ReviewSection audiobookId={id || "1"} />
            </div>
          </div>
        </div>
      </main>

      {/* Audio element with aggressive optimization */}
      {streaming.url && (
        <audio
          ref={audioRef}
          src={streaming.url}
          preload="auto"
          crossOrigin="anonymous"
          playsInline
          onLoadedMetadata={() => console.log('[Player] ✅ Metadata carregado - pronto para tocar')}
          onCanPlay={() => console.log('[Player] ✅ Buffer suficiente')}
          onWaiting={() => console.log('[Player] ⏳ Aguardando buffer...')}
          onCanPlayThrough={() => console.log('[Player] ✅ Totalmente em buffer')}
          onLoadStart={() => console.log('[Player] 🔄 Iniciando carregamento')}
          onProgress={() => {
            const audio = audioRef.current;
            if (audio && audio.buffered.length > 0) {
              const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
              const bufferedPercent = (bufferedEnd / audio.duration) * 100;
              if (bufferedPercent > 10) {
                console.log('[Player] 📊 Buffered:', Math.round(bufferedPercent) + '%');
              }
            }
          }}
        />
      )}

      {/* Subtitle overlay */}
      {currentSubtitle && showSubtitles && transcriptions.length > 0 && (
        <div className="fixed bottom-36 left-1/2 transform -translate-x-1/2 z-40 max-w-4xl px-4">
          <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-lg">
            <p className="text-white text-center text-lg leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Fixed Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border backdrop-blur-xl shadow-2xl z-50">
        <div className="container mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Progress bar */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Slider
                value={progress}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs sm:text-sm text-muted-foreground min-w-[80px] sm:min-w-[100px] text-right tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Thumbnail and info */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden bg-card flex-shrink-0">
                  <img
                    src={audiobook.cover_url || "/placeholder.svg"}
                    alt={audiobook.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="hidden sm:block min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{audiobook.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {audiobook.author}
                  </p>
                </div>
              </div>

              {/* Play controls */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Button size="icon" variant="ghost" onClick={handleSkipBack} className="h-9 w-9 sm:h-10 sm:w-10">
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                <Button
                  size="icon"
                  className="gradient-hero border-0 w-10 h-10 sm:w-12 sm:h-12 relative"
                  onClick={handlePlayPause}
                  disabled={streaming.isLoading || streaming.buffering}
                >
                  {streaming.isLoading || streaming.buffering ? (
                    <span className="text-xs">...</span>
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                  )}
                  {/* Indicador de cache */}
                  {streaming.cached && !streaming.isLoading && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Carregamento instantâneo (cache)" />
                  )}
                </Button>

                <Button size="icon" variant="ghost" onClick={handleSkipForward} className="h-9 w-9 sm:h-10 sm:w-10">
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Additional controls */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
                {/* Playback speed */}
                <div className="hidden sm:flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="bg-secondary text-foreground text-xs sm:text-sm rounded px-1.5 sm:px-2 py-1 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="1.75">1.75x</option>
                    <option value="2">2x</option>
                  </select>
                </div>

                {/* Subtitles */}
                {transcriptions.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10"
                    title={showSubtitles ? "Ocultar legendas" : "Mostrar legendas"}
                  >
                    <Captions className={`w-4 h-4 sm:w-5 sm:h-5 ${showSubtitles ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                )}

                {/* Volume */}
                <div className="hidden lg:flex items-center gap-2">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-20 sm:w-24"
                  />
                </div>
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
