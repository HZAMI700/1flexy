import { NextRequest, NextResponse } from 'next/server';
import { movieboxService } from '@/services/moviebox';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'movie';
  const season = parseInt(searchParams.get('season') || '1', 10);
  const episode = parseInt(searchParams.get('episode') || '1', 10);

  try {
    const result = await movieboxService.resolveStream(title, season, episode);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to resolve MovieBox stream',
      },
      { status: 500 }
    );
  }
}
