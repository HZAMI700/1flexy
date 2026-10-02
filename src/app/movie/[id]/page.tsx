import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { CastCarousel } from '@/components/CastCarousel';
import { ContentRow } from '@/components/ContentRow';
import { MovieDetailActions } from '@/components/MovieDetailActions';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await tmdbApi.getMovieDetails(params.id);
  if (!movie) {
    return { title: 'Movie Not Found - Netflix' };
  }
  return {
    title: `${movie.title} - Watch on Netflix`,
    description: movie.overview,
    openGraph: {
      title: `${movie.title} - Watch on Netflix`,
      description: movie.overview,
      images: movie.backdrop_path ? [movie.backdrop_path] : [],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const movie = await tmdbApi.getMovieDetails(params.id);

  if (!movie) {
    notFound();
  }

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : 2024;

  const matchScore = Math.min(
    99,
    Math.max(86, Math.round((movie.vote_average || 8.0) * 10 + 10))
  );

  const durationText = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : '2h 8m';

  const maturityRating = movie.vote_average >= 8 ? 'TV-MA' : 'PG-13';

  return (
    <div className="min-h-screen bg-black pb-16">
      {/* 1. Full-width Cinematic Backdrop */}
      <div className="relative w-full h-[65vh] min-h-[460px] max-h-[720px]">
        {movie.backdrop_path ? (
          <Image
            src={movie.backdrop_path}
            alt={movie.title}
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

      {/* 2. Hero Content Container */}
      <div className="max-w-7xl mx-auto px-[4%] -mt-48 sm:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Thumbnail */}
          <div className="relative w-48 sm:w-64 aspect-[2/3] rounded-md overflow-hidden shadow-2xl border border-[#282828] flex-shrink-0 bg-[#141414]">
            {movie.poster_path ? (
              <Image
                src={movie.poster_path}
                alt={movie.title}
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
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-sm font-medium text-[#B3B3B3] italic">
                &quot;{movie.tagline}&quot;
              </p>
            )}

            {/* Actions */}
            <MovieDetailActions movie={movie} />

            {/* Overview / Synopsis */}
            <div className="pt-2">
              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-3xl">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Cast Carousel */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="mt-12">
            <CastCarousel cast={movie.cast} />
          </div>
        )}

        {/* 4. More Like This Row */}
        {movie.similar && movie.similar.length > 0 && (
          <div className="mt-12">
            <ContentRow
              title="More Like This"
              items={movie.similar}
              variant="poster"
            />
          </div>
        )}
      </div>
    </div>
  );
}
