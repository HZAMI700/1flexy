/**
 * VaPlayer postMessage Events Integration (NEW-003)
 *
 * Listens for PLAYER_EVENT messages from vaplayer.ru every ~5 seconds.
 * Powers:
 * - Continue Watching persistence
 * - Auto-Next-Episode advancement upon completion
 * - Resume playback timestamps
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MediaItem } from '@/types';

export interface VaPlayerInfo {
  imdb: string | null;
  tmdb: string | null;
  mediaType: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
  title: string | null;
  poster: string | null;
}

export interface VaPlayerPayload {
  player_info: VaPlayerInfo;
  player_status: 'playing' | 'paused' | 'completed' | 'seeked';
  player_progress: number;
  player_duration: number;
  quality?: {
    label: string;
    width: number;
    height: number;
  };
  availableQualities?: string[];
}

export interface VaPlayerEventMessage {
  type: 'PLAYER_EVENT';
  data: VaPlayerPayload;
}

interface UseVaPlayerEventsOptions {
  media?: MediaItem | null;
  currentSeason?: number;
  currentEpisode?: number;
  onAutoNextEpisode?: (nextEpisodeNumber: number) => void;
  onStatusChange?: (status: string, progress: number, duration: number) => void;
}

export function useVaPlayerEvents({
  media,
  currentSeason = 1,
  currentEpisode = 1,
  onAutoNextEpisode,
  onStatusChange,
}: UseVaPlayerEventsOptions) {
  const { saveProgress, removeProgress } = useAppStore();
  const optionsRef = useRef({
    media,
    currentSeason,
    currentEpisode,
    onAutoNextEpisode,
    onStatusChange,
    saveProgress,
    removeProgress,
  });

  useEffect(() => {
    optionsRef.current = {
      media,
      currentSeason,
      currentEpisode,
      onAutoNextEpisode,
      onStatusChange,
      saveProgress,
      removeProgress,
    };
  }, [media, currentSeason, currentEpisode, onAutoNextEpisode, onStatusChange, saveProgress, removeProgress]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      // VaPlayer sends PLAYER_EVENT messages
      if (!event.data || event.data.type !== 'PLAYER_EVENT') return;

      const payload: VaPlayerPayload = event.data.data;
      if (!payload || !payload.player_info) return;

      const { player_info, player_status, player_progress, player_duration } = payload;
      const opts = optionsRef.current;

      const mediaId =
        opts.media?.id ||
        player_info.tmdb ||
        player_info.imdb ||
        'unknown';

      const mediaType = player_info.mediaType || opts.media?.media_type || 'movie';
      const season = player_info.season || opts.currentSeason || 1;
      const episode = player_info.episode || opts.currentEpisode || 1;

      const progressKey =
        mediaType === 'tv'
          ? `progress_${mediaId}_s${season}_e${episode}`
          : `progress_${mediaId}`;

      const progressSeconds = Math.max(0, Math.floor(player_progress || 0));
      const durationSeconds = Math.max(1, Math.floor(player_duration || 7200));
      const progressPercent = Math.min(
        100,
        Math.max(1, Math.round((progressSeconds / durationSeconds) * 100))
      );

      // Notify callback if provided
      if (opts.onStatusChange) {
        opts.onStatusChange(player_status, progressSeconds, durationSeconds);
      }

      switch (player_status) {
        case 'playing':
        case 'seeked':
        case 'paused': {
          // Persist progress to localStorage
          try {
            localStorage.setItem(progressKey, progressSeconds.toString());
            localStorage.setItem(`lastWatched_${mediaId}`, Date.now().toString());
          } catch {
            // Ignore
          }

          // Update Zustand Continue Watching state
          if (opts.media && progressSeconds > 5) {
            opts.saveProgress({
              id: opts.media.id,
              mediaType: opts.media.media_type,
              title: opts.media.title,
              poster: opts.media.poster_path,
              backdrop: opts.media.backdrop_path,
              season: mediaType === 'tv' ? season : undefined,
              episode: mediaType === 'tv' ? episode : undefined,
              episodeTitle: mediaType === 'tv' ? `Episode ${episode}` : undefined,
              currentTime: progressSeconds,
              duration: durationSeconds,
              progressPercent,
              lastWatched: Date.now(),
            });
          }
          break;
        }

        case 'completed': {
          // Remove progress item upon video finish
          try {
            localStorage.removeItem(progressKey);
          } catch {
            // Ignore
          }

          if (opts.media) {
            opts.removeProgress(opts.media.id);
          }

          // Trigger Auto Next Episode if TV
          if (mediaType === 'tv' && opts.onAutoNextEpisode) {
            opts.onAutoNextEpisode(episode + 1);
          }
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
}
