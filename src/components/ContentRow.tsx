'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types';
import { ContentCard, CardVariant } from './ContentCard';

interface ContentRowProps {
  id?: string;
  title: string;
  items: MediaItem[];
  variant?: CardVariant;
  showRank?: boolean;
}

export const ContentRow: React.FC<ContentRowProps> = ({
  title,
  items,
  variant = 'poster',
  showRank = false,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.85;

    const targetScroll =
      direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

    rowRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  const handleScrollCheck = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  return (
    <section className="relative my-6 sm:my-8 group/row">
      {/* Row Title */}
      <h2 className="text-[clamp(18px,1.5vw,24px)] font-bold text-[#E5E5E5] px-[4%] mb-3 font-display">
        {title}
      </h2>

      {/* Row Container */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            aria-label="Previous titles"
            className="absolute left-0 top-0 bottom-0 z-40 w-[4%] bg-[rgba(20,20,20,0.6)] hover:bg-[rgba(20,20,20,0.9)] text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Horizontal Scrolling Track */}
        <div
          ref={rowRef}
          onScroll={handleScrollCheck}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none px-[4%] py-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => {
            const cardVariant = showRank
              ? 'poster_with_rank'
              : variant;

            const cardWidth =
              variant === 'landscape' || variant === 'landscape_with_progress'
                ? 'w-[240px] sm:w-[280px] md:w-[320px]'
                : showRank
                ? 'w-[170px] sm:w-[210px] md:w-[240px]'
                : 'w-[140px] sm:w-[180px] md:w-[200px]';

            return (
              <div
                key={`${item.id}-${index}`}
                className={`flex-none ${cardWidth}`}
              >
                <ContentCard
                  media={item}
                  variant={cardVariant}
                  rank={showRank ? index + 1 : undefined}
                  isNew={index < 2 && title.toLowerCase().includes('new')}
                />
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            aria-label="Next titles"
            className="absolute right-0 top-0 bottom-0 z-40 w-[4%] bg-[rgba(20,20,20,0.6)] hover:bg-[rgba(20,20,20,0.9)] text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </section>
  );
};
