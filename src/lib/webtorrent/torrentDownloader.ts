/**
 * WebTorrent Downloader Engine & Media File Selector
 *
 * Implements intelligent file detection, piece prioritization,
 * real-time metric tracking, and direct browser Blob download generation.
 */

export const SUPPORTED_MEDIA_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.webm',
  '.mov',
  '.m4v',
  '.avi',
];

export interface TorrentFileInfo {
  index: number;
  name: string;
  path: string;
  length: number;
  lengthFormatted: string;
  isMedia: boolean;
  extension: string;
  rawFile: any;
}

export interface DownloadProgress {
  progress: number;
  progressPercent: string;
  downloaded: number;
  downloadedFormatted: string;
  total: number;
  totalFormatted: string;
  speed: number;
  speedFormatted: string;
  peers: number;
  timeRemaining: number;
  eta: string;
  hasPeers: boolean;
  status: 'waiting' | 'downloading' | 'completed' | 'paused' | 'error';
  filename: string;
  error?: string;
}

export interface StartDownloadCallbacks {
  onProgress?: (data: DownloadProgress) => void;
  onComplete?: (blobUrl: string, filename: string) => void;
  onError?: (err: Error) => void;
}

export interface DownloadController {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  saveFile: () => void;
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format download speed into human-readable string
 */
export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  return `${formatBytes(bytesPerSec)}/s`;
}

/**
 * Format remaining seconds into human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return 'Calculating...';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${remSecs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

/**
 * Get structured list of all files contained inside a torrent
 */
export function getTorrentFiles(torrent: any): TorrentFileInfo[] {
  if (!torrent || !torrent.files) return [];

  return torrent.files.map((file: any, index: number) => {
    const name = file.name || `file_${index}`;
    const dotIndex = name.lastIndexOf('.');
    const extension = dotIndex !== -1 ? name.substring(dotIndex).toLowerCase() : '';
    const isMedia = SUPPORTED_MEDIA_EXTENSIONS.includes(extension);

    return {
      index,
      name,
      path: file.path || name,
      length: file.length || 0,
      lengthFormatted: formatBytes(file.length || 0),
      isMedia,
      extension,
      rawFile: file,
    };
  });
}

/**
 * Find the primary media file inside the torrent using sensible selection logic
 *
 * 1. Exact preferredFilename match if provided
 * 2. Case-insensitive filename match if provided
 * 3. Filter for supported media extensions (.mp4, .mkv, .webm, .mov, .m4v, .avi)
 * 4. Filter out obvious sample/trailer/preview files
 * 5. Choose the largest supported media file
 */
export function findMediaFile(
  files: TorrentFileInfo[],
  preferredFilename?: string
): TorrentFileInfo | null {
  if (!files || files.length === 0) return null;

  // 1. Exact match with preferredFilename
  if (preferredFilename) {
    const cleanPref = preferredFilename.trim().toLowerCase();
    const exactMatch = files.find((f) => f.name.toLowerCase() === cleanPref);
    if (exactMatch) return exactMatch;

    // Partial/basename match
    const baseMatch = files.find((f) => f.name.toLowerCase().includes(cleanPref));
    if (baseMatch) return baseMatch;
  }

  // 2. Filter supported media files
  const mediaFiles = files.filter((f) => f.isMedia);
  if (mediaFiles.length === 0) {
    // If no supported extension found, pick the largest overall file as fallback
    const sortedAll = [...files].sort((a, b) => b.length - a.length);
    return sortedAll[0] || null;
  }

  // 3. Exclude sample, trailer, preview files
  const nonSampleFiles = mediaFiles.filter((f) => {
    const lower = f.name.toLowerCase();
    return (
      !lower.includes('sample') &&
      !lower.includes('trailer') &&
      !lower.includes('preview') &&
      !lower.includes('featurette')
    );
  });

  const candidates = nonSampleFiles.length > 0 ? nonSampleFiles : mediaFiles;

  // 4. Sort by size descending (largest file is the main feature)
  candidates.sort((a, b) => b.length - a.length);

  return candidates[0] || null;
}

/**
 * Trigger an actual browser download using an object/blob URL with the clean media filename
 */
