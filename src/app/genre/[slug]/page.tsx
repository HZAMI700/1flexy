import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { GenrePills } from '@/components/GenrePills';
import { MediaCard } from '@/components/MediaCard';
import { tmdbApi } from '@/lib/tmdb';
import { GENRES } from '@/lib/mockData';
import { Layers } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const genre = GENRES.find((g) => g.slug === params.slug.toLowerCase());
  if (!genre) {
    return { title: 'Genre Not Found - VidFast' };
  }
  return {
    title: `Best ${genre.name} Movies & TV Shows - Watch Online | VidFast`,
    description: `Discover and stream top-rated ${genre.name} movies and television series with zero pop-up ads on VidFast.`,
  };
}

export default async function GenrePage({ params }: Props) {
  const genre = GENRES.find((g) => g.slug === params.slug.toLowerCase());

  if (!genre) {
    notFound();
  }

  // Fetch movies and TV shows for this genre in parallel
  const [movies, tvShows] = await Promise.all([
    tmdbApi.getByGenre(genre.id, 'movie'),
    tmdbApi.getByGenre(genre.id, 'tv'),
  ]);

  const allItems = [...movies, ...tvShows];

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-surface-dark via-surface to-background border-b border-surface-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Genre Category</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
              {genre.name} Movies & TV Shows
            </h1>
            <p className="text-xs sm:text-sm text-text-muted max-w-xl">
              Browse top trending, high-definition {genre.name.toLowerCase()} releases. Stream instantly in 4K or download with high-speed Fasel HD servers.
            </p>
          </div>
          <div className="text-xs text-text-secondary bg-surface-dark border border-surface-border px-4 py-2.5 rounded-xl self-start md:self-auto font-mono">
            {allItems.length} Available Titles
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="max-w-7xl mx-auto">
        <GenrePills activeSlug={genre.slug} />
      </div>

      {/* Media Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allItems.map((item, idx) => (
            <MediaCard key={`${item.id}-${idx}`} media={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
