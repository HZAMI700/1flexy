'use client';

import React from 'react';
import Image from 'next/image';
import { Play, X, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const ContinueWatchingRow: React.FC = () => {
  const { continueWatching, removeProgress, openPlayer } = useAppStore();

  if (!continueWatching || continueWatching.length === 0) return null;

  return (
    <section className="my-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
          Continue Watching
        </h2>
      </div>

      <div
        className="flex gap-4 overflow-x-auto scrollbar-none py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {continueWatching.map((item) => (
          <div
            key={item.id}
            className="flex-none w-[240px] sm:w-[280px] bg-surface rounded-xl overflow-hidden border border-surface-border group relative flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
          >
            {/* Backdrop / Poster Container */}
            <div className="relative aspect-video w-full bg-surface-dark overflow-hidden">
              {item.backdrop || item.poster ? (
                <Image
                  src={item.backdrop || item.poster!}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
                  No preview
                </div>
              )}

              {/* Hover Resume Play Button */}
              <div className="absolute inset-0 bg-background/40 group-hover:bg-background/60 flex items-center justify-center transition-colors">
                <button
                  onClick={() =>
                    openPlayer(
                      {
                        id: item.id,
                        title: item.title,
                        poster_path: item.poster,
                        backdrop_path: item.backdrop,
                        media_type: item.mediaType,
                        overview: '',
                        vote_average: 8.0,
                      },
                      item.season || 1,
                      item.episode || 1
                    )
                  }
                  className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-glow transform group-hover:scale-110 transition-transform"
                  title="Resume"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>

              {/* Remove progress button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeProgress(item.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-text-muted hover:text-white transition-colors"
                title="Remove from history"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-dark">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(item.progressPercent || 25, 100)}%` }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="font-bold text-sm text-white truncate" title={item.title}>
                {item.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                <span>
                  {item.mediaType === 'tv'
                    ? `S${item.season} • E${item.episode}`
                    : 'Movie'}
                </span>
                <span className="text-primary font-semibold">
                  {item.progressPercent}% complete
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
