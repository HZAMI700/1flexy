import { DownloadLink, MediaType } from '@/types';
import { resolveDownloadWithFallback, DownloadProviderResult } from './downloadProviders';

export interface FaselHdRequestParams {
  tmdbId: string | number;
  type: MediaType;
  season?: number;
  episode?: number;
  title?: string;
}

class FaselHdService {
  /**
   * Fetch download result using priority-based fallback across all providers:
   * 1. FaselHD API
   * 2. EgyBest API
   * 3. ArabSeed Scraper
   * 4. MovieBox API
   * 5. VibraVid
   * 6. vidsrc-dlp
   * 7. Torrent Scraper API
   * 8. Nullbr API
   */
  public async getDownloadResult(params: FaselHdRequestParams): Promise<DownloadProviderResult> {
    try {
      // In browser, call the /api/download route if available, or fall back to internal resolver
      if (typeof window !== 'undefined') {
        const query = new URLSearchParams({
          tmdbId: params.tmdbId.toString(),
          type: params.type,
          title: params.title || 'media',
        });
        if (params.season) query.append('season', params.season.toString());
        if (params.episode) query.append('episode', params.episode.toString());

        const res = await fetch(`/api/download?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.links && data.links.length > 0) {
            return {
              providerName: data.provider || 'FaselHD API',
              providerType: data.providerType || 'primary',
              hasSubtitles: data.hasSubtitles !== false,
              links: data.links,
            };
          }
        }
      }
    } catch (e) {
      console.warn('API route call fallback:', e);
    }

    return resolveDownloadWithFallback(params);
  }

  public async getDownloadLinks(params: FaselHdRequestParams): Promise<DownloadLink[]> {
    const res = await this.getDownloadResult(params);
    return res.links;
  }
}

export const FaselHd = new FaselHdService();
