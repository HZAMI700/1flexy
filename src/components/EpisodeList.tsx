'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Download } from 'lucide-react';
import { MediaItem, Season, Episode } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { generateSvgPlaceholder } from '@/lib/poster-resolver';

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
          episode_count: 8,
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
          overview: `A dramatic turn of events unfolds in Season ${selectedSeasonNumber} with intense suspense.`,
          still_path: media.backdrop_path,
          runtime: 48,
        }));

  return (
    <div className="my-8">
      {/* Header & Season Selector */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#282828]">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
            Episodes
          </h3>
        </div>

        {/* Season Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#808080]">Season:</span>
          <select
            value={selectedSeasonNumber}
            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
            className="bg-[#242424] border border-[#383838] text-white text-xs font-bold rounded px-3 py-1.5 focus:outline-none focus:border-white cursor-pointer transition-colors"
          >
            {totalSeasons.map((s) => (
              <option key={s.season_number} value={s.season_number}>
                {s.name || `Season ${s.season_number}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Episode Rows List */}
      <div className="divide-y divide-[#282828]">
        {episodes.map((ep) => {
          const thumbSrc =
            ep.still_path || media.backdrop_path || media.poster_path || generateSvgPlaceholder(ep.name);

          return (
            <motion.div
              key={ep.id}
              whileHover={{ scale: 1.01, backgroundColor: '#1f1f1f' }}
              transition={{ duration: 0.2 }}
              onClick={() => openPlayer(media, selectedSeasonNumber, ep.episode_number)}
              className="py-5 px-3 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-grow min-w-0 w-full sm:w-auto">
                {/* Episode Number */}
                <span className="text-xl font-bold text-[#808080] w-6 text-center flex-shrink-0">
                  {ep.episode_number}
                </span>

                {/* Thumbnail */}
                <div className="relative w-32 sm:w-40 aspect-video rounded overflow-hidden bg-black flex-shrink-0">
                  <Image
                    src={thumbSrc}
                    alt={ep.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={thumbSrc.startsWith('data:')}
                  />

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                    <div className="w-8 h-8 rounded-full border border-white bg-black/60 flex items-center justify-center text-white shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

              {/* Details */}
              <div className="min-w-0 flex-grow">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-white group-hover:text-[#E50914] transition-colors truncate">
                    {ep.name}
                  </h4>
                  <span className="text-xs text-[#808080] font-mono flex-shrink-0">
                    {ep.runtime || 48}m
                  </span>
                </div>
                <p className="text-xs text-[#B3B3B3] line-clamp-2 mt-1">
                  {ep.overview}
                </p>
              </div>
            </div>

            {/* Download Episode Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDownload(media, selectedSeasonNumber, ep.episode_number);
              }}
              className="p-2 rounded hover:bg-[#282828] text-[#808080] hover:text-[#E50914] transition-colors self-end sm:self-center"
              title="Download Episode"
            >
              <Download className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}
    </div>
    </div>
  );
};
