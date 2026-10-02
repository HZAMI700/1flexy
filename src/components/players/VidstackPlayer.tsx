'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerInstance,
  type PlayerSrc,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import '@/styles/vidstack-netflix-theme.css';

import { ArrowLeft, Check, ChevronDown, Download, RotateCcw } from 'lucide-react';
import { NetflixDownloadIcon } from '@/components/icons/NetflixDownloadIcon';
import { DownloadLinkItem } from '@/services/downloadProviders';

export interface VidstackPlayerProps {
  src: PlayerSrc;
  title: string;
  poster?: string;
  mediaId?: string | number;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  downloadUrl?: string;
  downloadFilename?: string;
  downloadLinks?: DownloadLinkItem[];
  autoPlay?: boolean;
  startAt?: number;
  onProgress?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onBack?: () => void;
  onNextEpisode?: () => void;
  hasIntro?: boolean;
  introEndSeconds?: number;
}

export const VidstackPlayer: React.FC<VidstackPlayerProps> = ({
  src,
  title,
  poster,
  mediaId,
  mediaType = 'movie',
  season = 1,
  episode = 1,
  downloadUrl,
  downloadFilename,
  downloadLinks = [],
  autoPlay = true,
  startAt = 0,
  onProgress,
  onEnded,
  onError,
  onBack,
  onNextEpisode,
  hasIntro = true,
  introEndSeconds = 85,
}) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Auto-hide controls after 3 seconds of idle mouse
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      setShowQualityMenu(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  // Save playback progress to localStorage (for Continue Watching row)
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    onProgress?.(currentTime);

    // Save every 5 seconds (throttled)
    if (Math.abs(currentTime - lastSavedTimeRef.current) >= 5 && mediaId) {
      lastSavedTimeRef.current = currentTime;
      if (typeof window !== 'undefined') {
        const key =
          mediaType === 'tv'
            ? `progress_${mediaId}_s${season}_e${episode}`
            : `progress_${mediaId}`;
        try {
          if (currentTime > 5 && (duration === 0 || currentTime < duration - 15)) {
            localStorage.setItem(key, currentTime.toString());
          }
        } catch {
          // Ignore storage quota errors
        }
      }
    }

    // Skip Intro logic: appears between 5s and introEndSeconds
    if (hasIntro && currentTime >= 5 && currentTime <= introEndSeconds) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }

    // Next Episode overlay for TV shows: appears in last 30s
    if (mediaType === 'tv' && duration > 60 && currentTime >= duration - 30) {
      setShowNextOverlay(true);
    } else {
      setShowNextOverlay(false);
    }
  };

  const handleSkipIntro = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = introEndSeconds + 1;
      setShowSkipIntro(false);
    }
  };

  // Direct download trigger with fallback filename
  const triggerDownload = (url: string, quality?: string) => {
    if (!url) return;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const epSuffix = mediaType === 'tv' ? `_S${season}E${episode}` : '';
    const qSuffix = quality ? `_${quality}` : '';
    const filename =
      downloadFilename || `${cleanTitle}${epSuffix}${qSuffix}.mp4`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccessToast(`Downloading ${quality || 'video'}...`);
    setShowQualityMenu(false);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Primary download URL for default layout
  const primaryUrl = downloadUrl || (downloadLinks.length > 0 ? downloadLinks[0].url : undefined);

  return (
    <div
      className="vidstack-player-root relative w-full h-full bg-black flex items-center justify-center select-none"
      onMouseMove={handleMouseMove}
      onClick={() => setShowQualityMenu(false)}
    >
      {/* Top Chrome: Back Button, Title, and Netflix Download Control */}
      <div
        className={`netflix-player-topbar transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              aria-label="Back to Browse"
              className="p-2 rounded-full bg-black/60 hover:bg-[#E50914] text-white transition-all transform hover:scale-110 border border-white/20"
              title="Close / Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base md:text-lg font-display drop-shadow-md">
                {title}
              </span>
              {mediaType === 'tv' && (
                <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-xs font-semibold uppercase tracking-wider">
                  S{season} : E{episode}
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              Vidstack 480p Native Stream • Red Minimal Chrome
            </span>
          </div>
        </div>

        {/* Right: Top-level Download Button & Multiple Quality Menu */}
        <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {downloadLinks && downloadLinks.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 text-white text-xs font-medium border border-white/20 transition-all hover:border-[#E50914]"
                title="Download in multiple qualities"
              >
                <NetflixDownloadIcon className="w-4 h-4 text-[#E50914]" />
                <span className="hidden sm:inline">Download</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Quality Dropdown Menu */}
              {showQualityMenu && (
                <div className="vds-menu-items absolute right-0 mt-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/10">
                    Select Quality
                  </div>
                  {downloadLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => triggerDownload(link.url, link.quality)}
                      className="vds-menu-item flex items-center justify-between gap-4 text-xs font-medium"
                    >
                      <span className="text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />
                        {link.quality}
                      </span>
                      <span className="text-zinc-400 text-[11px] font-mono">
                        {link.size}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : primaryUrl ? (
            <button
              onClick={() => triggerDownload(primaryUrl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 text-white text-xs font-medium border border-white/20 transition-all hover:border-[#E50914]"
              title="Direct Download MP4"
            >
              <NetflixDownloadIcon className="w-4 h-4 text-[#E50914]" />
              <span className="hidden sm:inline">Direct Download</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Vidstack MediaPlayer Component */}
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        currentTime={startAt}
        playsInline
        onTimeUpdate={(detail) => {
          if (playerRef.current) {
            handleTimeUpdate(detail.currentTime, playerRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          onEnded?.();
          if (mediaType === 'tv' && onNextEpisode) {
            onNextEpisode();
          }
        }}
        onError={(err) => {
          console.warn('[VidstackPlayer] Stream decode/playback error, switching to fallback:', err);
          onError?.(err);
        }}
        className="w-full h-full aspect-video"
      >
        <MediaProvider />

        {/* Default layout with custom NetflixDownloadIcon & download configuration */}
        <DefaultVideoLayout
          icons={{
            ...defaultLayoutIcons,
            DownloadButton: {
              Default: (props: any) => <NetflixDownloadIcon className="w-5 h-5 text-white" {...props} />,
            },
          }}
          download={
            primaryUrl
              ? {
                  url: primaryUrl,
                  filename: downloadFilename || `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`,
                }
              : undefined
          }
        />
      </MediaPlayer>

      {/* Netflix Skip Intro Button Overlay */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          className="netflix-skip-intro-btn animate-fadeIn"
          title="Skip Intro (+85s)"
        >
          Skip Intro
        </button>
      )}

      {/* Netflix Next Episode Overlay for TV Series */}
      {showNextOverlay && mediaType === 'tv' && onNextEpisode && (
        <div className="absolute bottom-20 right-6 z-30 bg-zinc-900/95 border border-zinc-700/80 rounded-lg p-4 shadow-2xl backdrop-blur-md flex items-center gap-4 animate-fadeIn">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Up Next
            </span>
            <span className="text-sm font-bold text-white">
              Episode {episode + 1}
            </span>
          </div>
          <button
            onClick={onNextEpisode}
            className="px-4 py-2 bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold rounded transition-colors shadow"
          >
            Play Now
          </button>
        </div>
      )}

      {/* Download Toast Notification */}
      {downloadSuccessToast && (
        <div className="absolute bottom-6 left-6 z-40 bg-zinc-900 border border-[#E50914]/40 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-[#46D369]" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}
    </div>
  );
};

export default VidstackPlayer;
