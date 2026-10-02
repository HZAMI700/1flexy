'use client';

import React, { useState } from 'react';
import { Play, Download, Bookmark, BookmarkCheck, Share2, Check } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface MovieDetailActionsProps {
  movie: MediaItem;
}

export const MovieDetailActions: React.FC<MovieDetailActionsProps> = ({ movie }) => {
  const { openPlayer, openDownload, watchlist, toggleWatchlist } = useAppStore();
  const [copied, setCopied] = useState(false);

  const isSaved = watchlist.some((item) => item.id.toString() === movie.id.toString());

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-4">
      {/* Play Button */}
      <button
        onClick={() => openPlayer(movie, 1, 1)}
        className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary hover:bg-accent-hover text-white font-bold text-sm shadow-glow hover:scale-105 transition-all duration-200"
      >
        <Play className="w-5 h-5 fill-current ml-0.5" />
        Watch Movie Now
      </button>

      {/* Download Button (Fasel HD) */}
      <button
        onClick={() => openDownload(movie)}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-light border border-surface-border text-white font-semibold text-sm transition-all duration-200 hover:border-primary/50"
      >
        <Download className="w-4 h-4 text-primary" />
        Download (Fasel HD)
      </button>

      {/* Watchlist Toggle */}
      <button
        onClick={() => toggleWatchlist(movie)}
        className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
          isSaved
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-surface hover:bg-surface-light border-surface-border text-text-secondary hover:text-white'
        }`}
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="w-4 h-4" /> Saved
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" /> Watchlist
          </>
        )}
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="p-3.5 rounded-xl bg-surface hover:bg-surface-light border border-surface-border text-text-secondary hover:text-white transition-all"
        title="Share Movie"
      >
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
