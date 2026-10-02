'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';
import { useAppStore, DEFAULT_PROFILES, UserProfile } from '@/store/useAppStore';

const AVATAR_COLORS = [
  '#E50914',
  '#0080ff',
  '#e5a00d',
  '#2bb872',
  '#9933cc',
];

export default function ProfilesPage() {
  const router = useRouter();
  const { activeProfile, setActiveProfile } = useAppStore();
  const [profiles, setProfiles] = useState<UserProfile[]>([
    ...DEFAULT_PROFILES,
    {
      id: 'user-3',
      name: 'Family',
      avatar: '',
    },
  ]);
  const [isManaging, setIsManaging] = useState(false);

  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 py-16 select-none animate-fadeIn">
      <div className="max-w-4xl w-full text-center space-y-8 sm:space-y-12">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-wide font-display">
          {isManaging ? 'Manage Profiles' : "Who's watching?"}
        </h1>

        {/* Profile Avatars Grid */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {profiles.map((profile, idx) => {
            const isSelected = activeProfile.id === profile.id;
            const bgColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

            return (
              <div
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                {/* Avatar Box */}
                <div
                  className={`w-24 h-24 sm:w-36 sm:h-36 rounded-md flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-lg transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-white ring-2 ring-white/50'
                      : 'border-transparent group-hover:border-white'
                  }`}
                  style={{ backgroundColor: bgColor }}
                >
                  {profile.name.charAt(0)}
                </div>

                {/* Profile Name */}
                <span className="mt-3 text-sm sm:text-base font-semibold text-[#808080] group-hover:text-white transition-colors">
                  {profile.name}
                </span>

                {profile.isKids && (
                  <span className="text-[10px] font-bold text-[#E50914] uppercase tracking-wider -mt-0.5">
                    Kids Safe
                  </span>
                )}
              </div>
            );
          })}

          {/* Add Profile Box */}
          <div className="group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105">
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-md border-2 border-[#808080] group-hover:border-white flex items-center justify-center text-[#808080] group-hover:text-white transition-colors bg-[#1f1f1f]">
              <Plus className="w-12 h-12" />
            </div>
            <span className="mt-3 text-sm sm:text-base font-semibold text-[#808080] group-hover:text-white transition-colors">
              Add Profile
            </span>
          </div>
        </div>

        {/* Manage Profiles CTA */}
        <div className="pt-4">
          <button
            onClick={() => setIsManaging(!isManaging)}
            className="px-8 py-2 border border-[#808080] hover:border-white text-[#808080] hover:text-white text-sm sm:text-base font-semibold tracking-wider uppercase transition-colors"
          >
            {isManaging ? 'Done' : 'Manage Profiles'}
          </button>
        </div>
      </div>
    </div>
  );
}
