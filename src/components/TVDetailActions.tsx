'use client';

import React, { useState } from 'react';
import { Play, Download, Plus, Check, ThumbsUp, Share2 } from 'lucide-react';
import { MediaItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface TVDetailActionsProps {
  show: MediaItem;
}

export const TVDetailActions: React.FC<TVDetailActionsProps> = ({ show }) => {
  const {
    openPlayer,
    openDownload,
    watchlist,
    toggleWatchlist,
    likedTitles,
    toggleLike,
  } = useAppStore();
  const [copied, setCopied] = useState(false);

  const isSaved = watchlist.some((item) => item.id.toString() === show.id.toString());
  const isLiked = likedTitles.includes(show.id);

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
        onClick={() => openPlayer(show, 1, 1)}
        className="flex items-center gap-2.5 px-8 py-3 rounded bg-white text-black font-bold text-base hover:bg-white/80 transition-colors shadow-lg"
      >
        <Play className="w-5 h-5 fill-current ml-0.5" />
        Play (S1 : E1)
      </button>

      {/* Download Button */}
      <button
        onClick={() => openDownload(show, 1, 1)}
        className="flex items-center gap-2 px-6 py-3 rounded bg-[rgba(109,109,110,0.7)] hover:bg-[rgba(109,109,110,0.4)] text-white font-bold text-base transition-colors"
      >
        <Download className="w-4 h-4 text-[#E50914]" />
        Download Episodes
      </button>

      {/* My List Circle */}
      <button
        onClick={() => toggleWatchlist(show)}
        className="w-11 h-11 rounded-full border border-white/70 bg-[#2a2a2a]/60 hover:border-white text-white flex items-center justify-center transition-transform hover:scale-110"
        title={isSaved ? 'In My List' : 'Add to My List'}
      >
        {isSaved ? <Check className="w-5 h-5 text-[#46D369]" /> : <Plus className="w-5 h-5" />}
      </button>

      {/* Thumbs Up / Like */}
      <button
        onClick={() => toggleLike(show.id)}
        className={`w-11 h-11 rounded-full border bg-[#2a2a2a]/60 flex items-center justify-center transition-transform hover:scale-110 ${
          isLiked ? 'border-[#46D369] text-[#46D369]' : 'border-white/70 text-white hover:border-white'
        }`}
        title="I like this"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-11 h-11 rounded-full border border-white/70 bg-[#2a2a2a]/60 hover:border-white text-white flex items-center justify-center transition-transform hover:scale-110"
        title="Share"
      >
        {copied ? <Check className="w-5 h-5 text-[#46D369]" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
