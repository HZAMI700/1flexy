import axios from 'axios';
import { MediaItem, Genre, Season, Episode, CastMember } from '@/types';
import {
  MOCK_HERO_ITEMS,
  MOCK_POPULAR_MOVIES,
  MOCK_POPULAR_TV,
  ALL_MEDIA_ITEMS,
  GENRES,
} from './mockData';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY =
  process.env.NEXT_PUBLIC_TMDB_API_KEY ||
  process.env.TMDB_API_KEY ||
  '';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const getImageUrl = (
  path: string | null | undefined,
  size: 'w185' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
): string => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
  timeout: 8000,
});

export const formatTmdbItem = (item: any, explicitType?: 'movie' | 'tv'): MediaItem => {
  const media_type = explicitType || item.media_type || (item.title ? 'movie' : 'tv');
  const title = item.title || item.name || item.original_title || item.original_name || 'Untitled';
  const release_date = item.release_date || item.first_air_date;

  return {
    id: item.id,
    tmdb_id: item.id,
    imdb_id: item.imdb_id,
    title,
    overview: item.overview || 'No overview available.',
    poster_path: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
    backdrop_path: item.backdrop_path ? getImageUrl(item.backdrop_path, 'original') : null,
    vote_average: Number((item.vote_average || 7.0).toFixed(1)),
    vote_count: item.vote_count,
    popularity: item.popularity,
    release_date,
    first_air_date: item.first_air_date,
    media_type,
    genre_ids: item.genre_ids || (item.genres ? item.genres.map((g: any) => g.id) : []),
    genres: item.genres || [],
    runtime: item.runtime || (item.episode_run_time ? item.episode_run_time[0] : 0),
    status: item.status,
    tagline: item.tagline,
    number_of_seasons: item.number_of_seasons,
    number_of_episodes: item.number_of_episodes,
    seasons: item.seasons,
  };
};

