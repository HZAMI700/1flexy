'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Check, ThumbsUp, ChevronDown, X } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getPosterWithFallback, generateSvgPlaceholder } from '@/lib/poster-resolver';

export type CardVariant =
  | 'poster'
  | 'landscape'
  | 'landscape_with_progress'
  | 'new_badge';

interface ContentCardProps {
  media: MediaItem;
  variant?: CardVariant;
  progressPercent?: number;
  isNew?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  media,
  variant = 'poster',
  progressPercent = 25,
  isNew = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fix-003: Poster Fallback State
  const initialImage = getPosterWithFallback(media);
  const [imgSrc, setImgSrc] = useState<string>(initialImage);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getPosterWithFallback(media));
    setHasError(false);
  }, [media]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      if (media.backdrop_path && imgSrc !== media.backdrop_path) {
        setImgSrc(media.backdrop_path);
      } else {
        setImgSrc(generateSvgPlaceholder(media.title, media.media_type));
      }
    }
  };

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
    }, 280);
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

  return (
    <motion.div
      className="relative select-none cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => openDetailModal(media)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Main Base Card */}
      <div
        className={`relative overflow-hidden rounded bg-[#141414] transition-shadow duration-300 shadow-md hover:shadow-2xl ${
          isLandscape ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      >
        <Image
          src={imgSrc}
          alt={media.title || 'Movie Title'}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover rounded transition-transform duration-300"
          onError={handleImageError}
          priority={false}
          unoptimized={imgSrc.startsWith('data:')}
        />

        {/* New Badge */}
        {(isNew || variant === 'new_badge') && (
          <div className="absolute top-2 right-2 bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow z-10">
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

      {/* Netflix Hover Expanded Card (Fix-004 Animated Scale & Reveal) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1.15, y: -15 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-[-20%] left-[-15%] w-[130%] z-50 bg-[#181818] rounded-md shadow-2xl overflow-hidden border border-[#282828]"
            style={{ transformOrigin: 'center center' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Expanded Preview Header */}
            <div className="relative aspect-video w-full bg-black">
              <Image
                src={media.backdrop_path || imgSrc}
                alt={media.title}
                fill
                className="object-cover"
                onError={handleImageError}
                unoptimized={imgSrc.startsWith('data:')}
              />
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
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => openPlayer(media, 1, 1)}
                    className="w-8 h-8 rounded-full bg-white text-black hover:bg-white/90 flex items-center justify-center transition-colors shadow-lg"
                    title="Play"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </motion.button>

                  {/* Add to My List */}
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleWatchlist(media)}
                    className="w-8 h-8 rounded-full border border-white/70 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-colors"
                    title={isSaved ? 'Remove from My List' : 'Add to My List'}
                  >
                    {isSaved ? <Check className="w-4 h-4 text-[#46D369]" /> : <Plus className="w-4 h-4" />}
                  </motion.button>

                  {/* Thumbs Up / Like */}
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleLike(media.id)}
                    className={`w-8 h-8 rounded-full border bg-[#2a2a2a]/80 flex items-center justify-center transition-colors ${
                      isLiked ? 'border-[#46D369] text-[#46D369]' : 'border-white/70 hover:border-white text-white'
                    }`}
                    title="I like this"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                {/* Expand Details Trigger */}
                <motion.button
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => openDetailModal(media)}
                  className="w-8 h-8 rounded-full border border-white/70 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-colors"
                  title="More info"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
