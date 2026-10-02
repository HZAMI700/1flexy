import { DownloadLink, MediaType } from '@/types';
import { resolveDownloadLinks, DownloadLinkItem } from './downloadProviders';

export interface FaselHdRequestParams {
  tmdbId: string | number;
  type: MediaType;
  season?: number;
  episode?: number;
  title?: string;
  imdbId?: string;
}

export interface FaselHdResult {
  providerName: string;
  providerType: string;
  hasSubtitles: boolean;
  links: any[];
}

class FaselHdService {
  /**
   * Fetch download result using priority-based fallback across all providers
   */
  public async getDownloadResult(params: FaselHdRequestParams): Promise<FaselHdResult> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_id: params.tmdbId,
            media_type: params.type,
            title: params.title || 'media',
            season: params.season,
            episode: params.episode,
            imdb_id: params.imdbId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.links && data.links.length > 0) {
            return {
              providerName: data.provider || 'HDHub Bypass API',
              providerType: 'direct',
              hasSubtitles: true,
              links: data.links,
            };
          }
        }
      }
    } catch (e) {
      console.warn('API route call fallback in FaselHdService:', e);
    }

    const direct = await resolveDownloadLinks({
      tmdb_id: params.tmdbId,
      media_type: params.type,
      title: params.title || 'media',
      season: params.season,
      episode: params.episode,
      imdb_id: params.imdbId,
    });

    return {
      providerName: direct.provider,
      providerType: 'direct',
      hasSubtitles: true,
      links: direct.links,
    };
  }

  public async getDownloadLinks(params: FaselHdRequestParams): Promise<any[]> {
    const res = await this.getDownloadResult(params);
    return res.links;
  }
}

export const FaselHd = new FaselHdService();
