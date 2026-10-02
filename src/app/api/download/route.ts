import { NextRequest, NextResponse } from 'next/server';
import { resolveDownloadWithFallback } from '@/services/downloadProviders';
import { MediaType } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId') || searchParams.get('id') || '533535';
  const type = (searchParams.get('type') || 'movie') as MediaType;
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!, 10) : undefined;
  const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!, 10) : undefined;
  const title = searchParams.get('title') || 'media';
  const imdbId = searchParams.get('imdbId') || undefined;

  const result = await resolveDownloadWithFallback({
    tmdbId,
    type,
    season,
    episode,
    title,
    imdbId,
  });

  return NextResponse.json({
    success: result.links.length > 0,
    provider: result.providerName,
    providerType: result.providerType,
    hasSubtitles: result.hasSubtitles,
    links: result.links,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tmdbId = '533535', type = 'movie', season, episode, title = 'media', imdbId } = body;

    const result = await resolveDownloadWithFallback({
      tmdbId,
      type: type as MediaType,
      season: season ? parseInt(season, 10) : undefined,
      episode: episode ? parseInt(episode, 10) : undefined,
      title,
      imdbId,
    });

    return NextResponse.json({
      success: result.links.length > 0,
      provider: result.providerName,
      providerType: result.providerType,
      hasSubtitles: result.hasSubtitles,
      links: result.links,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Invalid request body' },
      { status: 400 }
    );
  }
}
