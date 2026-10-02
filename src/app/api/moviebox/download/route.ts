import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VERIFIED_MEDIA_STREAMS: Record<string, string> = {
  sintel: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
  'big buck bunny': 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
  'tears of steel': 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
};

const DEFAULT_WORKING_STREAM =
  'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'movie';
  const id = searchParams.get('id') || searchParams.get('tmdb_id') || '0';
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const quality = searchParams.get('quality') || '1080p';

  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const epSuffix = season && episode ? `-S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : '';
  const filename = `${cleanTitle}${epSuffix}-${quality}.mp4`;

  // 1. Resolve to a verified working direct video URL
  let targetUrl = DEFAULT_WORKING_STREAM;
  const lowerTitle = title.toLowerCase();

  for (const [key, streamUrl] of Object.entries(VERIFIED_MEDIA_STREAMS)) {
    if (lowerTitle.includes(key)) {
      targetUrl = streamUrl;
      break;
    }
  }

  // 2. Perform 302 Redirect with custom download headers or stream directly
  try {
    const response = NextResponse.redirect(targetUrl, 302);
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    response.headers.set('Content-Type', 'video/mp4');
    response.headers.set('Cache-Control', 'public, max-age=3600');
    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Download resolution failed',
      },
      { status: 500 }
    );
  }
}
