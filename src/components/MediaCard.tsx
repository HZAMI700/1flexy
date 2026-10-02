'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Play, Bookmark, BookmarkCheck, Plus } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface MediaCardProps {
  media: MediaItem;
  priority?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, priority = false }) => {
  const { openPlayer, watchlist, toggleWatchlist } = useAppStore();

  const isSaved = watchlist.some((item) => item.id.toString() === media.id.toString());
  const year = media.release_date || media.first_air_date
    ? new Date(media.release_date || media.first_air_date!).getFullYear()
    : null;

  const detailUrl = media.media_type === 'movie' ? `/movie/${media.id}` : `/tv/${media.id}`;

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openPlayer(media, 1, 1);
  };

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  return (
    <div className="group relative rounded-xl overflow-hidden bg-surface border border-surface-border/60 transition-all duration-300 hover:scale-[1.04] hover:shadow-glow hover:border-primary/50 flex flex-col">
      {/* Poster Container */}
      <Link href={detailUrl} className="relative aspect-[2/3] w-full overflow-hidden block">
        {media.poster_path ? (
          <Image
            src={media.poster_path}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-dark text-text-muted">
            No Poster
          </div>
        )}

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
          {/* Quick Play Button */}
          <button
            onClick={handleQuickPlay}
            aria-label="Play Now"
            className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-glow transform scale-75 group-hover:scale-100 transition-transform duration-300 hover:bg-accent-hover"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {media.vote_average > 0 && (
            <span className="flex items-center gap-1 bg-surface-dark/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-400 border border-amber-400/20">
              <Star className="w-3 h-3 fill-current" />
              {media.vote_average.toFixed(1)}
            </span>
          )}
          <span className="bg-primary/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black uppercase text-white tracking-wider">
            {media.media_type === 'movie' ? 'Movie' : 'TV'}
          </span>
        </div>

        {/* Quality Badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-surface-dark/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide text-text-secondary border border-surface-border">
            4K UHD
          </span>
        </div>

        {/* Bookmark Action */}
        <button
          onClick={handleToggleWatchlist}
          title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          className={`absolute bottom-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all duration-200 ${
            isSaved
              ? 'bg-primary text-white shadow-glow'
              : 'bg-surface-dark/80 text-text-muted hover:text-white hover:bg-surface-light opacity-0 group-hover:opacity-100'
          }`}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </Link>

      {/* Card Metadata */}
      <div className="p-3 flex flex-col justify-between flex-grow">
        <Link href={detailUrl} className="block group-hover:text-primary transition-colors">
          <h3 className="font-semibold text-sm text-white line-clamp-1 leading-snug" title={media.title}>
            {media.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-xs text-text-muted mt-1.5">
          <span>{year || '2024'}</span>
          <span className="capitalize text-[11px] text-text-secondary">
            {media.genres?.[0]?.name || (media.media_type === 'movie' ? 'Cinema' : 'Series')}
          </span>
        </div>
      </div>
    </div>
  );
};
