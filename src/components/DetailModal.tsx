'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  Download,
  Volume2,
  VolumeX,
  Clock,
  Layers,
  Star,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Episode, Season } from '@/types';
import { getPosterWithFallback, generateSvgPlaceholder } from '@/lib/poster-resolver';

export const DetailModal: React.FC = () => {
  const {
    detailModal,
    closeDetailModal,
    openPlayer,
    openDownload,
    watchlist,
    toggleWatchlist,
    likedTitles,
    toggleLike,
  } = useAppStore();

  const { isOpen, media } = detailModal;
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailModal();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDetailModal]);

  if (!isOpen || !media) return null;

  const isSaved = watchlist.some((item) => item.id.toString() === media.id.toString());
  const isLiked = likedTitles.includes(media.id);

  const year = media.release_date || media.first_air_date
    ? new Date(media.release_date || media.first_air_date!).getFullYear()
    : 2024;

  const matchScore = Math.min(
    99,
    Math.max(86, Math.round((media.vote_average || 8.0) * 10 + 10))
  );

  const maturityRating = media.vote_average >= 8 ? 'TV-MA' : 'PG-13';

  const durationText =
    media.media_type === 'tv'
      ? `${media.number_of_seasons || 1} Season${(media.number_of_seasons || 1) > 1 ? 's' : ''}`
      : media.runtime
      ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m`
      : '2h 8m';

  // Seasons & Episodes
  const seasons: Season[] =
    media.seasons && media.seasons.length > 0
      ? media.seasons
      : Array.from({ length: media.number_of_seasons || 1 }, (_, i) => ({
          id: i + 1,
          season_number: i + 1,
          name: `Season ${i + 1}`,
          episode_count: 8,
        }));

  const currentSeason =
    seasons.find((s) => s.season_number === selectedSeasonNumber) || seasons[0];

  const episodes: Episode[] =
    currentSeason?.episodes && currentSeason.episodes.length > 0
      ? currentSeason.episodes
      : Array.from({ length: currentSeason?.episode_count || 8 }, (_, i) => ({
          id: i + 1,
          season_number: selectedSeasonNumber,
          episode_number: i + 1,
          name: `Episode ${i + 1}`,
          overview: `A thrilling chapter unfolds in Season ${selectedSeasonNumber} with unexpected turns and revelations.`,
          still_path: media.backdrop_path,
          runtime: 48,
        }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-14 px-2 sm:px-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={closeDetailModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative bg-[#181818] rounded-lg max-w-4xl w-full overflow-hidden shadow-2xl border border-[#282828] text-white my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hero Media Banner */}
        <div className="relative aspect-video w-full bg-black">
          {media.backdrop_path || media.poster_path ? (
            <Image
              src={media.backdrop_path || media.poster_path!}
              alt={media.title}
              fill
              priority
              className="object-cover"
            />
          ) : null}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          {/* Close Button */}
          <button
            onClick={closeDetailModal}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#181818]/80 hover:bg-[#181818] text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-16 right-6 z-20 w-9 h-9 rounded-full border border-white/60 bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Content Overlay at bottom of hero */}
          <div className="absolute bottom-6 left-6 right-6 z-20 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white font-display drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-xl">
              {media.title}
            </h2>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Play Button */}
              <button
                onClick={() => {
                  closeDetailModal();
                  openPlayer(media, 1, 1);
                }}
                className="flex items-center gap-2 px-7 py-2.5 rounded bg-white text-black font-bold text-sm sm:text-base hover:bg-white/80 transition-colors shadow-md"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
                Play
              </button>

              {/* Add to My List */}
              <button
                onClick={() => toggleWatchlist(media)}
                className="w-10 h-10 rounded-full border border-white/60 bg-[#2a2a2a]/60 hover:border-white text-white flex items-center justify-center transition-transform hover:scale-110"
                title={isSaved ? 'In My List' : 'Add to My List'}
              >
                {isSaved ? <Check className="w-5 h-5 text-[#46D369]" /> : <Plus className="w-5 h-5" />}
              </button>

              {/* Like / Thumbs Up */}
              <button
                onClick={() => toggleLike(media.id)}
                className={`w-10 h-10 rounded-full border bg-[#2a2a2a]/60 flex items-center justify-center transition-transform hover:scale-110 ${
                  isLiked ? 'border-[#46D369] text-[#46D369]' : 'border-white/60 text-white hover:border-white'
                }`}
                title="Rate title"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              {/* Download via Multi-Provider Fallback (FaselHD/EgyBest/etc.) */}
              <button
                onClick={() => {
                  closeDetailModal();
                  openDownload(media, 1, 1);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded border border-white/60 bg-[#2a2a2a]/60 hover:border-white text-white text-xs font-semibold transition-colors"
                title="Download full quality"
              >
                <Download className="w-4 h-4 text-[#E50914]" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Middle Details Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column (2 cols wide on desktop) */}
          <div className="md:col-span-2 space-y-4">
            {/* Metadata Line */}
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="text-[#46D369] font-bold">{matchScore}% Match</span>
              <span className="text-[#B3B3B3]">{year}</span>
              <span className="px-1.5 py-0.2 rounded border border-[#808080] text-xs text-white">
                {maturityRating}
              </span>
              <span className="text-[#B3B3B3]">{durationText}</span>
              <span className="px-1.5 py-0.2 rounded border border-[#808080] text-[10px] font-bold uppercase text-white">
                Ultra HD 4K
              </span>
            </div>

            {/* Synopsis */}
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              {media.overview}
            </p>
          </div>

          {/* Right Column (Cast, Genres, Tags) */}
          <div className="space-y-3 text-xs text-[#B3B3B3]">
            {media.cast && media.cast.length > 0 && (
              <div>
                <span className="text-[#808080]">Cast: </span>
                <span className="text-white">
                  {media.cast.slice(0, 4).map((c) => c.name).join(', ')}
                </span>
              </div>
            )}
            <div>
              <span className="text-[#808080]">Genres: </span>
              <span className="text-white">
                {media.genres && media.genres.length > 0
                  ? media.genres.map((g) => g.name).join(', ')
                  : 'Action, Sci-Fi, Adventure'}
              </span>
            </div>
            <div>
              <span className="text-[#808080]">This show is: </span>
              <span className="text-white">
                Suspenseful, Gritty, Mind-bending, Action-packed
              </span>
            </div>
          </div>
        </div>

        {/* Episodes Section (If TV Show) */}
        {media.media_type === 'tv' && (
          <div className="px-6 sm:px-8 py-6 border-t border-[#282828] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                Episodes
              </h3>
              {/* Season Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#808080]">Season:</span>
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                  className="bg-[#242424] border border-[#383838] text-white text-xs font-bold rounded px-3 py-1.5 focus:outline-none focus:border-white cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      {s.name || `Season ${s.season_number}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Episode List */}
            <div className="divide-y divide-[#282828]">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => {
                    closeDetailModal();
                    openPlayer(media, selectedSeasonNumber, ep.episode_number);
                  }}
                  className="py-4 flex items-center justify-between gap-4 hover:bg-[#202020] px-3 rounded transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <span className="text-lg font-bold text-[#808080] w-6 text-center">
                      {ep.episode_number}
                    </span>
                    <div className="relative w-28 sm:w-36 aspect-video rounded overflow-hidden bg-black flex-shrink-0">
                      {ep.still_path ? (
                        <Image
                          src={ep.still_path}
                          alt={ep.name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <div className="w-8 h-8 rounded-full border border-white bg-black/60 flex items-center justify-center text-white">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Titles ("More Like This") */}
        {media.similar && media.similar.length > 0 && (
          <div className="px-6 sm:px-8 py-6 border-t border-[#282828] space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-white font-display">
              More Like This
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.similar.slice(0, 6).map((sim) => {
                const simImg = getPosterWithFallback(sim);
                return (
                  <div
                    key={sim.id}
                    onClick={() => openPlayer(sim, 1, 1)}
                    className="bg-[#242424] rounded overflow-hidden group cursor-pointer hover:bg-[#2e2e2e] transition-colors flex flex-col"
                  >
                    <div className="relative aspect-video w-full bg-black">
                      <Image
                        src={simImg}
                        alt={sim.title}
                        fill
                        className="object-cover"
                        unoptimized={simImg.startsWith('data:')}
                      />
                    </div>
                    <div className="p-3 space-y-1.5 flex flex-col justify-between flex-grow">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#46D369] font-bold">96% Match</span>
                        <span className="px-1 border border-[#808080] text-[10px] text-white">
                          HD
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-white line-clamp-1">
                        {sim.title}
                      </h5>
                      <p className="text-xs text-[#B3B3B3] line-clamp-2 leading-snug">
                        {sim.overview}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="px-6 sm:px-8 py-6 border-t border-[#282828] space-y-3 text-xs text-[#B3B3B3]">
          <h3 className="text-base font-bold text-white mb-2">
            About {media.title}
          </h3>
          <div>
            <span className="text-[#808080]">Genres: </span>
            <span className="text-white">
              {media.genres?.map((g) => g.name).join(', ') || 'Action, Thriller'}
            </span>
          </div>
          <div>
            <span className="text-[#808080]">Maturity Rating: </span>
            <span className="text-white font-semibold">{maturityRating}</span>
            <span className="text-[#808080]"> — Recommended for mature audiences.</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
