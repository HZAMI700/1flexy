/**
 * VaPlayer & VidFast Streaming Provider Utilities (NEW-001)
 *
 * Configures VaPlayer (https://vaplayer.ru) as the PRIMARY streaming engine,
 * with VidFast (https://vidfast.vc) as the robust fallback.
 *
 * Supports:
 * - Resume playback via `resumeAt` parameter
 * - Netflix Red theme branding (#E50914)
 * - Both TMDB numeric IDs and IMDB 'tt...' IDs
 * - Auto-switch fallback mechanism
 */

export type StreamingProviderId = 'vaplayer' | 'vidfast';

export interface PlayerUrlOptions {
  id: string | number;
  imdbId?: string | null;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  autoplay?: boolean;
  resumeAt?: number;
  provider?: StreamingProviderId;
  title?: string;
  poster?: string;
  lang?: string;
}

/**
 * Retrieves the saved watch progress from localStorage
 */
export function getSavedProgress(
  id: string | number,
  mediaType: 'movie' | 'tv',
  season: number = 1,
  episode: number = 1
): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key =
      mediaType === 'tv'
        ? `progress_${id}_s${season}_e${episode}`
        : `progress_${id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 10) {
        return Math.floor(parsed);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return 0;
}

/**
 * Builds the player embed URL based on provider and parameters
 */
export function buildPlayerEmbedUrl(opts: PlayerUrlOptions): string {
  const {
    id,
    imdbId,
    mediaType,
    season = 1,
    episode = 1,
    autoplay = true,
    provider = 'vaplayer',
    lang = 'en',
    resumeAt = 0,
  } = opts;

  // Use IMDB ID if available and preferred, otherwise fallback to TMDB id
  const targetId = imdbId && imdbId.startsWith('tt') ? imdbId : id;

  if (provider === 'vaplayer') {
    // VaPlayer Primary Provider
    const primaryColor = '%23E50914'; // Netflix Red
    const autoParam = autoplay ? '1' : '0';
    const resumeParam = resumeAt > 0 ? `&resumeAt=${resumeAt}` : '';

    if (mediaType === 'movie') {
      return `https://vaplayer.ru/embed/movie/${targetId}?primaryColor=${primaryColor}&autoplay=${autoParam}&lang=${lang}${resumeParam}`;
    }

    return `https://vaplayer.ru/embed/tv/${targetId}/${season}/${episode}?primaryColor=${primaryColor}&autoplay=${autoParam}&lang=${lang}${resumeParam}`;
  }

  // VidFast Fallback Provider
  const autoPlayBool = autoplay ? 'true' : 'false';
  const theme = '16A085';

  if (mediaType === 'movie') {
    return `https://vidfast.vc/movie/${id}?autoPlay=${autoPlayBool}&title=true&poster=true&theme=${theme}&chromecast=true&fullscreenButton=true`;
  }

  return `https://vidfast.vc/tv/${id}/${season}/${episode}?autoPlay=${autoPlayBool}&nextButton=true&autoNext=true&theme=${theme}&chromecast=true`;
}