export function triggerBrowserSave(blobUrl: string, filename: string): void {
  if (typeof document === 'undefined') return;

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
  }, 1000);
}

/**
 * Start downloading a specific file from WebTorrent
 *
 * - Prioritizes the target file and deselects other pieces
 * - Emits real-time progress, speed, peer counts, and ETA
 * - Generates clean Blob URL upon completion and triggers download
 */
export function startDownload(
  torrent: any,
  targetFile: any,
  callbacks: StartDownloadCallbacks = {}
): DownloadController {
  const { onProgress, onComplete, onError } = callbacks;

  const filename = targetFile.name || 'video.mp4';
  const totalBytes = targetFile.length || 0;

  let isPaused = false;
  let isCancelled = false;
  let completedBlobUrl: string | null = null;
  let progressInterval: any = null;

  // Deselect other files and select target file
  if (torrent && torrent.files) {
    torrent.files.forEach((f: any) => {
      if (f === targetFile || f.name === filename) {
        f.select();
      } else {
        f.deselect();
      }
    });
  }

  const emitProgress = () => {
    if (isCancelled || !onProgress) return;

    const peers = torrent.numPeers || 0;
    const downloaded = targetFile.downloaded || 0;
    const rawProgress = totalBytes > 0 ? Math.min(1, downloaded / totalBytes) : 0;
    const speed = torrent.downloadSpeed || 0;
    const timeRemainingSecs = torrent.timeRemaining ? Math.round(torrent.timeRemaining / 1000) : 0;

    let status: DownloadProgress['status'] = 'downloading';
    if (isPaused) {
      status = 'paused';
    } else if (rawProgress >= 1 || targetFile.progress === 1) {
      status = 'completed';
    } else if (peers === 0 && downloaded === 0) {
      status = 'waiting';
    }

    onProgress({
      progress: parseFloat(rawProgress.toFixed(4)),
      progressPercent: `${(rawProgress * 100).toFixed(1)}%`,
      downloaded,
      downloadedFormatted: formatBytes(downloaded),
      total: totalBytes,
      totalFormatted: formatBytes(totalBytes),
      speed,
      speedFormatted: formatSpeed(speed),
      peers,
      timeRemaining: timeRemainingSecs,
      eta: formatDuration(timeRemainingSecs),
      hasPeers: peers > 0,
      status,
      filename,
    });
  };

  // Poll progress every 400ms
  progressInterval = setInterval(emitProgress, 400);

  // Begin blob generation when file completes
  targetFile.getBlobURL((err: any, url: string) => {
    if (progressInterval) clearInterval(progressInterval);

    if (isCancelled) {
      if (url) URL.revokeObjectURL(url);
      return;
    }

    if (err) {
      console.error('[WebTorrent Downloader Error]:', err);
      if (onError) onError(new Error(err.message || 'Failed to generate download file.'));
      return;
    }

    completedBlobUrl = url;

    // Final completion emit
    if (onProgress) {
      onProgress({
        progress: 1,
        progressPercent: '100.0%',
        downloaded: totalBytes,
        downloadedFormatted: formatBytes(totalBytes),
        total: totalBytes,
        totalFormatted: formatBytes(totalBytes),
        speed: 0,
        speedFormatted: '0 B/s',
        peers: torrent.numPeers || 0,
        timeRemaining: 0,
        eta: 'Done',
        hasPeers: true,
        status: 'completed',
        filename,
      });
    }

    if (onComplete) {
      onComplete(url, filename);
    }
  });

  return {
    pause: () => {
      isPaused = true;
      if (targetFile.deselect) targetFile.deselect();
      emitProgress();
    },
    resume: () => {
      isPaused = false;
      if (targetFile.select) targetFile.select();
      emitProgress();
    },
    cancel: () => {
      isCancelled = true;
      if (progressInterval) clearInterval(progressInterval);
      if (targetFile.deselect) targetFile.deselect();
      if (completedBlobUrl) {
        URL.revokeObjectURL(completedBlobUrl);
        completedBlobUrl = null;
      }
    },
    saveFile: () => {
      if (completedBlobUrl) {
        triggerBrowserSave(completedBlobUrl, filename);
      }
    },
  };
}
