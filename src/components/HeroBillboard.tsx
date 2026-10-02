'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface HeroBillboardProps {
  items: MediaItem[];
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    openPlayer,
    openDetailModal,
    isHeroMuted,
    toggleHeroMuted,
  } = useAppStore();

  const currentItem = items[currentIndex] || items[0];

  useEffect(() => {
    if (items.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length]);

  if (!currentItem) return null;

  const year = currentItem.release_date || currentItem.first_air_date
    ? new Date(currentItem.release_date || currentItem.first_air_date!).getFullYear()
    : 2024;

  const matchScore = Math.min(
    99,
    Math.max(85, Math.round((currentItem.vote_average || 8.0) * 10 + 12))
  );

  const durationText =
    currentItem.media_type === 'tv'
      ? `${currentItem.number_of_seasons || 1} Seasons`
      : currentItem.runtime
      ? `${Math.floor(currentItem.runtime / 60)}h ${currentItem.runtime % 60}m`
      : '2h 8m';

  const maturityRating = currentItem.vote_average >= 8 ? 'TV-MA' : 'PG-13';

  return (
    <div className="relative w-full h-[85vh] min-h-[500px] max-h-[920px] overflow-hidden select-none bg-black">
      {/* High-Resolution Backdrop Image */}
      <div className="absolute inset-0">
        {currentItem.backdrop_path ? (
          <Image
            src={currentItem.backdrop_path}
            alt={currentItem.title}
            fill
            priority
            className="object-cover object-center transition-opacity duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-[#141414]" />
        )}

        {/* Netflix Exact Gradient Overlays */}
        {/* Left-to-right gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(77deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 45%, transparent 85%)',
          }}
        />
        {/* Bottom-up gradient fading into surface #141414 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, transparent 50%, rgba(20,20,20,0.6) 80%, #141414 100%)',
          }}
        />
      </div>

      {/* Hero Content Positioned Bottom-Left */}
      <div className="relative z-10 max-w-[1920px] mx-auto h-full px-[4%] pb-[8%] flex flex-col justify-end">
        <div className="max-w-[45%] md:max-w-[55%] lg:max-w-[42%] space-y-4">
          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] font-display drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {currentItem.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-sm font-semibold text-white">
            <span className="text-[#46D369] font-bold tracking-tight">
              {matchScore}% Match
            </span>
            <span className="text-[#B3B3B3]">{year}</span>
            <span className="px-1.5 py-0.2 rounded border border-[#808080] text-[11px] font-bold text-white bg-black/40">
              {maturityRating}
            </span>
            <span className="text-[#B3B3B3]">{durationText}</span>
            <span className="px-1.5 py-0.2 rounded border border-[#808080] text-[10px] font-black text-white uppercase tracking-wider bg-black/40">
              HD
            </span>
          </div>

          {/* Synopsis (3-line clamp) */}
          <p className="text-sm sm:text-base text-white line-clamp-3 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {currentItem.overview}
          </p>

          {/* Action Buttons: Play & More Info */}
          <div className="flex items-center gap-3 pt-2">
            {/* Play Button (White with black text) */}
            <button
              onClick={() => openPlayer(currentItem, 1, 1)}
              className="flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded bg-white text-black font-bold text-sm sm:text-base hover:bg-white/75 transition-colors duration-200 shadow-md"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
              Play
            </button>

            {/* More Info Button (Gray translucent) */}
            <button
              onClick={() => openDetailModal(currentItem)}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded bg-[rgba(109,109,110,0.7)] hover:bg-[rgba(109,109,110,0.4)] text-white font-bold text-sm sm:text-base transition-colors duration-200 backdrop-blur-sm"
            >
              <Info className="w-5 h-5" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Right-Side Badges: Maturity Rating & Mute Button */}
      <div className="absolute right-0 bottom-[8%] z-20 flex items-center gap-3 pr-[4%]">
        {/* Sound Toggle Button */}
        <button
          onClick={toggleHeroMuted}
          aria-label={isHeroMuted ? 'Unmute' : 'Mute'}
          className="w-10 h-10 rounded-full border border-white/60 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
        >
          {isHeroMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        {/* Maturity Rating Pill */}
        <div className="border-l-[3px] border-[#dcdcdc] bg-[rgba(51,51,51,0.6)] px-3 py-1 text-xs font-bold text-white tracking-wider backdrop-blur-sm">
          {maturityRating}
        </div>
      </div>
    </div>
  );
};
