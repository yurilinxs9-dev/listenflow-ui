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
import { useAudiobookAccess } from "@/hooks/useAudiobookAccess";
import { useCoverGeneration } from "@/hooks/useCoverGeneration";
import { useAuth } from "@/hooks/useAuth";
import { useUserStatus } from "@/hooks/useUserStatus";
import { AccessDenied } from "@/components/AccessDenied";
import { useProgress } from "@/hooks/useProgress";

// Audio player with speed control and synchronized subtitles
const AudiobookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
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
  const { getPresignedUrl, isLoading: isGettingUrl } = useAudiobookAccess();
  const { generateCover, isGenerating: isGeneratingCover } = useCoverGeneration();
  const { user } = useAuth();
  const { isApproved, isPending, isRejected, loading: statusLoading } = useUserStatus();
  const { progress: savedProgress, updateProgress } = useProgress(id);

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

  // Load saved progress when audio is ready
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !savedProgress || !audioUrl) return;

    const handleLoadedData = () => {
      if (savedProgress.last_position > 0 && audio.duration > 0) {
        audio.currentTime = savedProgress.last_position;
        console.log('[AudiobookDetails] Restored progress:', savedProgress.last_position);
      }
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    return () => audio.removeEventListener('loadeddata', handleLoadedData);
  }, [audioUrl, savedProgress]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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

      // Save progress every 5 seconds
      if (user && id && audio.duration > 0 && Math.floor(audio.currentTime) % 5 === 0) {
        updateProgress(id, audio.currentTime, audio.duration, audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Save final progress
      if (user && id && audio.duration > 0) {
        updateProgress(id, audio.duration, audio.duration, audio.duration);
      }
    };

    const handlePause = () => {
      // Save progress when user pauses
      if (user && id && audio.duration > 0) {
        updateProgress(id, audio.currentTime, audio.duration, audio.currentTime);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, transcriptions, showSubtitles, user, id]);

  // Volume and playback rate control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  const handlePlayPause = async () => {
    if (!audiobook) return;

    if (!audioUrl) {
      // Need to get presigned URL first
      console.log('[AudiobookDetails] Getting presigned URL...');
      const url = await getPresignedUrl(audiobook.id);
      if (url) {
        console.log('[AudiobookDetails] Got presigned URL, setting audio source');
        setAudioUrl(url);
        // Audio will start playing after URL is set via useEffect
      }
    } else {
      // Toggle play/pause
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  // Auto-play when URL is set
  useEffect(() => {
    if (audioUrl && audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl]);

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(value);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
    }
  };

  const handleChapterClick = async (startTime: number) => {
    if (!audioRef.current) {
      // Need to load audio first
      if (!audioUrl && audiobook) {
        const url = await getPresignedUrl(audiobook.id);
        if (url) {
          setAudioUrl(url);
          // Wait for audio to load before seeking
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = startTime;
              audioRef.current.play();
              setIsPlaying(true);
            }
          }, 500);
        }
      }
    } else {
      audioRef.current.currentTime = startTime;
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
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

          <div className="grid md:grid-cols-[400px,1fr] gap-12 items-start">
            {/* Cover */}
            <div className="space-y-6 animate-scale-in">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={audiobook.cover_url || "/placeholder.svg"}
                  alt={audiobook.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
                        disabled={isGettingUrl}
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

      {/* Audio element with progressive streaming */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          crossOrigin="anonymous"
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-xl shadow-2xl z-50">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Slider
                value={progress}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground min-w-[100px] text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={audiobook.cover_url || "/placeholder.svg"}
                  alt={audiobook.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="hidden md:block min-w-0">
                  <p className="font-semibold text-sm truncate">{audiobook.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {audiobook.author}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={handleSkipBack}>
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  className="gradient-hero border-0 w-12 h-12"
                  onClick={handlePlayPause}
                  disabled={isGettingUrl}
                >
                  {isGettingUrl ? (
                    <span className="text-xs">...</span>
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" fill="currentColor" />
                  )}
                </Button>

                <Button size="icon" variant="ghost" onClick={handleSkipForward}>
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3 flex-1 justify-end">
                {/* Playback speed control */}
                <div className="hidden sm:flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="bg-secondary text-foreground text-sm rounded px-2 py-1 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
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

                {/* Subtitle toggle */}
                {transcriptions.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className="hidden sm:flex"
                    title={showSubtitles ? "Ocultar legendas" : "Mostrar legendas"}
                  >
                    <Captions className={`w-5 h-5 ${showSubtitles ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                )}

                {/* Volume control */}
                <div className="hidden md:flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-24"
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
