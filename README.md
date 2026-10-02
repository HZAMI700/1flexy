# VidFast Streaming Platform Clone (v2.0.0 Patch)

A production streaming platform replicating VidFast & 1Flex.org UI/UX with pixel-perfect accuracy, powered by **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Zustand**.

---

## 🌟 What's New in v2.0.0

### 1. 🎬 Sand-box Free Embed Player (`fix-001`)
- Removed the restrictive `sandbox` attribute across `PlayerModal`, `EpisodePlayerView`, and `WatchPlayer` to allow full player capabilities including native controls, fullscreen, clipboard, and autoplay.
- Added standard modern streaming permissions:
  ```html
  <iframe
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
    referrerPolicy="no-referrer"
    loading="eager"
  />
  ```

### 2. 🛡️ Enhanced Pop-Under AdBlocker v2.0 (`fix-002`)
- Inspired by the *VidFast Pro Adblocker & Popunder Remover* script (Greasy Fork / Minoa).
- **Global `window.open` interception**: Evaluates and drops non-same-origin pop-unders originating from player interactions.
- **Iframe Boundary Click Filter**: Prevents clickjacking overlays and sneaky `target="_blank"` navigations without `rel="noopener"`.
- **Expanded Domain Blocklist**: Blocks `popads.net`, `popcash.net`, `propellerads.com`, `onclickads.net`, `adcash.com`, `exoclick.com`, `juicyads.com`, `trafficjunky.net`, `adsterra.com`, `hilltopads.net`, `clickadu.com`, `mgid.com`, `revcontent.com`, `taboola.com`, `outbrain.com`, `doubleclick.net`, `googlesyndication.com`, and more.
- **`beforeunload` & `unload` Capture Protection**: Neutralizes exit-intent pop-up traps.
- **`contentWindow` Sandbox Proxy**: Actively monitors and intercepts child iframe `contentWindow.open` attempts.
- **Dynamic MutationObserver**: Strips dynamically injected ad scripts and high z-index overlays (`> 9999`).
- **Service Worker Network Filter**: `public/sw-adblock.js` drops outbound ad telemetry requests at the browser network layer.

### 3. ⚡ Multi-Provider Download Engine & Fallback Chain (`download_apis`)
- Unified `/api/download` route supporting priority-based fallback across 8 providers:
  1. **FaselHD API** (Primary — direct high-speed Arabic & international mirrors)
  2. **EgyBest API** (Secondary — multi-stream cloud mirror)
  3. **ArabSeed Scraper** (Tertiary — clean decrypter mirror)
  4. **MovieBox API** (Quaternary — resumable multi-quality transfers)
  5. **VibraVid Downloader** (Quinary — DASH/HLS/MP4 streams)
  6. **vidsrc-dlp** (Senary — stream capture mirrors)
  7. **Torrent Scraper API** (Septenary — high-speed web seeds & magnets)
  8. **Nullbr API** (Octonary — cloud resource links)
- **Enhanced Download Modal UI**:
  - Live Provider badge showing which engine served the links (`FaselHD API`, `EgyBest API`, etc.)
  - Quality selector tabs (`All` | `4K` | `1080p` | `720p` | `480p`)
  - Subtitle inclusion toggle (`+Subs SRT/VTT`)
  - File size & transfer speed metrics
  - Direct download and one-click copy links with clipboard toast

---

## 🧪 Verified Test Cases

| Test ID | Target Media | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| `test-001` | `/movie/533535` (Deadpool & Wolverine) | Player loads without sandbox; controls and fullscreen work | **PASSED** |
| `test-002` | Pop-under ads blocked | Clicks on player do not spawn unwanted popup windows | **PASSED** |
| `test-003` | `/movie/533535` Download Modal | Fallback chain queries providers; displays 4K/1080p/720p/480p | **PASSED** |
| `test-004` | `/tv/63174/1/1` (Lucifer) | S01E01 episode download links resolved with provider badge | **PASSED** |

---

## 🚀 Running the Project

```bash
# Start development server
npm run dev

# Or build and start production
npm run build
npm run start
```
Server runs at [http://localhost:3000](http://localhost:3000).
