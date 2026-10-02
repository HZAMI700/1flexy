import React from 'react';
import { HeroBillboard } from '@/components/HeroBillboard';
import { ContentRow } from '@/components/ContentRow';
import { NetflixDynamicRows } from '@/components/NetflixDynamicRows';
import { tmdbApi } from '@/lib/tmdb';
import { vidApi } from '@/services/vidapi';

export const revalidate = 21600; // 6 hours cache per VidAPI sync strategy

export default async function HomePage() {
  // Fetch from VidAPI & TMDB in parallel with resilient fallbacks
  const [
    vidMovies,
    vidTvShows,
    vidEpisodes,
    stats,
    tmdbTrending,
    tmdbPopularMovies,
    tmdbTopRated,
    actionGenre,
    comedyGenre,
  ] = await Promise.all([
    vidApi.getLatestMovies(1),
    vidApi.getLatestTvShows(1),
    vidApi.getLatestEpisodes(1),
    vidApi.getStats(),
    tmdbApi.getTrending().catch(() => []),
    tmdbApi.getPopularMovies().catch(() => []),
    tmdbApi.getTopRatedMovies().catch(() => []),
    tmdbApi.getByGenre(28, 'movie').catch(() => []),
    tmdbApi.getByGenre(35, 'movie').catch(() => []),
  ]);

  // Combine & enrich content rows
  const heroItems = tmdbTrending.length > 0 ? tmdbTrending.slice(0, 5) : vidMovies.slice(0, 5);
  const trending = tmdbTrending.length > 0 ? tmdbTrending : vidMovies;

  // 1. New Releases (from VidAPI movies page 1)
  const newReleases = vidMovies.length > 0 ? vidMovies : tmdbPopularMovies.slice(0, 10);

  // 2. New TV Shows (from VidAPI TV shows page 1)
  const newTvShows = vidTvShows.length > 0 ? vidTvShows : [];

  // 3. Recently Added Episodes (from VidAPI episodes page 1)
  const latestEpisodes = vidEpisodes.length > 0 ? vidEpisodes : [];

  // 4. Top Rated Movies (sorted by rating)
  const topRatedMovies =
    vidMovies.length > 0
      ? [...vidMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      : tmdbTopRated;

  // 5. Action & Adventure
  const actionAdventure =
    actionGenre.length > 0
      ? actionGenre
      : vidMovies.filter((m) =>
          m.genres?.some((g) => g.name.toLowerCase().includes('action'))
        );

  // 6. Because you watched (recommendations / popular)
  const becauseYouWatched = tmdbTopRated.length > 0 ? tmdbTopRated.slice(0, 10) : vidMovies.slice(5, 15);

  return (
    <div className="min-h-screen bg-black pb-16 overflow-x-hidden">
      {/* 1. Hero Billboard Carousel */}
      <HeroBillboard items={heroItems} />

      {/* Main Content Rows Container */}
      <div className="-mt-16 sm:-mt-24 relative z-20 space-y-2">
        {/* Dynamic Client Rows: Continue Watching & My List (driven by VaPlayer events) */}
        <NetflixDynamicRows />

        {/* 2. Trending Now Row */}
        <ContentRow
          title="Trending Now"
          items={trending}
          variant="poster"
        />

        {/* 3. New Releases Row (VidAPI Movies with NEW badge) */}
        <ContentRow
          title="New Releases"
          items={newReleases}
          variant="new_badge"
        />

        {/* 4. New TV Shows (VidAPI TV Catalog) */}
        {newTvShows.length > 0 && (
          <ContentRow
            title="New TV Shows & Series"
            items={newTvShows}
            variant="poster"
          />
        )}

        {/* 5. Recently Added Episodes (VidAPI Episodes in Landscape) */}
        {latestEpisodes.length > 0 && (
          <ContentRow
            title="Recently Added Episodes"
            items={latestEpisodes}
            variant="landscape"
          />
        )}

        {/* 6. Because you watched */}
        <ContentRow
          title="Because you watched Fast X"
          items={becauseYouWatched}
          variant="landscape"
        />

        {/* 7. Top Rated Movies */}
        <ContentRow
          title="Top Rated Movies"
          items={topRatedMovies}
          variant="poster"
        />

        {/* 8. Action & Adventure */}
        {actionAdventure.length > 0 && (
          <ContentRow
            title="Action & Adventure"
            items={actionAdventure}
            variant="poster"
          />
        )}

        {/* 9. Comedies */}
        {comedyGenre.length > 0 && (
          <ContentRow
            title="Comedies & Lighthearted"
            items={comedyGenre}
            variant="poster"
          />
        )}
      </div>

      {/* Library Catalog Stats Footer Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 pt-8 border-t border-[#222222] text-center text-xs text-[#808080]">
        <p className="font-mono">
          Powered by VaPlayer &amp; VidAPI &bull; {stats.movies.toLocaleString()} Movies &bull; {stats.tv_shows.toLocaleString()} TV Shows &bull; {stats.episodes.toLocaleString()} Episodes available
        </p>
      </div>
    </div>
  );
}
