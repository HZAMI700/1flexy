import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { CastCarousel } from '@/components/CastCarousel';
import { EpisodeList } from '@/components/EpisodeList';
import { ContentRow } from '@/components/ContentRow';
import { TVDetailActions } from '@/components/TVDetailActions';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await tmdbApi.getTVDetails(params.id);
  if (!show) {
    return { title: 'TV Show Not Found - Netflix' };
  }
  return {
    title: `${show.title} - Watch TV Series on Netflix`,
    description: show.overview,
    openGraph: {
      title: `${show.title} - Watch on Netflix`,
      description: show.overview,
      images: show.backdrop_path ? [show.backdrop_path] : [],
    },
  };
}

export default async function TVDetailPage({ params }: Props) {
  const show = await tmdbApi.getTVDetails(params.id);

  if (!show) {
    notFound();
  }

  const year = show.first_air_date
    ? new Date(show.first_air_date).getFullYear()
    : 2024;

  const matchScore = Math.min(
    99,
    Math.max(86, Math.round((show.vote_average || 8.0) * 10 + 10))
  );

  const durationText = `${show.number_of_seasons || 1} Season${(show.number_of_seasons || 1) > 1 ? 's' : ''}`;
  const maturityRating = show.vote_average >= 8 ? 'TV-MA' : 'PG-13';

  return (
    <div className="min-h-screen bg-black pb-16">
      {/* 1. Full-width Backdrop */}
      <div className="relative w-full h-[65vh] min-h-[460px] max-h-[720px]">
        {show.backdrop_path ? (
          <Image
            src={show.backdrop_path}
            alt={show.title}
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-[#141414]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
      </div>

      {/* 2. Content Container */}
      <div className="max-w-7xl mx-auto px-[4%] -mt-48 sm:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Thumbnail */}
          <div className="relative w-48 sm:w-64 aspect-[2/3] rounded-md overflow-hidden shadow-2xl border border-[#282828] flex-shrink-0 bg-[#141414]">
            {show.poster_path ? (
              <Image
                src={show.poster_path}
                alt={show.title}
                fill
                priority
                className="object-cover"
              />
            ) : null}
          </div>

          {/* Details & Actions */}
          <div className="flex-grow space-y-4 pt-2 md:pt-16">
            {/* Metadata Line */}
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className="text-[#46D369] font-bold">{matchScore}% Match</span>
              <span className="text-[#B3B3B3]">{year}</span>
              <span className="px-1.5 py-0.2 rounded border border-[#808080] text-xs text-white bg-black/40">
                {maturityRating}
              </span>
              <span className="text-[#B3B3B3]">{durationText}</span>
              <span className="px-1.5 py-0.2 rounded border border-[#808080] text-[10px] font-black uppercase text-white bg-black/40">
                Ultra HD 4K
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
              {show.title}
            </h1>

            {/* Tagline */}
            {show.tagline && (
              <p className="text-sm font-medium text-[#B3B3B3] italic">
                &quot;{show.tagline}&quot;
              </p>
            )}

            {/* Actions */}
            <TVDetailActions show={show} />

            {/* Storyline */}
            <div className="pt-2">
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-3xl">
                {show.overview}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Season Selector & Episode List */}
        <EpisodeList media={show} seasons={show.seasons} initialSeason={1} />

        {/* 4. Cast Carousel */}
        {show.cast && show.cast.length > 0 && (
          <div className="mt-12">
            <CastCarousel cast={show.cast} />
          </div>
        )}

        {/* 5. Recommended TV Shows */}
        {show.similar && show.similar.length > 0 && (
          <div className="mt-12">
            <ContentRow
              title="Recommended Series"
              items={show.similar}
              variant="poster"
            />
          </div>
        )}
      </div>
    </div>
  );
}
