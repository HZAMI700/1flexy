'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Download,
  Share2,
  Heart,
  Check,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { watchForOverlayInjection, killPlayerOverlays } from '@/lib/player-overlay-killer';
import { buildPlayerEmbedUrl, getSavedProgress, StreamingProviderId } from '@/lib/vaplayer';
import { useVaPlayerEvents } from '@/lib/vaplayer-events';
import { VidstackPlayer } from '@/components/players/VidstackPlayer';
import { getPosterWithFallback } from '@/lib/poster-resolver';
import { DownloadLinkItem } from '@/services/downloadProviders';

const PROVIDERS: { id: StreamingProviderId; name: string }[] = [
  { id: 'vaplayer', name: 'VaPlayer (Primary Embed)' },
  { id: 'moviebox', name: 'MovieBox (Vidstack Native)' },
  { id: 'vidfast', name: 'VidFast (Fallback Embed)' },
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
  const [provider, setProvider] = useState<StreamingProviderId>('vaplayer');
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [copied, setCopied] = useState(false);
  const [autoNextNotice, setAutoNextNotice] = useState<number | null>(null);

  // Vidstack Native Stream State & Download Links
  const [directStreamUrl, setDirectStreamUrl] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinkItem[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);

  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    openDownload,
    favorites,
    toggleFavorite,
    saveProgress,
  } = useAppStore();

  const isFav = favorites.some((item) => item.id.toString() === media.id.toString());
  const tmdbId = media.tmdb_id || media.id;
  const imdbId = media.imdb_id;

  // Retrieve saved progress
  const [resumeSeconds, setResumeSeconds] = useState(0);

  useEffect(() => {
    const saved = getSavedProgress(media.id, media.media_type, season, episode);
    setResumeSeconds(saved);
  }, [media.id, media.media_type, season, episode]);

  // Hook VaPlayer events
  useVaPlayerEvents({
    media,
    currentSeason: season,
    currentEpisode: episode,
    onAutoNextEpisode: (nextEp) => {
      if (media.media_type === 'tv') {
        setAutoNextNotice(nextEp);
        setTimeout(() => {
          setEpisode(nextEp);
          setAutoNextNotice(null);
        }, 3500);
      }
    },
  });

  // Eliminate transparent pop-under overlays over player
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

  // Pre-fetch download links from /api/download for Vidstack Player download button
  useEffect(() => {
    let isCancelled = false;

    async function fetchDl() {
      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_id: media.tmdb_id || media.id,
            imdb_id: media.imdb_id,
            media_type: media.media_type,
            title: media.title,
            season,
            episode,
          }),
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.links && data.links.length > 0) {
            setDownloadLinks(data.links);
          }
        }
      } catch (e) {
        console.warn('Failed to pre-fetch download links for Vidstack in WatchPlayer:', e);
      }
    }

    fetchDl();
    return () => {
      isCancelled = true;
    };
  }, [media, season, episode]);

  // Fetch MovieBox direct stream when moviebox provider is selected
  useEffect(() => {
    if (provider !== 'moviebox') {
      setDirectStreamUrl(null);
      return;
    }

    let isCancelled = false;
    setStreamLoading(true);

    async function fetchStream() {
      try {
        const res = await fetch(
          `/api/moviebox/stream?title=${encodeURIComponent(media.title)}&season=${season}&episode=${episode}`
        );
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.success && data.streamUrl) {
            setDirectStreamUrl(data.streamUrl);
            setStreamLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to resolve direct MovieBox stream in WatchPlayer:', err);
      }

      if (!isCancelled) {
        console.warn('Direct stream resolution failed, switching to VidFast fallback...');
        setProvider('vidfast');
        setStreamLoading(false);
      }
    }

    fetchStream();
    return () => {
      isCancelled = true;
    };
  }, [media, provider, season, episode]);

  const embedUrl = buildPlayerEmbedUrl({
    id: tmdbId,
    imdbId,
    mediaType: media.media_type,
    season,
    episode,
    autoplay: true,
    provider,
    resumeAt: resumeSeconds,
  });

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div className="bg-[#141414] border border-[#282828] rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#181818] border-b border-[#282828] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base font-display">
              {media.title}
            </span>
            {media.media_type === 'tv' && (
              <span className="text-[#E50914] font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#E50914]/15">
                S{season} : E{episode}
              </span>
            )}
            {resumeSeconds > 0 && (
              <span className="text-[11px] text-[#46D369] font-mono bg-[#282828] px-1.5 py-0.5 rounded hidden sm:inline">
                Resume {Math.floor(resumeSeconds / 60)}m
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#46D369] bg-[#46D369]/10 px-2.5 py-1 rounded border border-[#46D369]/20 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            {provider === 'vaplayer' ? 'VaPlayer Engine' : 'VidFast Shield'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Server Switcher Dropdown */}
          <div className="flex items-center gap-1.5">
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

          {/* Download Button */}
          <button
            onClick={() => openDownload(media, season, episode)}
            className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-[#E50914] transition-colors"
            title="Download via Direct Engine"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(media)}
            className={`p-1.5 rounded-lg transition-colors ${
              isFav
                ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40'
                : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
            }`}
            title="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-colors"
            title="Share"
          >
            {copied ? <Check className="w-4 h-4 text-[#46D369]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Auto Next Episode Notification */}
      {autoNextNotice && (
        <div className="bg-[#E50914] text-white text-xs font-bold py-2 px-4 flex items-center justify-between animate-fadeIn">
          <span>Episode finished! Loading Episode {autoNextNotice} automatically...</span>
          <button
            onClick={() => {
              setEpisode(autoNextNotice);
              setAutoNextNotice(null);
            }}
            className="underline hover:text-black font-semibold ml-4"
          >
            Play Now
          </button>
        </div>
      )}

      {/* Player Frame: Vidstack Native or Iframe Embed */}
      <div
        ref={videoWrapperRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
      >
        {streamLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-[#B3B3B3]">
            <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Connecting to MovieBox Direct Stream (Vidstack Native)...</p>
          </div>
        ) : provider === 'moviebox' && directStreamUrl ? (
          <VidstackPlayer
            src={directStreamUrl}
            title={media.title}
            poster={getPosterWithFallback(media)}
            mediaId={media.id}
            mediaType={media.media_type}
            season={season}
            episode={episode}
            downloadUrl={downloadLinks[0]?.url}
            downloadFilename={`${media.title.replace(/[^a-zA-Z0-9_-]/g, '_')}${media.media_type === 'tv' ? `_S${season}E${episode}` : ''}.mp4`}
            downloadLinks={downloadLinks}
            autoPlay={true}
            startAt={resumeSeconds}
            onProgress={(sec) => {
              saveProgress({
                id: media.id,
                mediaType: media.media_type,
                title: media.title,
                poster: media.poster_path,
                backdrop: media.backdrop_path,
                season,
                episode,
                currentTime: sec,
                duration: 0,
                progressPercent: 0,
                lastWatched: Date.now(),
              });
            }}
            onEnded={() => {
              if (media.media_type === 'tv') {
                setEpisode(episode + 1);
              }
            }}
            onError={() => {
              console.warn('Vidstack playback failed in WatchPlayer, switching to VidFast fallback...');
              setProvider('vidfast');
            }}
            onNextEpisode={media.media_type === 'tv' ? () => setEpisode(episode + 1) : undefined}
          />
        ) : (
          <iframe
            id="player-iframe"
            key={`${provider}-${tmdbId}-${season}-${episode}`}
            src={embedUrl}
            title={media.title}
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
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-[#181818] text-xs flex items-center justify-between border-t border-[#282828] text-[#808080]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            Server: {provider === 'vaplayer' ? 'VaPlayer Primary (vidapi.ru)' : provider === 'moviebox' ? 'MovieBox Vidstack Native (Direct Stream)' : 'VidFast Fallback'}
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
          <span>Pop-under Blocker: Online</span>
        </div>
      </div>
    </div>
  );
};
