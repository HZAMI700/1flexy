/**
 * WebTorrent Browser Client Manager
 *
 * Provides a clean browser-only singleton client for WebTorrent.
 * Dynamically loads the WebTorrent browser bundle (/webtorrent.min.js)
 * with multi-tier fallback (native ES import -> module script injection -> window.WebTorrent).
 * Zero Node.js/Webpack polyfill conflicts in Next.js on Vercel.
 */

declare global {
  interface Window {
    WebTorrent?: any;
    __wtClientSingleton?: any;
    __wtScriptPromise?: Promise<any>;
  }
}

/**
 * Check if the current browser supports WebRTC (required by WebTorrent)
 */
export function isWebRTCSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
}

let cachedWebTorrentClass: any = null;
let scriptLoadingPromise: Promise<any> | null = null;

/**
 * Ensure the WebTorrent browser bundle script is loaded and ready.
 * Resolves with the WebTorrent constructor class.
 */
export async function loadWebTorrentScript(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('WebTorrent cannot be initialized in a server-side environment.');
  }

  // 1. Return immediately if already cached or on window/globalThis
  if (cachedWebTorrentClass) {
    return cachedWebTorrentClass;
  }
  if (window.WebTorrent) {
    cachedWebTorrentClass = window.WebTorrent;
    return cachedWebTorrentClass;
  }

  // 2. Return in-flight loading promise to avoid duplicate attempts
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = (async () => {
    console.log('[WebTorrent] Initializing browser bundle loader...');

    // Strategy A: Native dynamic import of ES module bundle
    try {
      // Use Function constructor so Webpack 5 does not attempt static analysis
      const dynamicImport = new Function('url', 'return import(url)');
      const module = await dynamicImport('/webtorrent.min.js');
      const Ctor = module?.default || module?.WebTorrent || window.WebTorrent;
      if (typeof Ctor === 'function') {
        console.log('[WebTorrent] Successfully loaded via native dynamic import.');
        cachedWebTorrentClass = Ctor;
        window.WebTorrent = Ctor;
        return Ctor;
      }
    } catch (importErr) {
      console.warn('[WebTorrent] Dynamic import attempt notice:', importErr);
    }

    // Strategy B: Injected <script type="module"> tag with timeout polling
    return new Promise((resolve, reject) => {
      if (window.WebTorrent && typeof window.WebTorrent === 'function') {
        cachedWebTorrentClass = window.WebTorrent;
        return resolve(window.WebTorrent);
      }

      let script = document.querySelector('script[data-wt-loader="true"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('data-wt-loader', 'true');
        script.src = '/webtorrent.min.js';
        script.onerror = () => {
          reject(new Error('Failed to fetch /webtorrent.min.js from server.'));
        };
        document.head.appendChild(script);
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.WebTorrent && typeof window.WebTorrent === 'function') {
          clearInterval(interval);
          cachedWebTorrentClass = window.WebTorrent;
          console.log('[WebTorrent] Successfully detected window.WebTorrent via script injection.');
          resolve(window.WebTorrent);
        } else if (Date.now() - startTime > 12000) {
          clearInterval(interval);
          reject(new Error('Timed out waiting for WebTorrent browser bundle to initialize.'));
        }
      }, 80);
    });
  })();

  return scriptLoadingPromise;
}

/**
 * Get or initialize the singleton WebTorrent browser client
 */
export async function getWebTorrentClient(): Promise<any> {
  if (!isWebRTCSupported()) {
    throw new Error(
      'WebRTC is not supported in this browser. WebTorrent requires WebRTC for client-side peer swarming.'
    );
  }

  const WebTorrent = await loadWebTorrentScript();

  if (!window.__wtClientSingleton || window.__wtClientSingleton.destroyed) {
    try {
      window.__wtClientSingleton = new WebTorrent({
        maxConns: 55,
        dht: false, // UDP DHT not supported in browser
      });

      window.__wtClientSingleton.on('error', (err: any) => {
        console.warn('[WebTorrent Client Warning]:', err?.message || err);
      });
    } catch (err: any) {
      console.error('[WebTorrent Init Error]:', err);
      throw new Error(`Failed to instantiate WebTorrent client: ${err?.message || err}`);
    }
  }

  return window.__wtClientSingleton;
}

