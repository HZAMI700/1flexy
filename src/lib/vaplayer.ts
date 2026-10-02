/**
 * Unified Multi-Provider Streaming Utilities (v8.0.0)
 *
 * Configures:
 * 1. VaPlayer (Primary — https://vaplayer.ru)
 * 2. Moviebox-API (Secondary — FastAPI microservice stream extractor)
 * 3. VidFast (Fallback — https://vidfast.vc)
 */

export type StreamingProviderId = 'vaplayer' | 'moviebox' | 'nxsha' | 'vidfast';

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
    title = 'Movie',
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

  if (provider === 'moviebox') {
    // Moviebox Secondary Provider (Verified live embed endpoint)
    if (mediaType === 'movie') {
      return `https://vidsrc.to/embed/movie/${targetId}`;
    }
    return `https://vidsrc.to/embed/tv/${targetId}/${season}/${episode}`;
  }

  if (provider === 'nxsha') {
    // Nxsha Secondary Embed Provider (v10.0.0)
    if (mediaType === 'movie') {
      return `https://nxsha.space/embed/movie/${targetId}`;
    }
    return `https://nxsha.space/embed/tv/${targetId}/${season}/${episode}`;
  }

  // VidFast Fallback Provider
  const autoPlayBool = autoplay ? 'true' : 'false';
  const theme = '16A085';

  if (mediaType === 'movie') {
    return `https://vidfast.vc/movie/${id}?autoPlay=${autoPlayBool}&title=true&poster=true&theme=${theme}&chromecast=true&fullscreenButton=true`;
  }

  return `https://vidfast.vc/tv/${id}/${season}/${episode}?autoPlay=${autoPlayBool}&nextButton=true&autoNext=true&theme=${theme}&chromecast=true`;
}
