'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-surface border-b border-surface-border flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-base sm:text-lg font-black text-white font-display line-clamp-1">
            {media.title}
          </h1>
          {media.media_type === 'tv' && (
            <span className="px-2 py-0.5 rounded bg-primary/20 text-accent text-xs font-semibold">
              S{season} : E{episode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Server Selector */}
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="bg-surface-light border border-surface-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer font-medium"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-xs text-text-secondary hover:text-white font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(media)}
            className={`p-1.5 rounded-lg transition-colors ${
              isFav
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-light text-text-secondary hover:text-white'
            }`}
            title="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-white transition-colors"
            title="Share"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <iframe
          key={`${server}-${tmdbId}-${season}-${episode}`}
          src={getEmbedUrl()}
          title={media.title}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      </div>

      {/* Bottom Bar Info */}
      <div className="px-6 py-3 bg-surface text-xs flex items-center justify-between border-t border-surface-border text-text-muted flex-wrap gap-2">
        <div className="flex items-center gap-2 text-primary">
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
