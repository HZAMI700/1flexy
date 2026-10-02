/**
 * WebTorrent HTML5 Video Streamer
 *
 * Connects WebTorrent file chunks directly into an HTML5 <video> element
 * utilizing WebTorrent's native renderTo / MediaSource API for zero-wait playback.
 */

export interface StreamOptions {
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  onCanPlay?: () => void;
  onError?: (err: Error) => void;
}

export interface StreamController {
  stop: () => void;
  videoElement: HTMLVideoElement;
}

/**
 * Check if the browser natively supports decoding this container format
 */
export function isBrowserPlayable(filename: string): boolean {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  // Standard browsers natively play MP4 (H.264/AAC) and WebM (VP8/VP9/Opus)
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.m4v');
}

/**
 * Stream a WebTorrent media file into an HTML5 <video> element
 * @param file WebTorrent file object
 * @param videoElement target HTMLVideoElement
 * @param options streaming options
 * @returns StreamController
 */
export function streamMedia(
  file: any,
  videoElement: HTMLVideoElement,
  options: StreamOptions = {}
): StreamController {
  if (!file) {
    throw new Error('No torrent file provided to streamMedia.');
  }
  if (!videoElement) {
    throw new Error('No HTMLVideoElement provided to streamMedia.');
  }

  const {
    autoplay = true,
    controls = true,
    muted = false,
    onCanPlay,
    onError,
  } = options;

  videoElement.controls = controls;
  videoElement.muted = muted;
  videoElement.autoplay = autoplay;

  let isDestroyed = false;

  const canPlayHandler = () => {
    if (!isDestroyed && onCanPlay) {
      onCanPlay();
    }
  };

  const errorHandler = (e: any) => {
    if (!isDestroyed) {
      console.warn('[WebTorrent Streamer] Video element playback notice:', e);
      if (onError) {
        const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '';
        const msg = !isBrowserPlayable(file.name)
          ? `This container (${ext}) may not be directly decodable in your browser. Please use the Download option instead.`
          : 'Playback error encountered during torrent streaming.';
        onError(new Error(msg));
      }
    }
  };

  videoElement.addEventListener('canplay', canPlayHandler, { once: true });
  videoElement.addEventListener('error', errorHandler);

  try {
    // Official WebTorrent browser streaming method
    file.renderTo(
      videoElement,
      {
        autoplay,
        controls,
      },
      (err: any) => {
        if (err && !isDestroyed) {
          console.error('[WebTorrent Streamer renderTo error]:', err);
          if (onError) onError(new Error(err.message || 'Streaming render failed.'));
        }
      }
    );
  } catch (err: any) {
    console.warn('[WebTorrent Streamer] Fallback to streamTo or blob:', err);
    if (onError) onError(err);
  }

  return {
    videoElement,
    stop: () => {
      isDestroyed = true;
      videoElement.removeEventListener('canplay', canPlayHandler);
      videoElement.removeEventListener('error', errorHandler);
      try {
        videoElement.pause();
        videoElement.removeAttribute('src');
        videoElement.load();
      } catch {}
    },
  };
}
