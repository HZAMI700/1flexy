'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Download,
  Share2,
  Heart,
  Check,
  ShieldCheck,
  Maximize2,
  Layers,
} from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { watchForOverlayInjection, killPlayerOverlays } from '@/lib/player-overlay-killer';

const SERVERS = [
  { id: 'vidfast', name: 'VidFast Primary Server' },
  { id: 'vidsrc', name: 'CloudStream Backup' },
  { id: 'embedsu', name: 'FastCDN Mirror' },
];

interface WatchPlayerProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
}

export const WatchPlayer: React.FC<WatchPlayerProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
}) => {
  const [server, setServer] = useState('vidfast');
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [copied, setCopied] = useState(false);
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  // Eliminate transparent pop-under overlays over player
  useEffect(() => {
    if (!videoWrapperRef.current) return;
    const session = watchForOverlayInjection(videoWrapperRef.current);
    return () => {
      session.cleanup();
    };
  }, [server, season, episode, media.id]);

  const {
    openDownload,
    favorites,
    toggleFavorite,
    saveProgress,
  } = useAppStore();

  const isFav = favorites.some((item) => item.id.toString() === media.id.toString());
  const tmdbId = media.tmdb_id || media.id;

  // Track progress in watch history
  useEffect(() => {
    saveProgress({
      id: media.id,
      mediaType: media.media_type,
      title: media.title,
      poster: media.poster_path,
      backdrop: media.backdrop_path,
      season: media.media_type === 'tv' ? season : undefined,
      episode: media.media_type === 'tv' ? episode : undefined,
      currentTime: 0,
      duration: media.runtime ? media.runtime * 60 : 7200,
      progressPercent: 10,
      lastWatched: Date.now(),
    });
  }, [media, season, episode, saveProgress]);

  const getEmbedUrl = () => {
    const theme = '16A085';
    if (server === 'vidfast') {
      if (media.media_type === 'movie') {
        return `https://vidfast.vc/movie/${tmdbId}?autoPlay=true&title=true&poster=true&theme=${theme}&chromecast=true&fullscreenButton=true`;
      }
      return `https://vidfast.vc/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=${theme}&chromecast=true`;
    }

    if (server === 'vidsrc') {
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
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#282828] rounded-lg overflow-hidden shadow-2xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#181818] border-b border-[#282828] flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-base sm:text-lg font-bold text-white font-display line-clamp-1">
            {media.title}
          </h1>
          {media.media_type === 'tv' && (
            <span className="px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] text-xs font-semibold">
              S{season} : E{episode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Server Selector */}
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#808080] hidden sm:inline" />
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="bg-[#242424] border border-[#383838] text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#E50914] cursor-pointer font-medium"
            >
              {SERVERS.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fasel HD Download */}
          <button
            onClick={() => openDownload(media, season, episode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#242424] hover:bg-[#333333] text-xs text-[#B3B3B3] hover:text-white font-medium transition-colors border border-[#383838]"
          >
            <Download className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(media)}
            className={`p-1.5 rounded transition-colors border ${
              isFav
                ? 'bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40'
                : 'bg-[#242424] border-[#383838] text-[#B3B3B3] hover:text-white'
            }`}
            title="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded bg-[#242424] border border-[#383838] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-colors"
            title="Share"
          >
            {copied ? <Check className="w-4 h-4 text-[#46D369]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div
        ref={videoWrapperRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
      >
        <iframe
          key={`${server}-${tmdbId}-${season}-${episode}`}
          src={getEmbedUrl()}
          title={media.title}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
          referrerPolicy="no-referrer"
          loading="eager"
          onLoad={() => {
            if (videoWrapperRef.current) {
              killPlayerOverlays(videoWrapperRef.current);
            }
          }}
        />
      </div>

      {/* Bottom Bar Info */}
      <div className="px-6 py-3 bg-[#181818] text-xs flex items-center justify-between border-t border-[#282828] text-[#808080] flex-wrap gap-2">
        <div className="flex items-center gap-2 text-[#46D369]">
          <ShieldCheck className="w-4 h-4" />
          <span>VidFast AdShield Active: Zero pop-ups or redirect loops</span>
        </div>
        <div>
          <span>Default Quality: 1080p Full HD / 4K UHD</span>
        </div>
      </div>
    </div>
  );
};
