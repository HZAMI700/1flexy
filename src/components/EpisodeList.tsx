'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Download, Clock, Star } from 'lucide-react';
import { MediaItem, Season, Episode } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface EpisodeListProps {
  media: MediaItem;
  seasons?: Season[];
  initialSeason?: number;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  media,
  seasons = [],
  initialSeason = 1,
}) => {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(initialSeason);
  const { openPlayer, openDownload } = useAppStore();

  const totalSeasons =
    seasons.length > 0
      ? seasons
      : Array.from({ length: media.number_of_seasons || 1 }, (_, i) => ({
          id: i + 1,
          season_number: i + 1,
          name: `Season ${i + 1}`,
          episode_count: 10,
        }));

  const currentSeason =
    seasons.find((s) => s.season_number === selectedSeasonNumber) ||
    seasons[0];

  const episodes: Episode[] =
    currentSeason?.episodes && currentSeason.episodes.length > 0
      ? currentSeason.episodes
      : Array.from({ length: currentSeason?.episode_count || 8 }, (_, i) => ({
          id: i + 1,
          season_number: selectedSeasonNumber,
          episode_number: i + 1,
          name: `Episode ${i + 1}`,
          overview: `Official episode ${i + 1} of Season ${selectedSeasonNumber} with thrilling plot progressions.`,
          still_path: media.backdrop_path,
          runtime: 45,
        }));

  return (
    <div className="my-8">
      {/* Header & Season Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-surface-border gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-display">Episodes</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Select an episode to stream with VidFast or download via Fasel HD
          </p>
        </div>

        {/* Season Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium">Season:</span>
          <select
            value={selectedSeasonNumber}
            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
            className="bg-surface hover:bg-surface-light border border-surface-border text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-primary cursor-pointer transition-colors"
          >
            {totalSeasons.map((s) => (
              <option key={s.season_number} value={s.season_number}>
                {s.name || `Season ${s.season_number}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Episode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {episodes.map((ep) => (
          <div
            key={ep.id}
            className="bg-surface hover:bg-surface-light border border-surface-border rounded-xl p-3 flex gap-3 transition-all duration-200 group relative hover:border-primary/50"
          >
            {/* Episode Still / Thumbnail */}
            <div className="relative w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-surface-dark flex-shrink-0">
              {ep.still_path ? (
                <Image
                  src={ep.still_path}
                  alt={ep.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
                  No preview
                </div>
              )}

              {/* Hover Play Icon Overlay */}
              <button
                onClick={() => openPlayer(media, selectedSeasonNumber, ep.episode_number)}
                aria-label={`Play ${ep.name}`}
                className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-glow">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>

              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-surface-dark/90 text-[10px] font-mono font-bold text-white">
                EP {ep.episode_number}
              </span>
            </div>

            {/* Episode Details */}
            <div className="flex flex-col justify-between flex-grow min-w-0">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4
                    onClick={() => openPlayer(media, selectedSeasonNumber, ep.episode_number)}
                    className="font-bold text-sm text-white group-hover:text-primary transition-colors cursor-pointer truncate"
                    title={ep.name}
                  >
                    {ep.episode_number}. {ep.name}
                  </h4>
                </div>
                <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
                  {ep.overview}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary pt-2 mt-auto">
                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Clock className="w-3 h-3" />
                  {ep.runtime ? `${ep.runtime}m` : '45m'}
                </span>

                <div className="flex items-center gap-2">
                  {/* Download Episode */}
                  <button
                    onClick={() =>
                      openDownload(media, selectedSeasonNumber, ep.episode_number)
                    }
                    className="p-1 rounded text-text-muted hover:text-primary transition-colors"
                    title="Download episode with Fasel HD"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Play Episode */}
                  <button
                    onClick={() =>
                      openPlayer(media, selectedSeasonNumber, ep.episode_number)
                    }
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-accent-hover transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
