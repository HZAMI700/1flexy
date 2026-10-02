import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { CastCarousel } from '@/components/CastCarousel';
import { MediaRow } from '@/components/MediaRow';
import { MovieDetailActions } from '@/components/MovieDetailActions';
import { Star, Clock, Calendar, ShieldCheck, Film } from 'lucide-react';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await tmdbApi.getMovieDetails(params.id);
  if (!movie) {
    return { title: 'Movie Not Found - VidFast' };
  }
  return {
    title: `${movie.title} (${
      movie.release_date ? new Date(movie.release_date).getFullYear() : 'Stream'
    }) - Watch Online & Download | VidFast`,
    description: movie.overview,
    openGraph: {
      title: `${movie.title} - Watch on VidFast`,
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
    : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 1. Full-width Cinematic Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[420px] max-h-[620px]">
        {movie.backdrop_path ? (
          <Image
            src={movie.backdrop_path}
            alt={movie.title}
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-surface-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 sm:-mt-56 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Thumbnail */}
          <div className="relative w-48 sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-surface-border flex-shrink-0 bg-surface">
            {movie.poster_path ? (
              <Image
                src={movie.poster_path}
                alt={movie.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                No Poster
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-grow space-y-4 pt-2 md:pt-12">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded bg-primary text-white font-black uppercase tracking-wider">
                Movie
              </span>
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 bg-surface-dark/90 px-2.5 py-1 rounded text-amber-400 border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {movie.vote_average.toFixed(1)} / 10
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1 bg-surface-dark/80 px-2.5 py-1 rounded text-text-secondary border border-surface-border">
                  <Calendar className="w-3.5 h-3.5" />
                  {year}
                </span>
              )}
              {movie.runtime && movie.runtime > 0 && (
                <span className="flex items-center gap-1 bg-surface-dark/80 px-2.5 py-1 rounded text-text-secondary border border-surface-border">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.runtime} min
                </span>
              )}
              <span className="flex items-center gap-1 text-primary text-[11px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Ad-Free Player
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-sm font-medium text-accent italic">
                &quot;{movie.tagline}&quot;
              </p>
            )}

            {/* Genre Pills */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-surface-light border border-surface-border text-text-secondary"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Client-side Action Buttons: Play, Download, Watchlist */}
            <MovieDetailActions movie={movie} />

            {/* Overview / Synopsis */}
            <div className="pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Overview
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl">
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

        {/* 4. Similar / Recommended Titles */}
        {movie.similar && movie.similar.length > 0 && (
          <div className="mt-12">
            <MediaRow
              title="More Like This"
              items={movie.similar}
              icon={<Film className="w-6 h-6" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
