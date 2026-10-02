import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { tmdbApi } from '@/lib/tmdb';
import { EpisodePlayerView } from '@/components/EpisodePlayerView';
import { EpisodeList } from '@/components/EpisodeList';
import { ChevronLeft, ArrowLeft, Tv, ShieldCheck } from 'lucide-react';

interface Props {
  params: {
    id: string;
    season: string;
    episode: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await tmdbApi.getTVDetails(params.id);
  if (!show) {
    return { title: 'Episode Not Found - VidFast' };
  }
  return {
    title: `${show.title} Season ${params.season} Episode ${params.episode} - Stream Online | VidFast`,
    description: `Watch ${show.title} S${params.season}E${params.episode} online in 1080p / 4K with VidFast zero-ad player.`,
  };
}

export default async function EpisodePage({ params }: Props) {
  const show = await tmdbApi.getTVDetails(params.id);
  if (!show) {
    notFound();
  }

  const seasonNum = parseInt(params.season, 10) || 1;
  const episodeNum = parseInt(params.episode, 10) || 1;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Breadcrumb Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href={`/tv/${show.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-surface border border-surface-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {show.title}
        </Link>
      </div>

      {/* Interactive Episode Player View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EpisodePlayerView
          media={show}
          season={seasonNum}
          episode={episodeNum}
        />
      </div>

      {/* Episode Selection Drawer / Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <EpisodeList
          media={show}
          seasons={show.seasons}
          initialSeason={seasonNum}
        />
      </div>
    </div>
  );
}
