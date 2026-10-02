'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Server,
  Download,
  Share2,
  Check,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { watchForOverlayInjection, killPlayerOverlays } from '@/lib/player-overlay-killer';
import { buildPlayerEmbedUrl, getSavedProgress, StreamingProviderId } from '@/lib/vaplayer';
import { useVaPlayerEvents } from '@/lib/vaplayer-events';

const PROVIDERS: { id: StreamingProviderId; name: string }[] = [
  { id: 'vaplayer', name: 'VaPlayer (Primary)' },
  { id: 'moviebox', name: 'MovieBox (Secondary)' },
  { id: 'vidfast', name: 'VidFast (Fallback)' },
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
  const [provider, setProvider] = useState<StreamingProviderId>('vaplayer');
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoNextNotice, setAutoNextNotice] = useState<number | null>(null);

  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { openDownload } = useAppStore();

  const tmdbId = media.tmdb_id || media.id;
  const imdbId = media.imdb_id;

  // Retrieve saved progress
  const [resumeSeconds, setResumeSeconds] = useState(0);

  useEffect(() => {
    const saved = getSavedProgress(media.id, 'tv', season, episode);
    setResumeSeconds(saved);
  }, [media.id, season, episode]);

  // Hook VaPlayer events for auto next episode
  useVaPlayerEvents({
    media,
    currentSeason: season,
    currentEpisode: episode,
    onAutoNextEpisode: (nextEp) => {
      setAutoNextNotice(nextEp);
      setTimeout(() => {
        router.push(`/tv/${media.id}/${season}/${nextEp}`);
        setAutoNextNotice(null);
      }, 3500);
    },
  });

  // Watch for popunder overlays
  useEffect(() => {
    if (!videoWrapperRef.current) return;
    const session = watchForOverlayInjection(videoWrapperRef.current);
    return () => {
      session.cleanup();
    };
  }, [provider, season, episode, media.id]);

  // 8-second watchdog for fallback switch
  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    if (provider === 'vaplayer') {
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('VaPlayer watchdog: switching to MovieBox secondary');
        setProvider('moviebox');
      }, 8000);
    } else if (provider === 'moviebox') {
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('MovieBox watchdog: switching to VidFast fallback');
        setProvider('vidfast');
      }, 8000);
    }
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [provider, season, episode]);

  const embedUrl = buildPlayerEmbedUrl({
    id: tmdbId,
    imdbId,
    mediaType: 'tv',
    season,
    episode,
    autoplay: true,
    provider,
    resumeAt: resumeSeconds,
  });

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
      setTimeout(() => setCopiedLink(false), 2000);
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

  return (
    <div className="bg-[#141414] border border-[#282828] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#181818] border-b border-[#282828] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white text-base font-display">
            {media.title}{' '}
            <span className="text-[#E50914] font-mono text-sm ml-1">
              (S{season} : E{episode})
            </span>
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#46D369] bg-[#46D369]/10 px-2 py-0.5 rounded border border-[#46D369]/20 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> AdBlock Protected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Previous / Next Episode buttons */}
          <div className="flex items-center gap-1 bg-[#242424] border border-[#333333] rounded-lg p-0.5">
            <button
              onClick={handlePrev}
              disabled={episode <= 1}
              className="px-2.5 py-1 text-xs text-[#B3B3B3] hover:text-white disabled:opacity-30 flex items-center gap-0.5 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-[11px] font-mono text-[#808080] px-1.5">
              Ep {episode}
            </span>
            <button
              onClick={handleNext}
              className="px-2.5 py-1 text-xs text-[#B3B3B3] hover:text-white flex items-center gap-0.5 font-medium transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Server Selector */}
          <div className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-[#808080] hidden sm:inline" />
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as StreamingProviderId)}
              className="bg-[#242424] border border-[#383838] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#E50914] cursor-pointer"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Download Episode Button */}
          <button
            onClick={() => openDownload(media, season, episode)}
            className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-[#E50914] transition-colors"
            title="Download Episode"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-colors"
            title="Share Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#46D369]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Auto Next Episode Notification */}
      {autoNextNotice && (
        <div className="bg-[#E50914] text-white text-xs font-bold py-2 px-4 flex items-center justify-between animate-fadeIn">
          <span>Episode complete! Opening Episode {autoNextNotice} automatically...</span>
          <button
            onClick={handleNext}
            className="underline hover:text-black font-semibold ml-4"
          >
            Play Now
          </button>
        </div>
      )}

      {/* Video Frame */}
      <div
        ref={videoWrapperRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
      >
        <iframe
          id="player-iframe"
          key={`${provider}-${tmdbId}-${season}-${episode}`}
          src={embedUrl}
          title={`${media.title} S${season}E${episode}`}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
          referrerPolicy="no-referrer"
          loading="eager"
          onLoad={handleIframeLoaded}
          onError={() => {
            if (provider === 'vaplayer') {
              setProvider('moviebox');
            } else if (provider === 'moviebox') {
              setProvider('vidfast');
            }
          }}
        />
      </div>

      {/* Bottom Status */}
      <div className="px-4 py-2 bg-[#181818] text-xs flex items-center justify-between border-t border-[#282828] text-[#808080]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            Server: {provider === 'vaplayer' ? 'VaPlayer Primary Engine' : provider === 'moviebox' ? 'MovieBox Secondary (Stream Extractor)' : 'VidFast Fallback'}
          </span>
          {provider !== 'vaplayer' && (
            <button
              onClick={() => setProvider('vaplayer')}
              className="text-[11px] text-[#E50914] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Retry VaPlayer
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Theme: #E50914</span>
          <span>Pop-unders: Blocked</span>
        </div>
      </div>
    </div>
  );
};
