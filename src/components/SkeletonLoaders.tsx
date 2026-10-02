import React from 'react';

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[750px] bg-surface-dark animate-pulse flex flex-col justify-end p-8">
      <div className="max-w-xl space-y-4">
        <div className="h-6 w-32 bg-surface rounded" />
        <div className="h-12 w-3/4 bg-surface rounded" />
        <div className="h-4 w-full bg-surface rounded" />
        <div className="h-4 w-2/3 bg-surface rounded" />
        <div className="flex gap-4 pt-4">
          <div className="h-12 w-32 bg-surface rounded-xl" />
          <div className="h-12 w-32 bg-surface rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const MediaCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl overflow-hidden bg-surface border border-surface-border/40 animate-pulse flex flex-col">
      <div className="aspect-[2/3] w-full bg-surface-light" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-surface-light rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-3 bg-surface-light rounded w-1/4" />
          <div className="h-3 bg-surface-light rounded w-1/4" />
        </div>
      </div>
    </div>
  );
};

export const MediaRowSkeleton: React.FC = () => {
  return (
    <div className="my-8 px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="h-6 w-48 bg-surface rounded animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const MediaGridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="w-full h-[60vh] bg-surface-dark" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 flex flex-col md:flex-row gap-8">
        <div className="w-56 h-80 bg-surface rounded-2xl flex-shrink-0" />
        <div className="flex-grow space-y-4 pt-12">
          <div className="h-8 w-1/2 bg-surface rounded" />
          <div className="h-4 w-1/4 bg-surface rounded" />
          <div className="h-20 w-full bg-surface rounded" />
          <div className="flex gap-4">
            <div className="h-12 w-36 bg-surface rounded-xl" />
            <div className="h-12 w-36 bg-surface rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