export interface LoadTorrentOptions {
  timeoutMs?: number;
  trackers?: string[];
}

const PUBLIC_WEBRTC_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.fastcast.nz',
  'wss://tracker.webtorrent.dev',
];

/**
 * Load a torrent from a .torrent URL, File, or magnet URI
 * @param torrentUrl URL to .torrent file or magnet link
 * @param options optional timeout and trackers
 */
export async function loadTorrent(
  torrentUrl: string,
  options: LoadTorrentOptions = {}
): Promise<any> {
  if (!torrentUrl || typeof torrentUrl !== 'string' || !torrentUrl.trim()) {
    throw new Error('No valid torrent URL or magnet link provided.');
  }

  const client = await getWebTorrentClient();
  const { timeoutMs = 25000 } = options;

  let torrentInput: any = torrentUrl.trim();

  // If loading from a local or remote .torrent URL, fetch bytes directly into a Uint8Array
  if (torrentInput.startsWith('/') || torrentInput.startsWith('http')) {
    try {
      console.log(`[WebTorrent] Fetching .torrent file from: ${torrentInput}`);
      const response = await fetch(torrentInput);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      torrentInput = new Uint8Array(arrayBuffer);
      console.log(`[WebTorrent] .torrent file fetched (${torrentInput.byteLength} bytes)`);
    } catch (err: any) {
      throw new Error(`Unable to fetch .torrent file from "${torrentUrl}": ${err.message}`);
    }
  }

  // Check if this exact torrent is already active in client
  const existing = client.torrents.find((t: any) => {
    return (
      (t.torrentFileBlobURL && t.torrentFileBlobURL === torrentUrl) ||
      (t.magnetURI && t.magnetURI === torrentUrl)
    );
  });

  if (existing && !existing.destroyed) {
    if (existing.ready || (existing.files && existing.files.length > 0)) {
      console.log('[WebTorrent] Reusing active ready torrent:', existing.name || existing.infoHash);
      return existing;
    }
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutTimer: any = null;

    const cleanup = () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const handleSuccess = (tor: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      console.log(`[WebTorrent] Torrent ready: "${tor.name || 'unnamed'}" with ${tor.files?.length || 0} file(s)`);
      resolve(tor);
    };

    const handleError = (err: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      console.error('[WebTorrent] Torrent load failed:', err);
      reject(new Error(err?.message || 'Failed to load torrent metadata.'));
    };

    // Timeout safety net
    timeoutTimer = setTimeout(() => {
      handleError(
        new Error(
          `Timed out waiting for torrent metadata (${timeoutMs / 1000}s). Please check WebRTC trackers or peer availability.`
        )
      );
    }, timeoutMs);

    try {
      const torrent = client.add(
        torrentInput,
        {
          announce: PUBLIC_WEBRTC_TRACKERS,
        },
        (tor: any) => {
          handleSuccess(tor);
        }
      );

      // In case metadata was parsed synchronously from the .torrent buffer
      if (torrent.ready || (torrent.files && torrent.files.length > 0)) {
        handleSuccess(torrent);
      } else {
        torrent.once('ready', () => handleSuccess(torrent));
        torrent.once('metadata', () => handleSuccess(torrent));
      }

      torrent.on('error', (err: any) => {
        handleError(err);
      });
    } catch (err: any) {
      handleError(err);
    }
  });
}

/**
 * Cancel and destroy an active torrent, releasing memory and peer connections
 */
export function cancelTorrent(torrent: any): void {
  if (!torrent) return;
  try {
    if (typeof torrent.destroy === 'function' && !torrent.destroyed) {
      torrent.destroy({ destroyStore: true }, () => {
        console.log('[WebTorrent] Torrent cancelled and store destroyed.');
      });
    }
  } catch (err) {
    console.warn('[WebTorrent] Error cancelling torrent:', err);
  }
}

/**
 * Cleanup and remove all active torrents
 */
export function cleanupTorrent(torrent: any): void {
  cancelTorrent(torrent);
}

/**
 * Destroy the entire WebTorrent client singleton
 */
export function destroyWebTorrentClient(): void {
  if (typeof window !== 'undefined' && window.__wtClientSingleton) {
    try {
      window.__wtClientSingleton.destroy();
    } catch {}
    window.__wtClientSingleton = null;
  }
}