export const tmdbApi = {
  /**
   * Fetch Trending Content (Week)
   */
  async getTrending(): Promise<MediaItem[]> {
    if (!TMDB_API_KEY) {
      return [...MOCK_HERO_ITEMS, ...MOCK_POPULAR_MOVIES.slice(0, 4)];
    }
    try {
      const res = await tmdbClient.get('/trending/all/week');
      return res.data.results.map((item: any) => formatTmdbItem(item));
    } catch (err) {
      console.warn('[TMDB] getTrending failed, using mock data:', err);
      return [...MOCK_HERO_ITEMS, ...MOCK_POPULAR_MOVIES.slice(0, 4)];
    }
  },

  /**
   * Fetch Popular Movies
   */
  async getPopularMovies(page = 1): Promise<MediaItem[]> {
    if (!TMDB_API_KEY) {
      return MOCK_POPULAR_MOVIES;
    }
    try {
      const res = await tmdbClient.get('/movie/popular', { params: { page } });
      return res.data.results.map((item: any) => formatTmdbItem(item, 'movie'));
    } catch (err) {
      console.warn('[TMDB] getPopularMovies failed, using mock data:', err);
      return MOCK_POPULAR_MOVIES;
    }
  },

  /**
   * Fetch Top Rated Movies
   */
  async getTopRatedMovies(page = 1): Promise<MediaItem[]> {
    if (!TMDB_API_KEY) {
      return MOCK_POPULAR_MOVIES.filter((m) => m.vote_average >= 8.2);
    }
    try {
      const res = await tmdbClient.get('/movie/top_rated', { params: { page } });
      return res.data.results.map((item: any) => formatTmdbItem(item, 'movie'));
    } catch (err) {
      return MOCK_POPULAR_MOVIES;
    }
  },

  /**
   * Fetch Popular TV Shows
   */
  async getPopularTV(page = 1): Promise<MediaItem[]> {
    if (!TMDB_API_KEY) {
      return MOCK_POPULAR_TV;
    }
    try {
      const res = await tmdbClient.get('/tv/popular', { params: { page } });
      return res.data.results.map((item: any) => formatTmdbItem(item, 'tv'));
    } catch (err) {
      console.warn('[TMDB] getPopularTV failed, using mock data:', err);
      return MOCK_POPULAR_TV;
    }
  },

  /**
   * Fetch Top Rated TV Shows
   */
  async getTopRatedTV(page = 1): Promise<MediaItem[]> {
    if (!TMDB_API_KEY) {
      return MOCK_POPULAR_TV.filter((tv) => tv.vote_average >= 8.5);
    }
    try {
      const res = await tmdbClient.get('/tv/top_rated', { params: { page } });
      return res.data.results.map((item: any) => formatTmdbItem(item, 'tv'));
    } catch (err) {
      return MOCK_POPULAR_TV;
    }
  },

  /**
   * Fetch Movie Details
   */
  async getMovieDetails(id: string | number): Promise<MediaItem | null> {
    const mock = ALL_MEDIA_ITEMS.find(
      (m) => m.id.toString() === id.toString() && m.media_type === 'movie'
    );

    if (!TMDB_API_KEY) {
      if (mock) {
        return {
          ...mock,
          similar: MOCK_POPULAR_MOVIES.filter((m) => m.id !== mock.id),
        };
      }
      return MOCK_POPULAR_MOVIES[0];
    }

    try {
      const res = await tmdbClient.get(`/movie/${id}`, {
        params: { append_to_response: 'credits,videos,similar' },
      });
      const data = res.data;
      const formatted = formatTmdbItem(data, 'movie');

      if (data.credits?.cast) {
        formatted.cast = data.credits.cast.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path ? getImageUrl(c.profile_path, 'w185') : null,
        }));
      }

      if (data.similar?.results) {
        formatted.similar = data.similar.results
          .slice(0, 10)
          .map((item: any) => formatTmdbItem(item, 'movie'));
      }

      return formatted;
    } catch (err) {
      console.warn('[TMDB] getMovieDetails error, falling back:', err);
      return mock || MOCK_POPULAR_MOVIES[0];
    }
  },

  /**
   * Fetch TV Details
   */
  async getTVDetails(id: string | number): Promise<MediaItem | null> {
    const mock = ALL_MEDIA_ITEMS.find(
      (m) => m.id.toString() === id.toString() && m.media_type === 'tv'
    );

    if (!TMDB_API_KEY) {
      if (mock) {
        return {
          ...mock,
          similar: MOCK_POPULAR_TV.filter((t) => t.id !== mock.id),
        };
      }
      return MOCK_POPULAR_TV[0];
    }

    try {
      const res = await tmdbClient.get(`/tv/${id}`, {
        params: { append_to_response: 'credits,videos,similar' },
      });
      const data = res.data;
      const formatted = formatTmdbItem(data, 'tv');

      if (data.credits?.cast) {
        formatted.cast = data.credits.cast.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path ? getImageUrl(c.profile_path, 'w185') : null,
        }));
      }

      if (data.similar?.results) {
        formatted.similar = data.similar.results
          .slice(0, 10)
          .map((item: any) => formatTmdbItem(item, 'tv'));
      }

      return formatted;
    } catch (err) {
      console.warn('[TMDB] getTVDetails error, falling back:', err);
      return mock || MOCK_POPULAR_TV[0];
    }
  },

  /**
   * Fetch Season Episodes for TV
   */
  async getSeasonDetails(
    tvId: string | number,
    seasonNumber: number
  ): Promise<Episode[]> {
    const mock = ALL_MEDIA_ITEMS.find(
      (m) => m.id.toString() === tvId.toString() && m.media_type === 'tv'
    );
    const mockSeason = mock?.seasons?.find((s) => s.season_number === seasonNumber);
    if (mockSeason?.episodes && mockSeason.episodes.length > 0) {
      return mockSeason.episodes;
    }

    if (!TMDB_API_KEY) {
      // Generate synthetic episodes if none present
      return Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        season_number: seasonNumber,
        episode_number: i + 1,
        name: `Episode ${i + 1}`,
        overview: `A dramatic turn of events unfolds in episode ${i + 1} with high stakes and revelations.`,
        still_path: mock?.backdrop_path || null,
        runtime: 45,
      }));
    }

    try {
      const res = await tmdbClient.get(`/tv/${tvId}/season/${seasonNumber}`);
      return (res.data.episodes || []).map((ep: any) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        season_number: ep.season_number,
        name: ep.name,
        overview: ep.overview,
        still_path: ep.still_path ? getImageUrl(ep.still_path, 'w500') : null,
        runtime: ep.runtime,
        air_date: ep.air_date,
        vote_average: ep.vote_average,
      }));
    } catch (err) {
      return Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        season_number: seasonNumber,
        episode_number: i + 1,
        name: `Episode ${i + 1}`,
        overview: `A dramatic turn of events unfolds in episode ${i + 1}.`,
        still_path: mock?.backdrop_path || null,
        runtime: 45,
      }));
    }
  },

  /**
   * Multi Search
   */
  async searchMulti(query: string): Promise<MediaItem[]> {
    if (!query || !query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const mockMatches = ALL_MEDIA_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.overview.toLowerCase().includes(normalizedQuery)
    );

    if (!TMDB_API_KEY) {
      return mockMatches;
    }

    try {
      const res = await tmdbClient.get('/search/multi', {
        params: { query: normalizedQuery, include_adult: false },
      });
      const results = (res.data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => formatTmdbItem(item));

      return results.length > 0 ? results : mockMatches;
    } catch (err) {
      return mockMatches;
    }
  },

  /**
   * Get items by genre
   */
  async getByGenre(genreId: number, type: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
    const list = type === 'movie' ? MOCK_POPULAR_MOVIES : MOCK_POPULAR_TV;
    const filtered = list.filter((item) =>
      item.genres?.some((g) => g.id === genreId) ||
      item.genre_ids?.includes(genreId)
    );

    if (!TMDB_API_KEY) {
      return filtered.length > 0 ? filtered : list;
    }

    try {
      const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const res = await tmdbClient.get(endpoint, {
        params: { with_genres: genreId, sort_by: 'popularity.desc' },
      });
      return res.data.results.map((item: any) => formatTmdbItem(item, type));
    } catch (err) {
      return filtered.length > 0 ? filtered : list;
    }
  },

  getGenres(): Genre[] {
    return GENRES;
  },
};
