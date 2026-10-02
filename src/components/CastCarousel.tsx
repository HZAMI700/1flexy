'use client';

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { CastMember } from '@/types';

interface CastCarouselProps {
  cast: CastMember[];
}

export const CastCarousel: React.FC<CastCarouselProps> = ({ cast }) => {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="my-8">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 font-display">
        Top Billed Cast
      </h3>
      <div
        className="flex gap-4 overflow-x-auto scrollbar-none py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cast.map((member) => (
          <div
            key={member.id}
            className="flex-none w-[110px] sm:w-[130px] flex flex-col items-center text-center group"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#181818] border-2 border-[#282828] group-hover:border-[#E50914] transition-all duration-300 shadow-md">
              {member.profile_path ? (
                <Image
                  src={member.profile_path}
                  alt={member.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#141414] text-[#808080]">
                  <User className="w-8 h-8 opacity-40" />
                </div>
              )}
            </div>
            <span className="font-semibold text-xs text-white mt-2 line-clamp-1 group-hover:text-[#E50914] transition-colors">
              {member.name}
            </span>
            <span className="text-[11px] text-[#808080] line-clamp-1">
              {member.character}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
