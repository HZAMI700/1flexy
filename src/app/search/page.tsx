'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Film, Tv, Flame, Star, Filter, Loader2 } from 'lucide-react';
import { MediaCard } from '@/components/MediaCard';
import { MediaGridSkeleton } from '@/components/SkeletonLoaders';
import { tmdbApi } from '@/lib/tmdb';
import { MediaItem } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialSort = searchParams.get('sort') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const performSearch = async () => {
      try {
        let items: MediaItem[] = [];

        if (query.trim()) {
          items = await tmdbApi.searchMulti(query.trim());
        } else if (sortBy === 'trending') {
          items = await tmdbApi.getTrending();
        } else if (sortBy === 'top_rated') {
          const movies = await tmdbApi.getTopRatedMovies();
          const tvs = await tmdbApi.getTopRatedTV();
          items = [...movies, ...tvs].sort((a, b) => b.vote_average - a.vote_average);
        } else if (selectedType === 'movie') {
          items = await tmdbApi.getPopularMovies();
        } else if (selectedType === 'tv') {
          items = await tmdbApi.getPopularTV();
        } else {
          // Default popular mix
          const movies = await tmdbApi.getPopularMovies();
          const tvs = await tmdbApi.getPopularTV();
          items = [...movies, ...tvs];
        }

        // Filter by type if not all
        if (selectedType !== 'all') {
          items = items.filter((item) => item.media_type === selectedType);
        }

        // Apply sorting
        if (sortBy === 'rating') {
          items = [...items].sort((a, b) => b.vote_average - a.vote_average);
        } else if (sortBy === 'year') {
          items = [...items].sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || '1970').getTime();
            const dateB = new Date(b.release_date || b.first_air_date || '1970').getTime();
            return dateB - dateA;
          });
        }

        if (isMounted) {
          setResults(items);
        }
      } catch (err) {
        console.error('Failed to search:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const handler = setTimeout(performSearch, 200);
    return () => {
      isMounted = false;
      clearTimeout(handler);
    };
  }, [query, selectedType, sortBy]);

  return (
    <div className="min-h-screen bg-background max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-black text-white font-display">
          Search & Browse Media
        </h1>
        <p className="text-sm text-text-muted">
          Instant search across millions of movies, TV shows, and series
        </p>

        {/* Input Bar */}
        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a title, actor, or genre..."
            className="w-full bg-surface border border-surface-border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-text-muted focus:outline-none focus:border-primary text-sm shadow-md"
          />
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-surface-border">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Titles' },
            { id: 'movie', label: 'Movies Only' },
            { id: 'tv', label: 'TV Shows Only' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === type.id
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-surface text-text-secondary hover:text-white border border-surface-border'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface border border-surface-border text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Popularity</option>
            <option value="trending">Trending Now</option>
            <option value="top_rated">Highest Rated</option>
            <option value="year">Newest Release</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between py-4">
        <span className="text-xs text-text-muted">
          {loading ? (
            'Searching catalog...'
          ) : (
            `Showing ${results.length} ${results.length === 1 ? 'title' : 'titles'}`
          )}
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm">Fetching titles...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center mx-auto text-text-muted">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">No titles found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            We couldn&apos;t find any media matching &quot;{query}&quot;. Try checking for typos or searching by keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background max-w-7xl mx-auto px-4 py-8">
          <div className="h-10 w-48 bg-surface rounded mb-8 animate-pulse" />
          <MediaGridSkeleton count={12} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
