import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MediaItem, WatchProgress } from '@/types';
import { AdBlockStats } from '@/lib/adblocker';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids?: boolean;
}

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Member',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-2',
    name: 'Kids',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    isKids: true,
  },
];

interface PlayerModalState {
  isOpen: boolean;
  media: MediaItem | null;
  season: number;
  episode: number;
  server: string;
}

interface DownloadModalState {
  isOpen: boolean;
  media: MediaItem | null;
  season?: number;
  episode?: number;
}

interface DetailModalState {
  isOpen: boolean;
  media: MediaItem | null;
}

interface AppState {
  // My List / Watchlist
  watchlist: MediaItem[];
  favorites: MediaItem[];
  toggleWatchlist: (media: MediaItem) => void;
  isWatchlist: (id: string | number) => boolean;
  toggleFavorite: (media: MediaItem) => void;
  isFavorite: (id: string | number) => boolean;

  // Thumbs up / down feedback
  likedTitles: (string | number)[];
  toggleLike: (id: string | number) => void;
  isLiked: (id: string | number) => boolean;

  // Continue Watching
  continueWatching: WatchProgress[];
  saveProgress: (progress: WatchProgress) => void;
  removeProgress: (id: string | number) => void;

  // Netflix Title Detail Modal (FLIP animation)
  detailModal: DetailModalState;
  openDetailModal: (media: MediaItem) => void;
  closeDetailModal: () => void;

  // Player Modal
  playerModal: PlayerModalState;
  openPlayer: (media: MediaItem, season?: number, episode?: number, server?: string) => void;
  closePlayer: () => void;
  setPlayerServer: (server: string) => void;

  // Download Modal
  downloadModal: DownloadModalState;
  openDownload: (media: MediaItem, season?: number, episode?: number) => void;
  closeDownload: () => void;

  // Profiles
  activeProfile: UserProfile;
  setActiveProfile: (profile: UserProfile) => void;

  // Audio / Sound
  isHeroMuted: boolean;
  toggleHeroMuted: () => void;

  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // AdBlock Shield Stats
  adBlockStats: AdBlockStats;
  setAdBlockStats: (stats: AdBlockStats) => void;
  toggleAdBlock: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      favorites: [],

      toggleWatchlist: (media: MediaItem) => {
        const { watchlist } = get();
        const exists = watchlist.some((item) => item.id.toString() === media.id.toString());
        if (exists) {
          set({
            watchlist: watchlist.filter((item) => item.id.toString() !== media.id.toString()),
          });
        } else {
          set({ watchlist: [media, ...watchlist] });
        }
      },

      isWatchlist: (id: string | number) => {
        return get().watchlist.some((item) => item.id.toString() === id.toString());
      },

      toggleFavorite: (media: MediaItem) => {
        const { favorites } = get();
        const exists = favorites.some((item) => item.id.toString() === media.id.toString());
        if (exists) {
          set({
            favorites: favorites.filter((item) => item.id.toString() !== media.id.toString()),
          });
        } else {
          set({ favorites: [media, ...favorites] });
        }
      },

      isFavorite: (id: string | number) => {
        return get().favorites.some((item) => item.id.toString() === id.toString());
      },

      likedTitles: [],
      toggleLike: (id: string | number) => {
        const { likedTitles } = get();
        const exists = likedTitles.includes(id);
        if (exists) {
          set({ likedTitles: likedTitles.filter((item) => item !== id) });
        } else {
          set({ likedTitles: [...likedTitles, id] });
        }
      },
      isLiked: (id: string | number) => {
        return get().likedTitles.includes(id);
      },

      continueWatching: [],

      saveProgress: (progress: WatchProgress) => {
        const { continueWatching } = get();
        const filtered = continueWatching.filter(
          (p) => p.id.toString() !== progress.id.toString()
        );
        set({
          continueWatching: [progress, ...filtered].slice(0, 20),
        });
      },

      removeProgress: (id: string | number) => {
        set({
          continueWatching: get().continueWatching.filter(
            (p) => p.id.toString() !== id.toString()
          ),
        });
      },

      // Netflix Title Detail Modal
      detailModal: {
        isOpen: false,
        media: null,
      },
      openDetailModal: (media: MediaItem) => {
        set({
          detailModal: {
            isOpen: true,
            media,
          },
        });
      },
      closeDetailModal: () => {
        set((state) => ({
          detailModal: {
            ...state.detailModal,
            isOpen: false,
          },
        }));
      },

      // VidFast Player Modal
      playerModal: {
        isOpen: false,
        media: null,
        season: 1,
        episode: 1,
        server: 'VidFast Primary',
      },

      openPlayer: (media, season = 1, episode = 1, server = 'VidFast Primary') => {
        set({
          playerModal: {
            isOpen: true,
            media,
            season,
            episode,
            server,
          },
        });
      },

      closePlayer: () => {
        set((state) => ({
          playerModal: {
            ...state.playerModal,
            isOpen: false,
          },
        }));
      },

      setPlayerServer: (server: string) => {
        set((state) => ({
          playerModal: {
            ...state.playerModal,
            server,
          },
        }));
      },

      // Multi-provider Download Modal
      downloadModal: {
        isOpen: false,
        media: null,
      },

      openDownload: (media, season, episode) => {
        set({
          downloadModal: {
            isOpen: true,
            media,
            season,
            episode,
          },
        });
      },

      closeDownload: () => {
        set((state) => ({
          downloadModal: {
            ...state.downloadModal,
            isOpen: false,
          },
        }));
      },

      // Profile
      activeProfile: DEFAULT_PROFILES[0],
      setActiveProfile: (profile: UserProfile) => set({ activeProfile: profile }),

      // Audio
      isHeroMuted: true,
      toggleHeroMuted: () => set((state) => ({ isHeroMuted: !state.isHeroMuted })),

      // Search
      isSearchOpen: false,
      setIsSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

      // AdBlock
      adBlockStats: {
        blockedPopups: 0,
        blockedRequests: 0,
        blockedElements: 0,
        totalBlocked: 0,
        enabled: true,
      },
      setAdBlockStats: (stats) => set({ adBlockStats: stats }),
      toggleAdBlock: (enabled) => {
        set((state) => ({
          adBlockStats: {
            ...state.adBlockStats,
            enabled,
          },
        }));
      },
    }),
    {
      name: 'netflix-vidfast-data',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        watchlist: state.watchlist,
        favorites: state.favorites,
        continueWatching: state.continueWatching,
        activeProfile: state.activeProfile,
        likedTitles: state.likedTitles,
      }),
    }
  )
);
