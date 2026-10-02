'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Tv,
  Film,
  Server,
  Share2,
  Heart,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Check,
  Download,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const SERVERS = [
  { id: 'vidfast', name: 'VidFast Primary (Fastest)', provider: 'vidfast.vc' },
  { id: 'vidsrc', name: 'CloudStream Backup', provider: 'vidsrc.cc' },
  { id: 'embedsu', name: 'FastCDN Mirror', provider: 'embed.su' },
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

  const { isOpen, media, season = 1, episode = 1, server = 'VidFast Primary' } = playerModal;

  const [selectedServer, setSelectedServer] = useState('vidfast');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);

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

  // Track progress in watch history
  useEffect(() => {
    if (isOpen && media) {
      saveProgress({
        id: media.id,
        mediaType: media.media_type,
        title: media.title,
        poster: media.poster_path,
        backdrop: media.backdrop_path,
        season: media.media_type === 'tv' ? season : undefined,
        episode: media.media_type === 'tv' ? episode : undefined,
        episodeTitle: media.media_type === 'tv' ? `Episode ${episode}` : undefined,
        currentTime: 0,
        duration: media.runtime ? media.runtime * 60 : 7200,
        progressPercent: 15,
        lastWatched: Date.now(),
      });
    }
  }, [isOpen, media, season, episode, saveProgress]);

  if (!isOpen || !media) return null;

  const isFav = favorites.some((item) => item.id.toString() === media.id.toString());
  const tmdbId = media.tmdb_id || media.id;

  // Build embed URL based on provider & specifications
  const getEmbedUrl = () => {
    const theme = '16A085';
    if (selectedServer === 'vidfast') {
      if (media.media_type === 'movie') {
        return `https://vidfast.vc/movie/${tmdbId}?autoPlay=${autoPlay}&title=true&poster=true&theme=${theme}&chromecast=true&fullscreenButton=true`;
      }
      return `https://vidfast.vc/tv/${tmdbId}/${season}/${episode}?autoPlay=${autoPlay}&nextButton=true&autoNext=true&theme=${theme}&chromecast=true`;
    }

    if (selectedServer === 'vidsrc') {
      if (media.media_type === 'movie') {
        return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
      }
      return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
    }

    // Embed.su
    if (media.media_type === 'movie') {
      return `https://embed.su/embed/movie/${tmdbId}`;
    }
    return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNextEpisode = () => {
    openPlayer(media, season, episode + 1, server);
  };

  const handlePrevEpisode = () => {
    if (episode > 1) {
      openPlayer(media, season, episode - 1, server);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-0 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={closePlayer}
    >
      <div
        ref={playerContainerRef}
        className={`bg-surface-dark border border-surface-border rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 w-full ${
          isTheaterMode
            ? 'max-w-[98vw] h-[95vh]'
            : 'max-w-6xl h-full sm:h-auto sm:max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-surface-border flex-wrap gap-2">
          {/* Left: Media Title & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={closePlayer}
              aria-label="Close Player"
              className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm line-clamp-1 font-display">
                  {media.title}
                </span>
                {media.media_type === 'tv' && (
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-accent text-xs font-semibold">
                    S{season} : E{episode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-text-muted">
                <span className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VidFast Pop-under Shield Active
                </span>
              </div>
            </div>
          </div>

          {/* Center / Right: Player Controls & Server Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* TV Episode Controls */}
            {media.media_type === 'tv' && (
              <div className="flex items-center gap-1 bg-surface-light border border-surface-border rounded-lg p-0.5">
                <button
                  onClick={handlePrevEpisode}
                  disabled={episode <= 1}
                  className="px-2 py-1 text-xs text-text-secondary hover:text-white disabled:opacity-30 disabled:hover:text-text-secondary flex items-center gap-0.5"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-[11px] font-mono text-text-muted px-1">Ep {episode}</span>
                <button
                  onClick={handleNextEpisode}
                  className="px-2 py-1 text-xs text-text-secondary hover:text-white flex items-center gap-0.5"
                  title="Next Episode"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Server Selector */}
            <div className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="bg-surface-light border border-surface-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
              >
                {SERVERS.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Download Button (Triggers Fasel HD Modal) */}
            <button
              onClick={() => {
                closePlayer();
                openDownload(media, season, episode);
              }}
              className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-primary transition-colors"
              title="Download via Fasel HD"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(media)}
              className={`p-1.5 rounded-lg transition-colors ${
                isFav
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-surface-light text-text-secondary hover:text-white'
              }`}
              title={isFav ? 'In Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-white transition-colors relative"
              title="Share Title"
            >
              {copiedLink ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-white transition-colors hidden md:block"
              title="Theater Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Player Frame */}
        <div className="relative w-full aspect-video bg-black flex-grow flex items-center justify-center">
          <iframe
            key={`${selectedServer}-${tmdbId}-${season}-${episode}`}
            src={getEmbedUrl()}
            title={media.title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          />
        </div>

        {/* Bottom Status & AdBlock Notification Bar */}
        <div className="px-4 py-2 bg-surface text-xs flex items-center justify-between border-t border-surface-border text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Connected to {selectedServer === 'vidfast' ? 'VidFast.vc High-Speed Embed API' : selectedServer}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Theme: #16A085</span>
            <span className="hidden sm:inline">Sandbox: Secure Isolator</span>
          </div>
        </div>
      </div>
    </div>
  );
};
