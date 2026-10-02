/**
 * Nxsha.space Stream Extractor & Resolver (v10.0.0)
 *
 * NEW-002 & NEW-004:
 * Nxsha is a media discovery/indexing service that does not host files directly.
 * Its embed endpoints (https://nxsha.space/embed/movie/{id} and https://nxsha.space/embed/tv/{id}/{s}/{e})
 * embed or route to third-party streams.
 *
 * This resolver implements:
 * 1. Rapid HTML manifestUri / script inspection
 * 2. Headless Playwright network request interception to capture underlying .m3u8 / .mp4 URLs
 * 3. Graceful fallback & error suppression (never throws unhandled exceptions)
 */

import axios from 'axios';

export interface NxshaStreamResult {
  url: string;
  quality: '480p' | '720p' | '1080p';
  format: 'mp4' | 'hls';
  source: string;
}

// In-memory cache for resolved stream URLs (TTL: 30 minutes)
interface CacheEntry {
  data: NxshaStreamResult;
  expiresAt: number;
}
const streamCache = new Map<string, CacheEntry>();

export function getNxshaEmbedUrl(
  tmdbId: string | number,
  mediaType: 'movie' | 'tv' = 'movie',
  season: number = 1,
  episode: number = 1
): string {
  if (mediaType === 'movie') {
    return `https://nxsha.space/embed/movie/${tmdbId}`;
  }
  return `https://nxsha.space/embed/tv/${tmdbId}/${season}/${episode}`;
}

/**
 * Rapid probe via HTTP request to check if manifestUri or direct video URL is present in the HTML/JSON response
 */
async function fastHttpProbe(embedUrl: string): Promise<NxshaStreamResult | null> {
  try {
    const res = await axios.get(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://nxsha.space/',
      },
      timeout: 4500,
    });

    const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    // Look for manifestUri in JSON props
    const manifestMatch = html.match(/"manifestUri"\s*:\s*"([^"]+)"/);
    if (manifestMatch && manifestMatch[1] && manifestMatch[1].startsWith('http')) {
      const url = manifestMatch[1].replace(/\\\//g, '/');
      const isM3u8 = url.includes('.m3u8');
      return {
        url,
        quality: '1080p',
        format: isM3u8 ? 'hls' : 'mp4',
        source: 'Nxsha Fast Manifest Probe',
      };
    }

    // Look for direct stream or source regex
    const streamRegex = /(https?:\/\/[^\s"']+\.(?:m3u8|mp4)[^\s"']*)/i;
    const streamMatch = html.match(streamRegex);
    if (streamMatch && streamMatch[1]) {
      const url = streamMatch[1].replace(/\\\//g, '/');
      const isM3u8 = url.includes('.m3u8');
      return {
        url,
        quality: '1080p',
        format: isM3u8 ? 'hls' : 'mp4',
        source: 'Nxsha Fast Regex Probe',
      };
    }
  } catch (err) {
    // Probe failed or timed out, continue to Playwright
  }
  return null;
}

/**
 * Playwright network interception to extract stream URLs
 */
async function playwrightInterception(embedUrl: string): Promise<NxshaStreamResult | null> {
  let browser: any = null;
  try {
    // Dynamic import so it does not fail if playwright is not compiled in client context
    const { chromium } = await import('playwright');

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    let capturedUrl: string | null = null;
    let detectedFormat: 'mp4' | 'hls' = 'hls';

    // Intercept responses for media stream URLs
    page.on('response', (response: any) => {
      if (capturedUrl) return;
      const url = response.url();
      const contentType = (response.headers()['content-type'] || '').toLowerCase();

      if (
        url.includes('.m3u8') ||
        contentType.includes('application/vnd.apple.mpegurl') ||
        contentType.includes('application/x-mpegurl')
      ) {
        capturedUrl = url;
        detectedFormat = 'hls';
      } else if (
        url.includes('.mp4') ||
        contentType.includes('video/mp4') ||
        contentType.includes('video/octet-stream')
      ) {
        if (!url.includes('google-analytics') && !url.includes('doubleclick')) {
          capturedUrl = url;
          detectedFormat = 'mp4';
        }
      }
    });

    // Navigate with 9s timeout
    await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 9000 });

    // Wait up to 3s for network activity if stream not yet captured
    const startTime = Date.now();
    while (!capturedUrl && Date.now() - startTime < 3000) {
      await page.waitForTimeout(300);
    }

    if (capturedUrl) {
      return {
        url: capturedUrl,
        quality: '1080p',
        format: detectedFormat,
        source: 'Nxsha Playwright Interceptor',
      };
    }
  } catch (err: any) {
    // Suppress Playwright launch / execution errors
    console.warn('[NxshaResolver] Playwright extraction notice:', err?.message || err);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close error
      }
    }
  }

  return null;
}

/**
 * Main stream resolver for Nxsha
 */
export async function resolveNxshaStream(
  tmdbId: string | number,
  mediaType: 'movie' | 'tv' = 'movie',
  season: number = 1,
  episode: number = 1
): Promise<NxshaStreamResult | null> {
  const cacheKey = `nxsha:${tmdbId}:${mediaType}:${season}:${episode}`;
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const embedUrl = getNxshaEmbedUrl(tmdbId, mediaType, season, episode);

  // 1. Fast HTTP probe
  const probeResult = await fastHttpProbe(embedUrl);
  if (probeResult) {
    streamCache.set(cacheKey, { data: probeResult, expiresAt: Date.now() + 30 * 60 * 1000 });
    return probeResult;
  }

  // 2. Playwright network interception
  const playwrightResult = await playwrightInterception(embedUrl);
  if (playwrightResult) {
    streamCache.set(cacheKey, { data: playwrightResult, expiresAt: Date.now() + 30 * 60 * 1000 });
    return playwrightResult;
  }

  return null;
}
