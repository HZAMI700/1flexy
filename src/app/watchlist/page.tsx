'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Film, Tv, Heart, Trash2, ArrowRight } from 'lucide-react';
import { MediaCard } from '@/components/MediaCard';
import { useAppStore } from '@/store/useAppStore';

export default function WatchlistPage() {
  const { watchlist, favorites } = useAppStore();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'favorites'>('watchlist');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  const items = activeTab === 'watchlist' ? watchlist : favorites;

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.media_type === filterType;
  });

  return (
    <div className="min-h-screen bg-background max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-black text-white font-display">
          My Saved Media Library
        </h1>
        <p className="text-sm text-text-muted">
          Your personalized watchlist and favorites stored securely in your browser
        </p>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-surface-border">
        {/* Main Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-primary text-white shadow-glow'
                : 'bg-surface text-text-secondary hover:text-white border border-surface-border'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Watchlist ({watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'favorites'
                ? 'bg-primary text-white shadow-glow'
                : 'bg-surface text-text-secondary hover:text-white border border-surface-border'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Favorites ({favorites.length})
          </button>
        </div>

        {/* Media Type Sub-Filter */}
        <div className="flex items-center gap-1.5 bg-surface-dark border border-surface-border p-1 rounded-lg">
          {(['all', 'movie', 'tv'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                filterType === t
                  ? 'bg-surface-light text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Series'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Empty State */}
      <div className="mt-8">
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center mx-auto text-text-muted">
              {activeTab === 'watchlist' ? (
                <Bookmark className="w-8 h-8 opacity-40" />
              ) : (
                <Heart className="w-8 h-8 opacity-40" />
              )}
            </div>
            <h3 className="text-xl font-bold text-white font-display">
              Your {activeTab} is empty
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Save movies and TV shows as you browse so you can easily return and watch them anytime.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-accent-hover text-white text-xs font-bold shadow-glow transition-all"
            >
              Browse Trending Content
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
