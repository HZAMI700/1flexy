'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ContentRow } from './ContentRow';
import { MediaItem } from '@/types';

export const NetflixDynamicRows: React.FC = () => {
  const { continueWatching, watchlist } = useAppStore();

  const continueItems: MediaItem[] = continueWatching.map((item) => ({
    id: item.id,
    title: item.title,
    poster_path: item.poster,
    backdrop_path: item.backdrop,
    media_type: item.mediaType,
    overview: item.episodeTitle || '',
    vote_average: 8.5,
    progressPercent: item.progressPercent,
    current_season: item.season,
    current_episode: item.episode,
  }));

  return (
    <>
      {/* Continue Watching for You */}
      {continueItems.length > 0 && (
        <ContentRow
          title="Continue Watching for You"
          items={continueItems}
          variant="landscape_with_progress"
        />
      )}

      {/* My List */}
      {watchlist.length > 0 && (
        <ContentRow
          title="My List"
          items={watchlist}
          variant="poster"
        />
      )}
    </>
  );
};
