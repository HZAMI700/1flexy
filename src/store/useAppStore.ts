import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MediaItem, WatchProgress } from '@/types';
import { AdBlockStats } from '@/lib/adblocker';

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

interface AppState {
  // Watchlist & Favorites
  favorites: MediaItem[];
  watchlist: MediaItem[];
  toggleFavorite: (media: MediaItem) => void;
  isFavorite: (id: string | number) => boolean;
  toggleWatchlist: (media: MediaItem) => void;
  isWatchlist: (id: string | number) => boolean;

  // Continue Watching
  continueWatching: WatchProgress[];
  saveProgress: (progress: WatchProgress) => void;
  removeProgress: (id: string | number) => void;

  // Player Modal
  playerModal: PlayerModalState;
  openPlayer: (media: MediaItem, season?: number, episode?: number, server?: string) => void;
  closePlayer: () => void;
  setPlayerServer: (server: string) => void;

  // Download Modal
  downloadModal: DownloadModalState;
  openDownload: (media: MediaItem, season?: number, episode?: number) => void;
  closeDownload: () => void;

  // Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // AdBlock Stats
  adBlockStats: AdBlockStats;
  setAdBlockStats: (stats: AdBlockStats) => void;
  toggleAdBlock: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      watchlist: [],

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

      isSearchOpen: false,
      setIsSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

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
      name: 'vidfast-user-data',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        watchlist: state.watchlist,
        continueWatching: state.continueWatching,
      }),
    }
  )
);
