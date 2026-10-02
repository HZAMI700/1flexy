# VidFast Streaming Platform Clone (1Flex UI/UX)

A streaming platform replicating VidFast & 1Flex.org UI/UX with accuracy, powered by **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Zustand**.

---

## 🌟 Key Features

### 1. 🛡️ Custom Built-In AdBlocker Shield (`src/lib/adblocker.ts`)
- **`window.open` Neutering:** Completely blocks sneaky pop-under windows by intercepting `window.open` calls and returning `null`.
- **Ad Domain Blocklist:** Filters known telemetry and malicious ad network domains (`doubleclick.net`, `googlesyndication.com`, `popads.net`, `propellerads.com`, `exoclick.com`, `juicyads.com`, `trafficjunky.net`, `onclickads.net`, `adsterra.com`, etc.).
- **Network Request Interception:** Intercepts `window.fetch` and `XMLHttpRequest.prototype.open` to terminate outbound ad tracking requests.
- **MutationObserver DOM Sanitization:** Real-time DOM observation removes dynamically injected suspicious scripts and full-screen invisible clickjacking overlays.
- **`beforeunload` Pop-up Neutralization:** Blocks aggressive pop-ups triggered upon navigating away.
- **Live Shield Telemetry:** The navigation bar displays the current shield status and total blocked ad elements in real-time.

### 2. 🎬 VidFast Embed Player 2.0 (`src/components/PlayerModal.tsx` & `src/components/WatchPlayer.tsx`)
- Direct integration with VidFast embed parameters:
  - **Movies:** `https://vidfast.vc/movie/{tmdbId}?autoPlay=true&title=true&poster=true&theme=16A085&chromecast=true&fullscreenButton=true`
  - **TV Shows:** `https://vidfast.vc/tv/{tmdbId}/{season}/{episode}?autoPlay=true&nextButton=true&autoNext=true&theme=16A085&chromecast=true`
- **Multi-Server Switcher:** Switch between VidFast Primary (fastest), CloudStream Backup, and FastCDN Mirror.
- **Controls & Theater Mode:** Fullscreen toggle, theater mode expansion, copy shareable link, favorite shortcut.
- **Sandbox Security Attributes:** `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`, `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`.

### 3. ⚡ Fasel HD High-Speed Downloader (`src/services/faselhd.ts` & `src/components/DownloadModal.tsx`)
- Fetches verified multi-tier download links directly:
  - **4K UHD** (MKV x265 10-bit HDR)
  - **1080p Full HD** (MP4 H.264 High Profile)
  - **720p HD** (MP4 H.264)
  - **480p Mobile** (MP4 Mobile Optimized)
- Displays file sizes, CDN server speeds, one-click direct downloads, and copy-to-clipboard options.

### 4. 💎 Pixel-Perfect 1Flex UI/UX & Dark Aesthetics
- **Cinematic Hero Carousel:** Auto-rotating blockbuster banner with backdrop blur gradients, play triggers, and slide indicators.
- **Trending Row & Responsive Movie Grid:** 2 columns on mobile up to 6 columns on desktop with hover-scale cards (`scale(1.05) + shadow glow`).
- **Interactive Episode Picker:** Season selection dropdown with episode thumbnails, titles, runtimes, and individual episode download/stream triggers.
- **Real-Time Instant Search:** Global keyboard shortcut (`⌘K` / `Ctrl+K`), debounced live suggestions, and dedicated `/search` discovery page.
- **Pill-Style Genre Explorer:** Instant filtering across Action, Sci-Fi, Adventure, Horror, Drama, Animation, and more.
- **Continue Watching & Watchlist:** Persistent client storage using Zustand and LocalStorage.
- **PWA Ready:** Web app manifest and offline caching service worker.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Create a `.env.local` file:
```env
# Optional TMDB API key (Fallback mock data is built-in for 100% offline uptime)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_FASELHD_API_BASE=https://faselhd-api.example.com
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Start
```bash
npm run build
npm run start
```

---

## 📁 Architecture Overview

```
src/
├── app/
│   ├── layout.tsx                     # Root layout with AdBlocker initialization & modals
│   ├── page.tsx                       # Homepage with Hero, Trending, TV rows, & Grids
│   ├── movie/[id]/page.tsx            # Movie detail view + player & Fasel HD triggers
│   ├── tv/[id]/page.tsx               # TV detail view + seasons & episode drawer
│   ├── tv/[id]/[season]/[episode]/    # Direct episode streaming page
│   ├── watch/[type]/[id]/page.tsx     # Full-screen immersive player view
│   ├── search/page.tsx                # Discovery search page with type & sort filters
│   ├── genre/[slug]/page.tsx          # Genre-filtered catalog view
│   ├── watchlist/page.tsx             # Saved watchlist & favorites library
│   ├── dmca/page.tsx                  # DMCA copyright policy
│   ├── terms/page.tsx                 # Terms of service
│   ├── privacy/page.tsx               # Privacy policy
│   └── globals.css                    # Tailwind setup & styling
├── components/
│   ├── Navbar.tsx                     # Sticky nav with live AdShield status badge
│   ├── Footer.tsx                     # Footer with links & disclaimer
│   ├── HeroBanner.tsx                 # Auto-rotating hero carousel
│   ├── MediaCard.tsx                  # Hover-scale card with rating & 4K badges
│   ├── MediaRow.tsx                   # Horizontal scrollable media row
│   ├── PlayerModal.tsx                # VidFast embed player modal
│   ├── DownloadModal.tsx              # Fasel HD download modal
│   ├── SearchModal.tsx                # Real-time search modal
│   ├── GenrePills.tsx                 # Genre filter pills
│   ├── EpisodeList.tsx                # Season dropdown + episode cards
│   ├── ContinueWatchingRow.tsx        # LocalStorage continue watching row
│   ├── CastCarousel.tsx               # Actor avatar carousel
│   ├── SkeletonLoaders.tsx            # Reusable shimmering skeletons
│   └── ErrorBoundary.tsx              # Graceful error handling
├── lib/
│   ├── adblocker.ts                   # Core adblocker engine
│   ├── tmdb.ts                        # TMDB integration client
│   └── mockData.ts                    # High-fidelity offline data
├── services/
│   └── faselhd.ts                     # Fasel HD download service
├── store/
│   └── useAppStore.ts                 # Zustand store (favorites, watchlist, player state)
└── types/
    └── index.ts                       # TypeScript interfaces
```
