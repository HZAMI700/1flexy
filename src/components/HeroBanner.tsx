'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Info, Star, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface HeroBannerProps {
  items: MediaItem[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { openPlayer, watchlist, toggleWatchlist } = useAppStore();

  const currentItem = items[currentIndex] || items[0];

  useEffect(() => {
    if (isPaused || items.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, items.length]);

  if (!currentItem) return null;

  const isSaved = watchlist.some((item) => item.id.toString() === currentItem.id.toString());
  const year = currentItem.release_date || currentItem.first_air_date
    ? new Date(currentItem.release_date || currentItem.first_air_date!).getFullYear()
    : null;
  const detailUrl =
    currentItem.media_type === 'movie' ? `/movie/${currentItem.id}` : `/tv/${currentItem.id}`;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div
      className="relative w-full h-[75vh] min-h-[550px] max-h-[850px] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        {currentItem.backdrop_path ? (
          <Image
            src={currentItem.backdrop_path}
            alt={currentItem.title}
            fill
            priority
            className="object-cover object-center transform scale-105 transition-all duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-surface-dark" />
        )}
        {/* Radial & Linear Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-2xl space-y-4">
          {/* Metadata Badges */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded bg-primary text-white font-black tracking-wider uppercase">
              {currentItem.media_type === 'movie' ? 'Movie' : 'Series'}
            </span>
            {currentItem.vote_average > 0 && (
              <span className="flex items-center gap-1 bg-surface-dark/80 backdrop-blur-md px-2 py-1 rounded text-amber-400 border border-amber-400/20">
                <Star className="w-3.5 h-3.5 fill-current" />
                {currentItem.vote_average.toFixed(1)} TMDB
              </span>
            )}
            {year && <span className="text-text-secondary">{year}</span>}
            <span className="px-2 py-0.5 rounded border border-surface-border text-text-muted text-[11px] font-bold">
              4K ULTRA HD
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-tight line-clamp-2">
            {currentItem.title}
          </h1>

          {/* Tagline or Genres */}
          {currentItem.tagline && (
            <p className="text-sm font-medium text-accent italic">
              &quot;{currentItem.tagline}&quot;
            </p>
          )}

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-text-secondary line-clamp-3 leading-relaxed max-w-xl">
            {currentItem.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Play Button */}
            <button
              onClick={() => openPlayer(currentItem, 1, 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-accent-hover text-white font-bold text-sm shadow-glow hover:scale-105 transition-all duration-200"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
              Play Now
            </button>

            {/* More Info Button */}
            <Link
              href={detailUrl}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface/80 hover:bg-surface-light border border-surface-border text-white font-semibold text-sm backdrop-blur-md transition-all duration-200 hover:border-primary/50"
            >
              <Info className="w-4 h-4 text-primary" />
              More Details
            </Link>

            {/* Watchlist Toggle */}
            <button
              onClick={() => toggleWatchlist(currentItem)}
              aria-label="Add to Watchlist"
              className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-200 ${
                isSaved
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface/60 border-surface-border text-text-muted hover:text-white hover:bg-surface'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Arrows */}
      <div className="absolute right-6 bottom-14 z-20 hidden sm:flex items-center gap-2">
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="p-2.5 rounded-full bg-surface-dark/70 hover:bg-primary border border-surface-border text-white backdrop-blur-md transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="p-2.5 rounded-full bg-surface-dark/70 hover:bg-primary border border-surface-border text-white backdrop-blur-md transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-primary shadow-glow' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
