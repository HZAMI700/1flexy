export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
  slug?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime?: number;
  air_date?: string;
  vote_average?: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  overview?: string;
  poster_path?: string | null;
  episode_count: number;
  episodes?: Episode[];
}

export interface MediaItem {
  id: number | string;
  tmdb_id?: number;
  imdb_id?: string;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  media_type: MediaType;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  status?: string;
  tagline?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  cast?: CastMember[];
  similar?: MediaItem[];
  trailer_key?: string;
}

export interface DownloadLink {
  quality: '480p' | '720p' | '1080p' | '4K UHD';
  size: string;
  url: string;
  format: string;
  server: string;
  speed: string;
}

export interface WatchProgress {
  id: number | string;
  mediaType: MediaType;
  title: string;
  poster: string | null;
  backdrop: string | null;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  lastWatched: number;
}

export interface VidFastPlayerParams {
  title?: boolean;
  poster?: boolean;
  autoPlay?: boolean;
  startAt?: number;
  theme?: string;
  server?: string;
  hideServer?: boolean;
  fullscreenButton?: boolean;
  chromecast?: boolean;
  sub?: string;
  nextButton?: boolean;
  autoNext?: boolean;
}
