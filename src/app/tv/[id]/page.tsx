import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { CastCarousel } from '@/components/CastCarousel';
import { EpisodeList } from '@/components/EpisodeList';
import { MediaRow } from '@/components/MediaRow';
import { TVDetailActions } from '@/components/TVDetailActions';
import { Star, Calendar, ShieldCheck, Tv, Layers } from 'lucide-react';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await tmdbApi.getTVDetails(params.id);
  if (!show) {
    return { title: 'TV Show Not Found - VidFast' };
  }
  return {
    title: `${show.title} - Watch TV Series Online & Download | VidFast`,
    description: show.overview,
    openGraph: {
      title: `${show.title} - Stream on VidFast`,
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
    : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 1. Full-width Cinematic Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[420px] max-h-[620px]">
        {show.backdrop_path ? (
          <Image
            src={show.backdrop_path}
            alt={show.title}
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

      {/* 2. Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 sm:-mt-56 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Thumbnail */}
          <div className="relative w-48 sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-surface-border flex-shrink-0 bg-surface">
            {show.poster_path ? (
              <Image
                src={show.poster_path}
                alt={show.title}
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
                TV Series
              </span>
              {show.vote_average > 0 && (
                <span className="flex items-center gap-1 bg-surface-dark/90 px-2.5 py-1 rounded text-amber-400 border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {show.vote_average.toFixed(1)} / 10
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1 bg-surface-dark/80 px-2.5 py-1 rounded text-text-secondary border border-surface-border">
                  <Calendar className="w-3.5 h-3.5" />
                  {year}
                </span>
              )}
              {show.number_of_seasons && (
                <span className="flex items-center gap-1 bg-surface-dark/80 px-2.5 py-1 rounded text-text-secondary border border-surface-border">
                  <Layers className="w-3.5 h-3.5" />
                  {show.number_of_seasons} Seasons
                </span>
              )}
              <span className="flex items-center gap-1 text-primary text-[11px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Pop-under Shield Active
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
              {show.title}
            </h1>

            {/* Tagline */}
            {show.tagline && (
              <p className="text-sm font-medium text-accent italic">
                &quot;{show.tagline}&quot;
              </p>
            )}

            {/* Genre Pills */}
            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-surface-light border border-surface-border text-text-secondary"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <TVDetailActions show={show} />

            {/* Overview */}
            <div className="pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Storyline
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl">
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
            <MediaRow
              title="Recommended Series"
              items={show.similar}
              icon={<Tv className="w-6 h-6" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
