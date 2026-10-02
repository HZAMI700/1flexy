'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Play, Plus, Check, ThumbsUp, ChevronDown, X } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Top10RankSVG } from './Top10RankSVG';

export type CardVariant =
  | 'poster'
  | 'landscape'
  | 'poster_with_rank'
  | 'landscape_with_progress'
  | 'new_badge';

interface ContentCardProps {
  media: MediaItem;
  variant?: CardVariant;
  rank?: number;
  progressPercent?: number;
  isNew?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  media,
  variant = 'poster',
  rank,
  progressPercent = 25,
  isNew = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    openPlayer,
    openDetailModal,
    watchlist,
    toggleWatchlist,
    likedTitles,
    toggleLike,
    removeProgress,
  } = useAppStore();

  const isSaved = watchlist.some((item) => item.id.toString() === media.id.toString());
  const isLiked = likedTitles.includes(media.id);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  const matchScore = Math.min(
    99,
    Math.max(86, Math.round((media.vote_average || 8.0) * 10 + 10))
  );

  const durationText =
    media.media_type === 'tv'
      ? `${media.number_of_seasons || 1} Season${(media.number_of_seasons || 1) > 1 ? 's' : ''}`
      : media.runtime
      ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m`
      : '1h 55m';

  const maturityRating = media.vote_average >= 8 ? 'TV-MA' : 'PG-13';

  const isLandscape =
    variant === 'landscape' || variant === 'landscape_with_progress';

  const imageSrc = isLandscape
    ? media.backdrop_path || media.poster_path
    : media.poster_path || media.backdrop_path;

  return (
    <div
      className={`relative group rounded select-none cursor-pointer ${
        variant === 'poster_with_rank' ? 'pl-6' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => openDetailModal(media)}
    >
      {/* Top 10 Rank SVG */}
      {variant === 'poster_with_rank' && rank && <Top10RankSVG rank={rank} />}

      {/* Main Base Card */}
      <div
        className={`relative overflow-hidden rounded bg-[#141414] transition-all duration-300 ${
          isLandscape ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover rounded transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#808080]">
            No Preview
          </div>
        )}

        {/* New Badge */}
        {(isNew || variant === 'new_badge') && (
          <div className="absolute top-2 right-2 bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">
            NEW
          </div>
        )}

        {/* Continue Watching Progress Bar & Remove Button */}
        {variant === 'landscape_with_progress' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeProgress(media.id);
              }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Remove from row"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#282828]">
              <div
                className="h-full bg-[#E50914]"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Netflix Hover Expanded Card (300ms Delay) */}
      {isHovered && (
        <div
          className="absolute top-[-30%] left-[-15%] w-[130%] z-50 bg-[#181818] rounded-md shadow-netflix overflow-hidden border border-[#282828] animate-fadeIn"
          style={{ transformOrigin: 'center center' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Expanded Preview Header */}
          <div className="relative aspect-video w-full bg-black">
            {media.backdrop_path || media.poster_path ? (
              <Image
                src={media.backdrop_path || media.poster_path!}
                alt={media.title}
                fill
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
            <h4 className="absolute bottom-2 left-3 right-3 text-white font-bold text-sm truncate drop-shadow">
              {media.title}
            </h4>
          </div>

          {/* Action Buttons Row */}
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play Button */}
                <button
                  onClick={() => openPlayer(media, 1, 1)}
                  className="w-8 h-8 rounded-full bg-white text-black hover:bg-white/80 flex items-center justify-center transition-transform hover:scale-110"
                  title="Play"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>

                {/* Add to My List */}
                <button
                  onClick={() => toggleWatchlist(media)}
                  className="w-8 h-8 rounded-full border border-white/70 hover:border-white bg-[#2a2a2a]/60 text-white flex items-center justify-center transition-transform hover:scale-110"
                  title={isSaved ? 'Remove from My List' : 'Add to My List'}
                >
                  {isSaved ? <Check className="w-4 h-4 text-[#46D369]" /> : <Plus className="w-4 h-4" />}
                </button>

                {/* Thumbs Up / Like */}
                <button
                  onClick={() => toggleLike(media.id)}
                  className={`w-8 h-8 rounded-full border bg-[#2a2a2a]/60 flex items-center justify-center transition-transform hover:scale-110 ${
                    isLiked ? 'border-[#46D369] text-[#46D369]' : 'border-white/70 hover:border-white text-white'
                  }`}
                  title="I like this"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expand Details Trigger */}
              <button
                onClick={() => openDetailModal(media)}
                className="w-8 h-8 rounded-full border border-white/70 hover:border-white bg-[#2a2a2a]/60 text-white flex items-center justify-center transition-transform hover:scale-110"
                title="More info"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Line */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-[#46D369] font-bold">{matchScore}% Match</span>
              <span className="px-1 py-0.2 rounded border border-[#808080] text-[10px] text-white">
                {maturityRating}
              </span>
              <span className="text-[#B3B3B3] text-[11px]">{durationText}</span>
              <span className="px-1 py-0.2 rounded border border-[#808080] text-[9px] font-bold text-white uppercase">
                HD
              </span>
            </div>

            {/* Dot-separated genres */}
            <div className="text-[11px] text-[#B3B3B3] line-clamp-1">
              {media.genres && media.genres.length > 0
                ? media.genres.map((g) => g.name).join(' • ')
                : media.media_type === 'movie'
                ? 'Action • Suspenseful • Exciting'
                : 'Drama • Sci-Fi • Television'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
