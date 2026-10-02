import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { WatchPlayer } from '@/components/WatchPlayer';
import { MediaRow } from '@/components/MediaRow';
import { EpisodeList } from '@/components/EpisodeList';
import { ArrowLeft, Film, Tv, ShieldCheck } from 'lucide-react';
import { MediaType } from '@/types';

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
    return { title: 'Watch Media - VidFast' };
  }

  return {
    title: `Watch ${media.title} Online Full HD & 4K | VidFast`,
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
    <div className="min-h-screen bg-background pb-16">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-surface border border-surface-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </Link>
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
          <ShieldCheck className="w-4 h-4" />
          <span>VidFast Secure Stream Protection</span>
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
          <MediaRow
            title="You Might Also Like"
            items={media.similar}
            icon={isMovie ? <Film className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
          />
        </div>
      )}
    </div>
  );
}
