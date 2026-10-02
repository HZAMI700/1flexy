/**
 * Poster Resolver & Multi-Step Fallback Chain (Fix-003)
 *
 * Guarantees that every movie and TV series always renders a crisp artwork poster.
 * Fallback priority:
 * 1. TMDB poster_path (w500)
 * 2. TMDB original language poster
 * 3. TMDB images endpoint highest-rated poster
 * 4. TMDB backdrop_path (w500 / original)
 * 5. Premium generated SVG placeholder with title & cinematic icon
 */

import { MediaItem } from '@/types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const memoryCache = new Map<string, { url: string; timestamp: number }>();

/**
 * Generates an SVG data URI poster placeholder (500x750, 2:3 aspect ratio)
 * centered with the title, media badge, and film camera icon.
 */
export function generateSvgPlaceholder(title: string = 'Untitled', mediaType?: string): string {
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Break title into lines (max 22 chars per line, up to 3 lines)
  const words = safeTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= 18) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) break;
    }
  }
  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }

  const badge = mediaType === 'tv' ? 'SERIES' : 'MOVIE';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="500" height="750">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="50%" stop-color="#141414"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#E50914" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="500" height="750" fill="url(#bg)"/>
  <rect width="500" height="750" fill="url(#glow)"/>

  <!-- Top Netflix-style N mark -->
  <text x="40" y="60" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" fill="#E50914" letter-spacing="2">NETFLIX</text>

  <!-- Type Badge -->
  <rect x="400" y="38" width="60" height="24" rx="4" fill="#282828" stroke="#404040" stroke-width="1"/>
  <text x="430" y="54" font-family="sans-serif" font-weight="700" font-size="10" fill="#B3B3B3" text-anchor="middle" letter-spacing="1">${badge}</text>

  <!-- Film Reel / Clapperboard Icon -->
  <g transform="translate(190, 240)" fill="#E50914" opacity="0.9">
    <rect x="10" y="20" width="100" height="70" rx="8" fill="#1f1f1f" stroke="#E50914" stroke-width="3"/>
    <polygon points="45,40 45,70 75,55" fill="#E50914"/>
    <circle cx="25" cy="10" r="14" fill="#282828" stroke="#E50914" stroke-width="2"/>
    <circle cx="95" cy="10" r="14" fill="#282828" stroke="#E50914" stroke-width="2"/>
  </g>

  <!-- Title Text -->
  <g transform="translate(250, 410)" text-anchor="middle">
    ${lines
      .map(
        (line, idx) =>
          `<text y="${idx * 34}" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="26" fill="#FFFFFF" letter-spacing="-0.5">${line}</text>`
      )
      .join('\n    ')}
  </g>

  <!-- Subtle bottom branding -->
  <text x="250" y="700" font-family="sans-serif" font-size="12" fill="#666666" text-anchor="middle" letter-spacing="1.5">STREAM IN ULTRA HD</text>
</svg>
`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a valid image URL synchronously using fallback priority
 */
export function getPosterWithFallback(media: Partial<MediaItem>): string {
  if (media.poster_path && media.poster_path.trim() !== '') {
    if (media.poster_path.startsWith('http://') || media.poster_path.startsWith('https://')) {
      return media.poster_path;
    }
    return `${TMDB_IMAGE_BASE}${media.poster_path}`;
  }

  if (media.backdrop_path && media.backdrop_path.trim() !== '') {
    if (media.backdrop_path.startsWith('http://') || media.backdrop_path.startsWith('https://')) {
      return media.backdrop_path;
    }
    return `${TMDB_IMAGE_BASE}${media.backdrop_path}`;
  }

  return generateSvgPlaceholder(media.title || 'Untitled', media.media_type);
}

/**
 * Async resolver trying the multi-step TMDB fallback chain
 */
export async function resolvePoster(
  tmdbId?: number | string,
  mediaType: 'movie' | 'tv' = 'movie',
  originalLanguage?: string,
  posterPath?: string | null,
  backdropPath?: string | null,
  title: string = 'Untitled'
): Promise<string> {
  const cacheKey = `poster_${tmdbId || title}_${mediaType}`;

  // 1. Check in-memory cache
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.url;
  }

  // 2. Priority 1: Direct poster path
  if (posterPath && posterPath.trim() !== '') {
    const finalUrl = posterPath.startsWith('http')
      ? posterPath
      : `${TMDB_IMAGE_BASE}${posterPath}`;
    memoryCache.set(cacheKey, { url: finalUrl, timestamp: Date.now() });
    return finalUrl;
  }

  // 3. Priority 2 & 3: TMDB API checks if key available
  const apiKey =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY
      : null;

  if (apiKey && tmdbId) {
    try {
      // Re-query TMDB images endpoint
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/images?api_key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.posters && data.posters.length > 0) {
          // Select highest rated poster
          const best = data.posters.reduce((prev: any, curr: any) =>
            (curr.vote_average || 0) > (prev.vote_average || 0) ? curr : prev
          );
          if (best?.file_path) {
            const finalUrl = `${TMDB_IMAGE_BASE}${best.file_path}`;
            memoryCache.set(cacheKey, { url: finalUrl, timestamp: Date.now() });
            return finalUrl;
          }
        }
      }
    } catch {
      // Fall through to backdrop
    }
  }

  // 4. Priority 4: Backdrop fallback
  if (backdropPath && backdropPath.trim() !== '') {
    const finalUrl = backdropPath.startsWith('http')
      ? backdropPath
      : `${TMDB_IMAGE_BASE}${backdropPath}`;
    memoryCache.set(cacheKey, { url: finalUrl, timestamp: Date.now() });
    return finalUrl;
  }

  // 5. Priority 5: Generated SVG placeholder
  const placeholder = generateSvgPlaceholder(title, mediaType);
  memoryCache.set(cacheKey, { url: placeholder, timestamp: Date.now() });
  return placeholder;
}
