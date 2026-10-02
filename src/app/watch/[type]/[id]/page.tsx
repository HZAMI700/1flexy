import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { WatchPlayer } from '@/components/WatchPlayer';
import { ContentRow } from '@/components/ContentRow';
import { EpisodeList } from '@/components/EpisodeList';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface Props {
  params: {
    type: string;
    id: string;
  };
  searchParams?: {
    s?: string;
    e?: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isMovie = params.type === 'movie';
  const media = isMovie
    ? await tmdbApi.getMovieDetails(params.id)
    : await tmdbApi.getTVDetails(params.id);

  if (!media) {
    return { title: 'Watch Media - Netflix' };
  }

  return {
    title: `Watch ${media.title} Online Full HD & 4K | Netflix`,
    description: media.overview,
  };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const isMovie = params.type === 'movie';
  const media = isMovie
    ? await tmdbApi.getMovieDetails(params.id)
    : await tmdbApi.getTVDetails(params.id);

  if (!media) {
    notFound();
  }

  const seasonNum = parseInt(searchParams?.s || '1', 10);
  const episodeNum = parseInt(searchParams?.e || '1', 10);

  const backUrl = isMovie ? `/movie/${media.id}` : `/tv/${media.id}`;

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#B3B3B3] hover:text-white transition-colors py-2 px-3.5 rounded bg-[#181818] border border-[#282828] hover:bg-[#282828]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </Link>
        <div className="flex items-center gap-2 text-xs text-[#46D369] bg-[#46D369]/10 px-3 py-1.5 rounded border border-[#46D369]/20 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>VidFast AdShield Active</span>
        </div>
      </div>

      {/* Main Full Player Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <WatchPlayer
          media={media}
          initialSeason={seasonNum}
          initialEpisode={episodeNum}
        />
      </div>

      {/* Episode Picker (if TV) */}
      {!isMovie && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <EpisodeList
            media={media}
            seasons={media.seasons}
            initialSeason={seasonNum}
          />
        </div>
      )}

      {/* Recommended Titles */}
      {media.similar && media.similar.length > 0 && (
        <div className="max-w-7xl mx-auto mt-12">
          <ContentRow
            title="More Like This"
            items={media.similar}
            variant="poster"
          />
        </div>
      )}
    </div>
  );
}
