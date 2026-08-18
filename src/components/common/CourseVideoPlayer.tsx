import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Settings,
  Sparkles
} from 'lucide-react';

interface CourseVideoPlayerProps {
  videoUrl: string;
  title: string;
  durationMinutes?: number;
  onLessonComplete?: () => void;
  isCompleted?: boolean;
}

export const CourseVideoPlayer: React.FC<CourseVideoPlayerProps> = ({
  videoUrl,
  title,
  durationMinutes = 15,
  onLessonComplete,
  isCompleted = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Helper to determine if the URL is YouTube
  const parseVideoSource = (url: string) => {
    if (!url) return { type: 'empty', url: '' };

    const trimmed = url.trim();

    // YouTube watch URL e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ
    const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytWatchMatch && ytWatchMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytWatchMatch[1]}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
        id: ytWatchMatch[1],
        directUrl: `https://www.youtube.com/watch?v=${ytWatchMatch[1]}`
      };
    }

    // YouTube Playlist e.g. https://www.youtube.com/playlist?list=PLxyz
    const ytPlaylistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (trimmed.includes('youtube.com') && ytPlaylistMatch && ytPlaylistMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${ytPlaylistMatch[1]}&enablejsapi=1&rel=0`,
        id: ytPlaylistMatch[1],
        directUrl: trimmed
      };
    }

    // Direct MP4 / WebM video stream
    return {
      type: 'html5',
      url: trimmed,
      directUrl: trimmed
    };
  };

  const parsed = parseVideoSource(videoUrl);

  useEffect(() => {
    setLoading(true);
    setHasError(false);
    setIsPlaying(false);

    // Fallback timer to guarantee loading screen dismisses even if iframe onLoad doesn't fire
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [videoUrl]);

  // HTML5 Video Controls
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSpeedMenuOpen(false);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullScreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col">
      {/* 16:9 Aspect Ratio Video Box */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-white space-y-3">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-300">Loading KarMetra Learning Stream...</span>
          </div>
        )}

        {/* Error Fallback */}
        {hasError ? (
          <div className="p-6 text-center text-white space-y-3 max-w-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold">Video Stream Notice</h4>
            <p className="text-xs text-slate-400">
              This educational video stream is currently experiencing network difficulty or requires direct YouTube viewing.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={parsed.directUrl || videoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1"
              >
                <span>Open Video in Browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => { setHasError(false); setLoading(true); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : parsed.type === 'youtube' ? (
          /* YouTube Embed Player */
          <iframe
            src={parsed.embedUrl}
            title={title}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setHasError(true); }}
          />
        ) : (
          /* HTML5 Video Stream */
          <div className="relative w-full h-full group">
            <video
              ref={videoRef}
              src={parsed.url}
              className="w-full h-full object-contain"
              onLoadedData={() => setLoading(false)}
              onError={() => { setLoading(false); setHasError(true); }}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                if (onLessonComplete) onLessonComplete();
              }}
              playsInline
            />

            {/* Custom Control Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
              
              {/* Progress Slider */}
              <div className="w-full flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-1.5 hover:text-teal-400 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleToggleMute}
                    className="p-1.5 hover:text-teal-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="font-mono text-[11px] text-slate-300">
                    {formatSeconds(currentTime)} / {formatSeconds(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Speed Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold"
                    >
                      {playbackSpeed}x
                    </button>

                    {speedMenuOpen && (
                      <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-xl space-y-0.5 z-30 min-w-[70px]">
                        {[0.75, 1, 1.25, 1.5, 2].map(spd => (
                          <button
                            key={spd}
                            onClick={() => handleSpeedChange(spd)}
                            className={`w-full text-left px-2 py-1 text-[11px] rounded-lg ${
                              playbackSpeed === spd ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleFullScreen}
                    className="p-1.5 hover:text-teal-400 transition-colors"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Bar Information */}
      <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white text-xs">
        <div className="space-y-0.5">
          <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{title}</h4>
          <p className="text-[11px] text-slate-400">
            Duration: {durationMinutes} mins • Official KarMetra Verified Video Curriculum
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLessonComplete && (
            <button
              onClick={onLessonComplete}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isCompleted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
