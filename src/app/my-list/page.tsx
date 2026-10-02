'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { ContentCard } from '@/components/ContentCard';

export default function MyListPage() {
  const { watchlist } = useAppStore();

  return (
    <div className="min-h-screen bg-black px-[4%] pt-28 pb-16">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          My List
        </h1>
        <p className="text-xs text-[#808080] mt-1">
          {watchlist.length} {watchlist.length === 1 ? 'Title' : 'Titles'} saved to your personal library
        </p>
      </div>

      {/* Grid or Empty State */}
      {watchlist.length === 0 ? (
        <div className="py-24 text-center space-y-4 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-white">Your List is Empty</h2>
          <p className="text-sm text-[#808080] leading-relaxed">
            Add movies and shows to your list and they will appear here so you can easily watch them anytime.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-white text-black font-bold text-sm rounded hover:bg-white/80 transition-colors"
            >
              Find Something to Watch
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {watchlist.map((item) => (
            <ContentCard key={item.id} media={item} variant="poster" />
          ))}
        </div>
      )}
    </div>
  );
}
