'use client';

import React from 'react';
import Link from 'next/link';
import { GENRES } from '@/lib/mockData';

interface GenrePillsProps {
  activeSlug?: string;
}

export const GenrePills: React.FC<GenrePillsProps> = ({ activeSlug }) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 min-w-max">
        <Link
          href="/"
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
            !activeSlug
              ? 'bg-primary text-white border-primary shadow-glow'
              : 'bg-surface/80 hover:bg-surface-light text-text-secondary hover:text-white border-surface-border'
          }`}
        >
          All Genres
        </Link>
        {GENRES.map((genre) => {
          const isActive = activeSlug === genre.slug;
          return (
            <Link
              key={genre.id}
              href={`/genre/${genre.slug}`}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-glow'
                  : 'bg-surface/80 hover:bg-surface-light text-text-secondary hover:text-white border-surface-border'
              }`}
            >
              {genre.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
