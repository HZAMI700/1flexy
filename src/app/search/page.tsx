'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { ContentCard } from '@/components/ContentCard';
import { tmdbApi } from '@/lib/tmdb';
import { MediaItem } from '@/types';

function NetflixSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';

  const [query, setQuery] = useState(initialQuery);
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
        } else if (initialType === 'movie') {
          items = await tmdbApi.getPopularMovies();
        } else if (initialType === 'tv') {
          items = await tmdbApi.getPopularTV();
        } else {
          const trending = await tmdbApi.getTrending();
          const movies = await tmdbApi.getPopularMovies();
          items = [...trending, ...movies];
        }

        if (isMounted) {
          setResults(items);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const handler = setTimeout(performSearch, 200);
    return () => {
      isMounted = false;
      clearTimeout(handler);
    };
  }, [query, initialType]);

  return (
    <div className="min-h-screen bg-black px-[4%] pt-28 pb-16">
      {/* Search Bar Input */}
      <div className="max-w-2xl mb-8">
        <div className="relative flex items-center bg-black/80 border border-white px-3.5 py-2.5 rounded shadow-lg">
          <Search className="w-5 h-5 text-white mr-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, actors, genres..."
            className="w-full bg-transparent text-white placeholder-[#808080] text-sm sm:text-base focus:outline-none font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#808080] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-4 text-xs text-[#808080]">
        {loading ? (
          'Searching Netflix library...'
        ) : query ? (
          <span>
            Results for &quot;<span className="text-white font-semibold">{query}</span>&quot; ({results.length})
          </span>
        ) : (
          <span>Explore Popular & Trending Titles</span>
        )}
      </div>

      {/* Results Grid or Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#808080]">
          <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          <p className="text-sm font-semibold">Loading titles...</p>
        </div>
      ) : query.trim() && results.length === 0 ? (
        <div className="py-16 max-w-lg text-[#808080] space-y-4">
          <p className="text-sm text-white">
            Your search for &quot;<span className="text-[#E50914] font-bold">{query}</span>&quot; did not have any matches.
          </p>
          <div className="text-xs space-y-2 leading-relaxed">
            <p className="font-semibold text-[#B3B3B3]">Suggestions:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Try different keywords</li>
              <li>Looking for a movie or TV show?</li>
              <li>Try using a movie, TV show title, an actor or director</li>
              <li>Try a genre, like comedies, drama, action, sci-fi</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {results.map((item) => (
            <ContentCard key={item.id} media={item} variant="poster" />
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
        <div className="min-h-screen bg-black px-[4%] pt-28">
          <div className="h-10 w-64 bg-[#141414] rounded mb-8 animate-pulse" />
        </div>
      }
    >
      <NetflixSearchContent />
    </Suspense>
  );
}
