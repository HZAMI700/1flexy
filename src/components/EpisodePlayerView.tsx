'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Server,
  Download,
  Share2,
  Check,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const SERVERS = [
  { id: 'vidfast', name: 'VidFast Primary (Fastest)' },
  { id: 'vidsrc', name: 'CloudStream Backup' },
  { id: 'embedsu', name: 'FastCDN Mirror' },
];

interface EpisodePlayerViewProps {
  media: MediaItem;
  season: number;
  episode: number;
}

export const EpisodePlayerView: React.FC<EpisodePlayerViewProps> = ({
  media,
  season,
  episode,
}) => {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState('vidfast');
  const [copiedLink, setCopiedLink] = useState(false);
  const { openDownload } = useAppStore();

  const tmdbId = media.tmdb_id || media.id;

  const getEmbedUrl = () => {
    if (selectedServer === 'vidfast') {
      return `https://vidfast.vc/tv/${tmdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true&theme=16A085&chromecast=true`;
    }
    if (selectedServer === 'vidsrc') {
      return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
    }
    return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
  };

  const handleNext = () => {
    router.push(`/tv/${media.id}/${season}/${episode + 1}`);
  };

  const handlePrev = () => {
    if (episode > 1) {
      router.push(`/tv/${media.id}/${season}/${episode - 1}`);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-surface border-b border-surface-border flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white text-base font-display">
            {media.title}{' '}
            <span className="text-primary font-mono text-sm ml-1">
              (S{season} : E{episode})
            </span>
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-accent bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5" /> AdBlock Protected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Previous / Next Episode buttons */}
          <div className="flex items-center gap-1 bg-surface-light border border-surface-border rounded-lg p-0.5">
            <button
              onClick={handlePrev}
              disabled={episode <= 1}
              className="px-2.5 py-1 text-xs text-text-secondary hover:text-white disabled:opacity-30 flex items-center gap-0.5 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-[11px] font-mono text-text-muted px-1.5">
              Ep {episode}
            </span>
            <button
              onClick={handleNext}
              className="px-2.5 py-1 text-xs text-text-secondary hover:text-white flex items-center gap-0.5 font-medium transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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

          {/* Fasel HD Download */}
          <button
            onClick={() => openDownload(media, season, episode)}
            className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-primary transition-colors"
            title="Download Episode (Fasel HD)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-white transition-colors"
            title="Share Episode"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Video Player Iframe */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <iframe
          key={`${selectedServer}-${tmdbId}-${season}-${episode}`}
          src={getEmbedUrl()}
          title={`${media.title} S${season} E${episode}`}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      </div>

      {/* Bottom Bar */}
      <div className="px-4 py-2.5 bg-surface text-xs flex items-center justify-between border-t border-surface-border text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          VidFast Player Streaming Engine
        </span>
        <span className="text-[11px]">4K UHD Available • Multi-Audio Subtitles</span>
      </div>
    </div>
  );
};
