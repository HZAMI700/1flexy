import React from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { MediaRow } from '@/components/MediaRow';
import { MediaCard } from '@/components/MediaCard';
import { GenrePills } from '@/components/GenrePills';
import { ContinueWatchingRow } from '@/components/ContinueWatchingRow';
import { tmdbApi } from '@/lib/tmdb';
import { Flame, Film, Tv, Sparkles, Trophy } from 'lucide-react';

export const revalidate = 3600; // revalidate at most once every hour

export default async function HomePage() {
  // Fetch content in parallel
  const [trending, popularMovies, topRatedMovies, popularTV, topRatedTV] =
    await Promise.all([
      tmdbApi.getTrending(),
      tmdbApi.getPopularMovies(),
      tmdbApi.getTopRatedMovies(),
      tmdbApi.getPopularTV(),
      tmdbApi.getTopRatedTV(),
    ]);

  const heroItems = trending.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* 1. Hero Banner Carousel */}
      <HeroBanner items={heroItems} />

      {/* 2. Genre Filter Pills */}
      <div className="max-w-7xl mx-auto">
        <GenrePills />
      </div>

      {/* 3. Continue Watching Row (Client side LocalStorage progress) */}
      <div className="max-w-7xl mx-auto">
        <ContinueWatchingRow />
      </div>

      {/* 4. Trending Section Horizontal Row */}
      <div className="max-w-7xl mx-auto">
        <MediaRow
          title="Trending This Week"
          items={trending}
          icon={<Flame className="w-6 h-6" />}
          viewAllHref="/search?sort=trending"
        />
      </div>

      {/* 5. Popular Movies Grid (Responsive 2 cols mobile -> 6 cols desktop) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Film className="w-6 h-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              Popular Movies
            </h2>
          </div>
          <a
            href="/search?type=movie"
            className="text-xs sm:text-sm font-semibold text-primary hover:text-accent-hover transition-colors"
          >
            Explore All Movies →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularMovies.slice(0, 12).map((movie, index) => (
            <MediaCard key={movie.id} media={movie} priority={index < 6} />
          ))}
        </div>
      </section>

      {/* 6. TV Shows Categorized Rows */}
      <div className="max-w-7xl mx-auto">
        <MediaRow
          title="Popular TV Series"
          items={popularTV}
          icon={<Tv className="w-6 h-6" />}
          viewAllHref="/search?type=tv"
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <MediaRow
          title="Top Rated Blockbusters"
          items={topRatedMovies}
          icon={<Trophy className="w-6 h-6" />}
          viewAllHref="/search?sort=top_rated"
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <MediaRow
          title="Acclaimed Series"
          items={topRatedTV}
          icon={<Sparkles className="w-6 h-6" />}
          viewAllHref="/search?type=tv&sort=top_rated"
        />
      </div>
    </div>
  );
}
