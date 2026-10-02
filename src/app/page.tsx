import React from 'react';
import { HeroBillboard } from '@/components/HeroBillboard';
import { ContentRow } from '@/components/ContentRow';
import { NetflixDynamicRows } from '@/components/NetflixDynamicRows';
import { tmdbApi } from '@/lib/tmdb';

export const revalidate = 3600;

export default async function HomePage() {
  const [
    trending,
    popularMovies,
    topRatedMovies,
    popularTV,
    topRatedTV,
    actionMovies,
    comedyMovies,
  ] = await Promise.all([
    tmdbApi.getTrending(),
    tmdbApi.getPopularMovies(),
    tmdbApi.getTopRatedMovies(),
    tmdbApi.getPopularTV(),
    tmdbApi.getTopRatedTV(),
    tmdbApi.getByGenre(28, 'movie'),
    tmdbApi.getByGenre(35, 'movie'),
  ]);

  const heroItems = trending.slice(0, 5);
  const top10Items = [...trending.slice(0, 5), ...popularMovies.slice(0, 5)].slice(0, 10);
  const newReleases = [...popularMovies.slice(0, 8)];
  const netflixOriginals = [...popularTV, ...topRatedTV].slice(0, 10);
  const becauseYouWatched = [...topRatedMovies.slice(0, 8)];

  return (
    <div className="min-h-screen bg-black pb-12 overflow-x-hidden">
      {/* 1. Hero Billboard Carousel */}
      <HeroBillboard items={heroItems} />

      {/* Main Content Rows Container */}
      <div className="-mt-16 sm:-mt-24 relative z-20 space-y-2">
        {/* Dynamic Client Rows: Continue Watching & My List */}
        <NetflixDynamicRows />

        {/* 2. Trending Now Row */}
        <ContentRow
          title="Trending Now"
          items={trending}
          variant="poster"
        />

        {/* 3. Top 10 in Your Country Today Row (With Outlined SVG Rank Numbers) */}
        <ContentRow
          title="Top 10 in Your Country Today"
          items={top10Items}
          variant="poster"
          showRank={true}
        />

        {/* 4. New Releases Row (with NEW badge) */}
        <ContentRow
          title="New Releases"
          items={newReleases}
          variant="new_badge"
        />

        {/* 5. Netflix Originals */}
        <ContentRow
          title="Netflix Originals & Series"
          items={netflixOriginals}
          variant="poster"
        />

        {/* 6. Because you watched Deadpool & Wolverine */}
        <ContentRow
          title="Because you watched Deadpool & Wolverine"
          items={becauseYouWatched}
          variant="landscape"
        />

        {/* 7. Action & Adventure */}
        <ContentRow
          title="Action & Adventure"
          items={actionMovies}
          variant="poster"
        />

        {/* 8. Comedies */}
        <ContentRow
          title="Comedies"
          items={comedyMovies}
          variant="poster"
        />

        {/* 9. Acclaimed TV Dramas */}
        <ContentRow
          title="Acclaimed TV Dramas"
          items={topRatedTV}
          variant="landscape"
        />
      </div>
    </div>
  );
}
