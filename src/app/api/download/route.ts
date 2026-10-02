import { NextRequest, NextResponse } from 'next/server';
import { resolveDownloadLinks, DownloadRequestParams } from '@/services/downloadProviders';
import { MediaType } from '@/types';

export const dynamic = 'force-dynamic';

function extractParams(data: any): DownloadRequestParams {
  const tmdb_id = data.tmdb_id || data.tmdbId || data.id || '533535';
  const imdb_id = data.imdb_id || data.imdbId || undefined;
  const media_type = (data.media_type || data.type || 'movie') as MediaType;
  const title = data.title || 'media';
  const year = data.year ? parseInt(data.year, 10) : undefined;
  const season = data.season ? parseInt(data.season, 10) : undefined;
  const episode = data.episode ? parseInt(data.episode, 10) : undefined;

  return {
    tmdb_id,
    imdb_id,
    media_type,
    title,
    year,
    season,
    episode,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  const params = extractParams(data);
  const result = await resolveDownloadLinks(params);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = extractParams(body);
    const result = await resolveDownloadLinks(params);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        provider: 'None',
        links: [],
        errors: [{ provider: 'API Handler', error: err?.message || 'Invalid request body' }],
      },
      { status: 400 }
    );
  }
}
