/**
 * VidAPI Integration Service (NEW-002)
 *
 * Connects directly to vidapi.ru endpoints for catalog content:
 * - /movies/latest/page-{PAGE}.json
 * - /tvshows/latest/page-{PAGE}.json
 * - /episodes/latest/page-{PAGE}.json
 * - /imdb/api/?action=stats
 *
 * Implements 6-hour caching and graceful fallbacks.
 */

import { MediaItem } from '@/types';

export interface VidApiMovieItem {
  tmdb_id: number | string;
  imdb_id?: string | null;
  title: string;
  year?: string;
  poster_url?: string;
  rating?: string;
  genre?: string;
  popularity?: string;
  type?: 'movie';
  embed_url?: string;
}

export interface VidApiTvItem {
  tmdb_id: number | string;
  imdb_id?: string | null;
  title: string;
  year?: string;
  poster_url?: string;
  rating?: string;
  genre?: string;
  popularity?: string;
  type?: 'tv';
  embed_url?: string;
}

export interface VidApiEpisodeItem {
  show_tmdb_id: number | string;
  season_number: number | string;
  episode_number: number | string;
  episode_title?: string;
  air_date?: string;
  show_title: string;
  show_imdb_id?: string | null;
  type?: 'episode';
  embed_url?: string;
}

export interface VidApiStats {
  total_titles: number;
  movies: number;
  tv_shows: number;
  episodes: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setInCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export const vidApi = {
  /**
   * Fetch library stats
   */
  async getStats(): Promise<VidApiStats> {
    const cacheKey = 'vidapi_stats';
    const cached = getFromCache<VidApiStats>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch('https://vidapi.ru/imdb/api/?action=stats', {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        const stats: VidApiStats = {
          total_titles: json.imdb?.total_titles || json.content_library?.movies + json.content_library?.tv_shows || 108167,
          movies: json.imdb?.movies || json.content_library?.movies || 89155,
          tv_shows: json.imdb?.tv_series || json.content_library?.tv_shows || 19012,
          episodes: json.imdb?.episodes || json.content_library?.episodes || 340210,
        };
        setInCache(cacheKey, stats);
        return stats;
      }
    } catch {
      // Fallback
    }

    const fallback: VidApiStats = {
      total_titles: 108167,
      movies: 89155,
      tv_shows: 19012,
      episodes: 340210,
    };
    setInCache(cacheKey, fallback);
    return fallback;
  },

  /**
   * Fetch Latest Movies from VidAPI
   */
  async getLatestMovies(page: number = 1): Promise<MediaItem[]> {
    const cacheKey = `vidapi_movies_p${page}`;
    const cached = getFromCache<MediaItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://vidapi.ru/movies/latest/page-${page}.json`, {
        next: { revalidate: 21600 },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        const items: VidApiMovieItem[] = Array.isArray(data)
          ? data
          : data.items || data.results || [];

        const mediaItems: MediaItem[] = items.map((item) => ({
          id: item.tmdb_id || item.imdb_id || item.title,
          tmdb_id: typeof item.tmdb_id === 'number' ? item.tmdb_id : parseInt(String(item.tmdb_id), 10) || undefined,
          imdb_id: item.imdb_id || undefined,
          title: item.title,
          overview: `Released in ${item.year || 'recent years'}. Available on VaPlayer with pristine quality and multi-audio stream support.`,
          poster_path: item.poster_url || null,
          backdrop_path: item.poster_url || null,
          vote_average: parseFloat(item.rating || '7.5') || 7.5,
          popularity: parseFloat(item.popularity || '15') || 15,
          media_type: 'movie',
          release_date: item.year ? `${item.year}-01-01` : undefined,
          genres: item.genre
            ? item.genre.split(',').map((g, idx) => ({ id: idx + 1, name: g.trim() }))
            : [{ id: 1, name: 'Cinema' }],
        }));

        if (mediaItems.length > 0) {
          setInCache(cacheKey, mediaItems);
          return mediaItems;
        }
      }
    } catch (err) {
      console.warn('VidAPI latest movies fetch failed, using fallback:', err);
    }

    return [];
  },

  /**
   * Fetch Latest TV Shows from VidAPI
   */
  async getLatestTvShows(page: number = 1): Promise<MediaItem[]> {
    const cacheKey = `vidapi_tv_p${page}`;
    const cached = getFromCache<MediaItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://vidapi.ru/tvshows/latest/page-${page}.json`, {
        next: { revalidate: 21600 },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        const items: VidApiTvItem[] = Array.isArray(data)
          ? data
          : data.items || data.results || [];

        const mediaItems: MediaItem[] = items.map((item) => ({
          id: item.tmdb_id || item.imdb_id || item.title,
          tmdb_id: typeof item.tmdb_id === 'number' ? item.tmdb_id : parseInt(String(item.tmdb_id), 10) || undefined,
          imdb_id: item.imdb_id || undefined,
          title: item.title,
          overview: `TV Series from ${item.year || 'recent years'}. Stream full seasons and episodes directly on VaPlayer.`,
          poster_path: item.poster_url || null,
          backdrop_path: item.poster_url || null,
          vote_average: parseFloat(item.rating || '8.0') || 8.0,
          popularity: parseFloat(item.popularity || '20') || 20,
          media_type: 'tv',
          first_air_date: item.year ? `${item.year}-01-01` : undefined,
          number_of_seasons: 1,
          genres: item.genre
            ? item.genre.split(',').map((g, idx) => ({ id: idx + 1, name: g.trim() }))
            : [{ id: 1, name: 'Series' }],
        }));

        if (mediaItems.length > 0) {
          setInCache(cacheKey, mediaItems);
          return mediaItems;
        }
      }
    } catch (err) {
      console.warn('VidAPI latest TV shows fetch failed, using fallback:', err);
    }

    return [];
  },

  /**
   * Fetch Latest Episodes from VidAPI
   */
  async getLatestEpisodes(page: number = 1): Promise<MediaItem[]> {
    const cacheKey = `vidapi_episodes_p${page}`;
    const cached = getFromCache<MediaItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://vidapi.ru/episodes/latest/page-${page}.json`, {
        next: { revalidate: 21600 },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        const items: VidApiEpisodeItem[] = Array.isArray(data)
          ? data
          : data.items || data.results || [];

        const mediaItems: MediaItem[] = items.map((ep) => {
          const sNum = parseInt(String(ep.season_number), 10) || 1;
          const eNum = parseInt(String(ep.episode_number), 10) || 1;
          const showId = ep.show_tmdb_id || ep.show_imdb_id || ep.show_title;

          return {
            id: showId,
            tmdb_id: typeof ep.show_tmdb_id === 'number' ? ep.show_tmdb_id : parseInt(String(ep.show_tmdb_id), 10) || undefined,
            imdb_id: ep.show_imdb_id || undefined,
            title: `${ep.show_title} (S${sNum}:E${eNum})`,
            overview: ep.episode_title
              ? `"${ep.episode_title}" - Aired ${ep.air_date || 'recently'}. Available for instant streaming.`
              : `Episode ${eNum} of Season ${sNum}. Air date: ${ep.air_date || 'N/A'}.`,
            poster_path: null,
            backdrop_path: null,
            vote_average: 8.2,
            popularity: 25,
            media_type: 'tv',
            release_date: ep.air_date,
          };
        });

        if (mediaItems.length > 0) {
          setInCache(cacheKey, mediaItems);
          return mediaItems;
        }
      }
    } catch (err) {
      console.warn('VidAPI latest episodes fetch failed, using fallback:', err);
    }

    return [];
  },
};
