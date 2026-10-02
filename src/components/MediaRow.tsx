'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  icon?: React.ReactNode;
  viewAllHref?: string;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  icon,
  viewAllHref,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -650 : 650;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-8 group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-primary">{icon}</div>}
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            {title}
          </h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs sm:text-sm font-semibold text-primary hover:text-accent-hover transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Row Container with Scroll Buttons */}
      <div className="relative">
        {/* Left Scroll Button */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll Left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface-dark/80 backdrop-blur-md border border-surface-border text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:bg-primary hover:scale-110 shadow-lg hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 py-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-none w-[160px] sm:w-[200px] md:w-[220px]"
            >
              <MediaCard media={item} />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll Right"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface-dark/80 backdrop-blur-md border border-surface-border text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:bg-primary hover:scale-110 shadow-lg hidden md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};
