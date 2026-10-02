'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Server,
  Share2,
  Heart,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Check,
  Download,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { watchForOverlayInjection, killPlayerOverlays } from '@/lib/player-overlay-killer';
import { buildPlayerEmbedUrl, getSavedProgress, StreamingProviderId } from '@/lib/vaplayer';
import { useVaPlayerEvents } from '@/lib/vaplayer-events';

const PROVIDERS: { id: StreamingProviderId; name: string; tag: string }[] = [
  { id: 'vaplayer', name: 'VaPlayer (Primary)', tag: 'Clean / Fast' },
  { id: 'moviebox', name: 'MovieBox (Secondary)', tag: 'Stream Extractor' },
  { id: 'vidfast', name: 'VidFast (Fallback)', tag: 'Mirror Server' },
];

export const PlayerModal: React.FC = () => {
  const {
    playerModal,
    closePlayer,
    openPlayer,
    openDownload,
    favorites,
    toggleFavorite,
    saveProgress,
  } = useAppStore();

  const { isOpen, media, season = 1, episode = 1 } = playerModal;

  const [currentProvider, setCurrentProvider] = useState<StreamingProviderId>('vaplayer');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [autoNextNotice, setAutoNextNotice] = useState<number | null>(null);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Read saved progress timestamp for continue watching
  const [resumeSeconds, setResumeSeconds] = useState(0);

  useEffect(() => {
    if (isOpen && media) {
      const saved = getSavedProgress(media.id, media.media_type, season, episode);
      setResumeSeconds(saved);
      setCurrentProvider('vaplayer');
      setLoadError(false);
    }
  }, [isOpen, media, season, episode]);

  // Hook VaPlayer postMessage events for resume, continue watching, and auto-next
  useVaPlayerEvents({
    media,
    currentSeason: season,
    currentEpisode: episode,
    onAutoNextEpisode: (nextEp) => {
      if (media?.media_type === 'tv') {
        setAutoNextNotice(nextEp);
        setTimeout(() => {
          openPlayer(media, season, nextEp);
          setAutoNextNotice(null);
        }, 3500);
      }
    },
    onStatusChange: (_status, _progress, _duration) => {
      // Clear load error on successful activity
      setLoadError(false);
    },
  });

  // Watch and remove any pop-under click-catchers stacked over player
  useEffect(() => {
    if (!isOpen || !videoWrapperRef.current) return;
    const session = watchForOverlayInjection(videoWrapperRef.current);
    return () => {
      session.cleanup();
    };
  }, [isOpen, currentProvider, season, episode]);

  // Fallback watchdog: VaPlayer (8s) -> Moviebox-API (8s) -> VidFast fallback
  useEffect(() => {
    if (!isOpen) return;

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    if (currentProvider === 'vaplayer') {
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('VaPlayer load timed out (>8s). Switching to MovieBox secondary...');
        setIsSwitching(true);
        setTimeout(() => {
          setCurrentProvider('moviebox');
          setIsSwitching(false);
        }, 600);
      }, 8000);
    } else if (currentProvider === 'moviebox') {
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('MovieBox load timed out (>8s). Switching to VidFast fallback...');
        setIsSwitching(true);
        setTimeout(() => {
          setCurrentProvider('vidfast');
          setIsSwitching(false);
        }, 600);
      }, 8000);
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isOpen, currentProvider, season, episode]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePlayer();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closePlayer]);

  if (!isOpen || !media) return null;

  const isFav = favorites.some((item) => item.id.toString() === media.id.toString());
  const tmdbId = media.tmdb_id || media.id;
  const imdbId = media.imdb_id;

  const embedUrl = buildPlayerEmbedUrl({
    id: tmdbId,
    imdbId,
    mediaType: media.media_type,
    season,
    episode,
    autoplay: autoPlay,
    provider: currentProvider,
    resumeAt: resumeSeconds,
  });

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNextEpisode = () => {
    openPlayer(media, season, episode + 1);
  };

  const handlePrevEpisode = () => {
    if (episode > 1) {
      openPlayer(media, season, episode - 1);
    }
  };

  const handleIframeLoaded = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    if (videoWrapperRef.current) {
      killPlayerOverlays(videoWrapperRef.current);
    }
  };

  const handleProviderSwitch = (provider: StreamingProviderId) => {
    setIsSwitching(true);
    setCurrentProvider(provider);
    setTimeout(() => setIsSwitching(false), 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={closePlayer}
    >
      <div
        ref={playerContainerRef}
        className={`bg-[#141414] border border-[#282828] rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 w-full ${
          isTheaterMode
            ? 'max-w-[98vw] h-[95vh]'
            : 'max-w-6xl h-full sm:h-auto sm:max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-[#282828] flex-wrap gap-2">
          {/* Left: Media Title & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={closePlayer}
              aria-label="Close Player"
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm line-clamp-1 font-display">
                  {media.title}
                </span>
                {media.media_type === 'tv' && (
                  <span className="px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] text-xs font-semibold">
                    S{season} : E{episode}
                  </span>
                )}
                {resumeSeconds > 0 && (
                  <span className="hidden md:inline-flex text-[10px] bg-[#282828] text-[#46D369] px-1.5 py-0.5 rounded font-mono">
                    Resuming at {Math.floor(resumeSeconds / 60)}m
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#808080]">
                <span className="flex items-center gap-1 text-[#46D369]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {currentProvider === 'vaplayer'
                    ? 'VaPlayer Event Shield Active'
                    : 'VidFast Pop-under Filter Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right: Player Controls & Server Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* TV Episode Controls */}
            {media.media_type === 'tv' && (
              <div className="flex items-center gap-1 bg-[#242424] border border-[#333333] rounded-lg p-0.5">
                <button
                  onClick={handlePrevEpisode}
                  disabled={episode <= 1}
                  className="px-2 py-1 text-xs text-[#B3B3B3] hover:text-white disabled:opacity-30 disabled:hover:text-[#B3B3B3] flex items-center gap-0.5"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-[11px] font-mono text-[#808080] px-1">Ep {episode}</span>
                <button
                  onClick={handleNextEpisode}
                  className="px-2 py-1 text-xs text-[#B3B3B3] hover:text-white flex items-center gap-0.5"
                  title="Next Episode"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Streaming Provider Switcher */}
            <div className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-[#808080] hidden sm:inline" />
              <select
                value={currentProvider}
                onChange={(e) => handleProviderSwitch(e.target.value as StreamingProviderId)}
                className="bg-[#242424] border border-[#383838] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E50914] cursor-pointer transition-colors"
                title="Select Streaming Server"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Download Button */}
            <button
              onClick={() => {
                closePlayer();
                openDownload(media, season, episode);
              }}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-[#E50914] transition-colors"
              title="Direct Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(media)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFav
                  ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40'
                  : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
              }`}
              title={isFav ? 'In Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-colors relative"
              title="Share Title"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#46D369]" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-colors hidden md:block"
              title="Theater Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auto Next Episode Notification Overlay */}
        {autoNextNotice && (
          <div className="bg-[#E50914] text-white text-xs font-bold py-2 px-4 flex items-center justify-between animate-fadeIn">
            <span>Episode completed! Playing Episode {autoNextNotice} in 3 seconds...</span>
            <button
              onClick={() => {
                openPlayer(media, season, autoNextNotice);
                setAutoNextNotice(null);
              }}
              className="underline hover:text-black font-semibold ml-4"
            >
              Play Now
            </button>
          </div>
        )}

        {/* Embedded Player Frame */}
        <div
          ref={videoWrapperRef}
          className="relative w-full aspect-video bg-black flex-grow flex items-center justify-center overflow-hidden"
        >
          {isSwitching ? (
            <div className="flex flex-col items-center justify-center gap-3 text-[#B3B3B3]">
              <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Connecting to {currentProvider === 'vaplayer' ? 'VaPlayer Primary' : currentProvider === 'moviebox' ? 'MovieBox Secondary' : 'VidFast Fallback'}...</p>
            </div>
          ) : (
            <iframe
              id="player-iframe"
              key={`${currentProvider}-${tmdbId}-${season}-${episode}`}
              src={embedUrl}
              title={media.title}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
              referrerPolicy="no-referrer"
              loading="eager"
              onLoad={handleIframeLoaded}
              onError={() => {
                if (currentProvider === 'vaplayer') {
                  setCurrentProvider('moviebox');
                } else if (currentProvider === 'moviebox') {
                  setCurrentProvider('vidfast');
                }
              }}
            />
          )}
        </div>

        {/* Bottom Status & AdBlock Notification Bar */}
        <div className="px-4 py-2 bg-[#181818] text-xs flex items-center justify-between border-t border-[#282828] text-[#808080]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
              Connected: {currentProvider === 'vaplayer' ? 'VaPlayer Primary (vidapi.ru)' : currentProvider === 'moviebox' ? 'MovieBox Secondary (Stream Extractor)' : 'VidFast.vc Fallback'}
            </span>
            {currentProvider !== 'vaplayer' && (
              <button
                onClick={() => handleProviderSwitch('vaplayer')}
                className="text-[11px] text-[#E50914] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Retry VaPlayer
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Theme: #E50914</span>
            <span className="hidden sm:inline">Resume: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
