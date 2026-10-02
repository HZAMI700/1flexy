/**
 * WebTorrent Browser Client Manager
 *
 * Provides a clean browser-only singleton client for WebTorrent.
 * Dynamically loads the official WebTorrent browser bundle (/webtorrent.min.js)
 * ensuring zero Node.js/Webpack polyfill conflicts in Next.js on Vercel.
 */

declare global {
  interface Window {
    WebTorrent?: any;
    __wtClientSingleton?: any;
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

/**
 * Ensure the WebTorrent browser bundle script is loaded and ready
 */
export async function loadWebTorrentScript(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('WebTorrent cannot be initialized in a server-side environment.');
  }

  if (window.WebTorrent) {
    return window.WebTorrent;
  }

  return new Promise((resolve, reject) => {
    // Check if script tag is already injected
    let existingScript = document.querySelector('script[src="/webtorrent.min.js"]') as HTMLScriptElement;

    if (existingScript) {
      if (window.WebTorrent) {
        return resolve(window.WebTorrent);
      }
      existingScript.addEventListener('load', () => resolve(window.WebTorrent));
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load WebTorrent browser library script.'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = '/webtorrent.min.js';
    script.async = true;
    script.onload = () => {
      if (window.WebTorrent) {
        resolve(window.WebTorrent);
      } else {
        reject(new Error('WebTorrent library loaded but window.WebTorrent is undefined.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load /webtorrent.min.js from public directory.'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Get or initialize the singleton WebTorrent browser client
 */
export async function getWebTorrentClient(): Promise<any> {
  if (!isWebRTCSupported()) {
    throw new Error(
      'WebRTC is not supported in this browser. WebTorrent requires WebRTC for peer-to-peer data transfer.'
    );
  }

  const WebTorrent = await loadWebTorrentScript();

  if (!window.__wtClientSingleton || window.__wtClientSingleton.destroyed) {
    window.__wtClientSingleton = new WebTorrent({
      maxConns: 55,
      dht: false, // DHT is UDP only, not available in browser
    });

    window.__wtClientSingleton.on('error', (err: any) => {
      console.warn('[WebTorrent Client Warning]:', err?.message || err);
    });
  }

  return window.__wtClientSingleton;
}

export interface LoadTorrentOptions {
  timeoutMs?: number;
  trackers?: string[];
}

/**
 * Load a torrent from a .torrent URL, File, or magnet URI
 * @param torrentUrl URL to .torrent file or magnet link
 * @param options optional timeout and trackers
 */
export async function loadTorrent(
  torrentUrl: string,
  options: LoadTorrentOptions = {}
): Promise<any> {
  const client = await getWebTorrentClient();
  const { timeoutMs = 30000 } = options;

  let torrentInput: any = torrentUrl;

  // If loading from a URL (e.g. /torrents/movie.torrent), fetch as ArrayBuffer for reliable parsing
  if (typeof torrentUrl === 'string' && (torrentUrl.startsWith('/') || torrentUrl.startsWith('http'))) {
    try {
      const response = await fetch(torrentUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} while fetching ${torrentUrl}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      // Use Uint8Array / Buffer in browser
      torrentInput = new Uint8Array(arrayBuffer);
    } catch (err: any) {
      throw new Error(`Failed to load .torrent file from ${torrentUrl}: ${err.message}`);
    }
  }

  // Check if this torrent is already loaded
  const existing = client.torrents.find((t: any) => {
    return t.torrentFileBlobURL === torrentUrl || t.magnetURI === torrentUrl;
  });

  if (existing && !existing.destroyed) {
    return existing;
  }

  return new Promise((resolve, reject) => {
    let timeoutTimer: any = null;

    const timeoutPromise = new Promise((_, rej) => {
      timeoutTimer = setTimeout(() => {
        rej(new Error(`Timed out waiting for torrent metadata (${timeoutMs / 1000}s).`));
      }, timeoutMs);
    });

    try {
      const torrent = client.add(torrentInput, {
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.fastcast.nz',
          'wss://tracker.webtorrent.dev',
        ],
      });

      torrent.on('metadata', () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        resolve(torrent);
      });

      torrent.on('error', (err: any) => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        reject(new Error(`Torrent error: ${err.message || err}`));
      });

      // Race against timeout
      timeoutPromise.catch((err) => {
        try {
          torrent.destroy();
        } catch {}
        reject(err);
      });
    } catch (err: any) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      reject(new Error(`Failed to add torrent to WebTorrent: ${err.message || err}`));
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
