'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, Film, Tv, Star, Play, Loader2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { tmdbApi } from '@/lib/tmdb';
import { MediaItem } from '@/types';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, openPlayer } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const data = await tmdbApi.searchMulti(query);
        setResults(data.slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [query]);

  if (!isSearchOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    } else if (e.key === 'Enter' && query.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="bg-surface border border-surface-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-surface-border gap-3">
          <Search className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, TV shows, anime, franchises..."
            className="w-full bg-transparent text-white placeholder-text-muted focus:outline-none text-base font-medium"
          />
          {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-1 rounded-md text-xs bg-surface-dark border border-surface-border text-text-muted hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Dropdown Suggestions / Live Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-surface-border/40">
          {query.trim() && results.length === 0 && !loading && (
            <div className="py-12 text-center text-text-muted text-sm">
              No titles found for &quot;<span className="text-white">{query}</span>&quot;. Try another title.
            </div>
          )}

          {!query.trim() && (
            <div className="p-4 space-y-3">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Deadpool & Wolverine',
                  'Dune: Part Two',
                  'Arcane',
                  'The Last of Us',
                  'Oppenheimer',
                  'Interstellar',
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-xs text-text-secondary hover:text-white border border-surface-border transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((item) => {
            const year = item.release_date || item.first_air_date
              ? new Date(item.release_date || item.first_air_date!).getFullYear()
              : null;
            const detailUrl =
              item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-light transition-colors group"
              >
                <Link
                  href={detailUrl}
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-3 flex-grow min-w-0"
                >
                  <div className="relative w-11 h-16 rounded-md overflow-hidden bg-surface-dark flex-shrink-0 border border-surface-border">
                    {item.poster_path ? (
                      <Image
                        src={item.poster_path}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span className="capitalize">{item.media_type}</span>
                      {year && <span>• {year}</span>}
                      {item.vote_average > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          {item.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Quick Play Trigger */}
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    openPlayer(item, 1, 1);
                  }}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors ml-2"
                  title="Play"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* View All Results Footer Link */}
        {query.trim() && results.length > 0 && (
          <div className="p-3 border-t border-surface-border bg-surface-dark flex justify-center">
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsSearchOpen(false)}
              className="text-xs font-semibold text-primary hover:text-accent-hover flex items-center gap-1"
            >
              See all results for &quot;{query}&quot;
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
