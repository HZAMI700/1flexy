'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Download,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Users,
  Gauge,
  Clock,
  HardDrive,
  FileVideo,
  FileCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Layers,
  Terminal,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  loadTorrent,
  cancelTorrent,
  isWebRTCSupported,
} from '@/lib/webtorrent/torrentClient';
import {
  getTorrentFiles,
  findMediaFile,
  startDownload,
  triggerBrowserSave,
  TorrentFileInfo,
  DownloadProgress,
  DownloadController,
} from '@/lib/webtorrent/torrentDownloader';
import {
  streamMedia,
  isBrowserPlayable,
  StreamController,
} from '@/lib/webtorrent/torrentStreamer';
import { MediaItem } from '@/types';

interface PresetItem {
  name: string;
  url: string;
  mediaFile: string;
  size: string;
  desc: string;
}

const PRESETS: PresetItem[] = [
  {
    name: 'Sintel (Open Movie)',
    url: '/torrents/sintel.torrent',
    mediaFile: 'sintel.mp4',
    size: '129 MB',
    desc: 'Blender Foundation open animation movie. Full WebRTC tracker integration.',
  },
  {
    name: 'Big Buck Bunny',
    url: '/torrents/big-buck-bunny.torrent',
    mediaFile: 'big-buck-bunny.mp4',
    size: '276 MB',
    desc: 'Classic open movie with multi-peer swarm and web seed fallback.',
  },
  {
    name: 'Tears of Steel',
    url: '/torrents/tears-of-steel.torrent',
    mediaFile: 'tears-of-steel.mp4',
    size: '571 MB',
    desc: 'Sci-fi short film showcasing HD direct streaming and fast chunk buffering.',
  },
];

export default function TorrentTestPage() {
  const { openTorrentModal } = useAppStore();

  const [torrentUrlInput, setTorrentUrlInput] = useState('/torrents/sintel.torrent');
  const [preferredFilenameInput, setPreferredFilenameInput] = useState('sintel.mp4');
  const [webrtcSupported, setWebrtcSupported] = useState<boolean | null>(null);

  // Status & Logs
  const [status, setStatus] = useState<string>('Idle. Select a preset or input a URL.');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [activeTorrent, setActiveTorrent] = useState<any>(null);
  const [filesList, setFilesList] = useState<TorrentFileInfo[]>([]);
  const [selectedTargetFile, setSelectedTargetFile] = useState<TorrentFileInfo | null>(null);

  // Download & Stream state
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const downloadCtrlRef = useRef<DownloadController | null>(null);
  const streamCtrlRef = useRef<StreamController | null>(null);

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const supported = isWebRTCSupported();
    setWebrtcSupported(supported);
    appendLog(
      supported
        ? 'WebRTC is supported in this browser. Ready for WebTorrent P2P swarming.'
        : 'WebRTC is NOT supported in this browser. WebTorrent will not work.'
    );
  }, []);

  const cleanupCurrentTorrent = () => {
    if (downloadCtrlRef.current) {
      downloadCtrlRef.current.cancel();
      downloadCtrlRef.current = null;
    }
    if (streamCtrlRef.current) {
      streamCtrlRef.current.stop();
      streamCtrlRef.current = null;
    }
    if (activeTorrent) {
      cancelTorrent(activeTorrent);
      setActiveTorrent(null);
    }
    if (downloadBlobUrl) {
      URL.revokeObjectURL(downloadBlobUrl);
      setDownloadBlobUrl(null);
    }
    setIsDownloading(false);
    setIsPaused(false);
    setIsStreaming(false);
    setStreamReady(false);
    setProgress(null);
  };

  const handleSelectPreset = (preset: PresetItem) => {
    cleanupCurrentTorrent();
    setTorrentUrlInput(preset.url);
    setPreferredFilenameInput(preset.mediaFile);
    appendLog(`Selected preset: ${preset.name} (${preset.url})`);
  };

  // 1. Inspect metadata
  const handleInspectTorrent = async () => {
    cleanupCurrentTorrent();
    setStatus('Loading torrent metadata...');
    appendLog(`Connecting to torrent: ${torrentUrlInput}`);

    try {
      const torrent = await loadTorrent(torrentUrlInput, { timeoutMs: 30000 });
      setActiveTorrent(torrent);
      appendLog(`Torrent loaded! InfoHash: ${torrent.infoHash || 'n/a'}`);

      const files = getTorrentFiles(torrent);
      setFilesList(files);
      appendLog(`Detected ${files.length} file(s) inside torrent`);

      const target = findMediaFile(files, preferredFilenameInput);
      if (target) {
        setSelectedTargetFile(target);
        appendLog(`Selected media file: "${target.name}" (${target.lengthFormatted})`);
        setStatus(`Ready: Found "${target.name}" (${target.lengthFormatted})`);
      } else {
        appendLog('No media file matching preferred criteria found. Select one manually.');
        setStatus('Ready with warnings: No matching media file detected');
      }
    } catch (err: any) {
      appendLog(`ERROR: ${err.message || 'Failed to inspect torrent'}`);
      setStatus(`Failed: ${err.message}`);
    }
  };

  // 2. Start Download
  const handleStartDownload = async () => {
    let torrent = activeTorrent;
    let target = selectedTargetFile;

    if (!torrent || !target) {
      setStatus('Loading torrent metadata before starting download...');
      appendLog(`Auto-loading torrent: ${torrentUrlInput}`);
      try {
        torrent = await loadTorrent(torrentUrlInput, { timeoutMs: 30000 });
        setActiveTorrent(torrent);
        const files = getTorrentFiles(torrent);
        setFilesList(files);
        target = findMediaFile(files, preferredFilenameInput);
        if (!target && files.length > 0) {
          target = files[0];
        }
        setSelectedTargetFile(target);
      } catch (err: any) {
        appendLog(`Download start failed: ${err.message}`);
        setStatus(`Failed: ${err.message}`);
        return;
      }
    }

    if (!target) {
      appendLog('No target file available to download.');
      return;
    }

    if (streamCtrlRef.current) {
      streamCtrlRef.current.stop();
      streamCtrlRef.current = null;
      setIsStreaming(false);
    }

    setIsDownloading(true);
    setIsPaused(false);
    setStatus(`Downloading "${target.name}"...`);
    appendLog(`Starting client-side download for "${target.name}" (${target.lengthFormatted})`);

    const ctrl = startDownload(torrent, target.rawFile, {
      onProgress: (prog) => {
        setProgress(prog);
      },
      onComplete: (blobUrl, filename) => {
        setDownloadBlobUrl(blobUrl);
        setIsDownloading(false);
        setStatus(`✓ Download completed! Ready to save "${filename}"`);
        appendLog(`✓ Download completed successfully! Triggering browser file save...`);
        triggerBrowserSave(blobUrl, filename);
      },
      onError: (err) => {
        setIsDownloading(false);
        setStatus(`Download error: ${err.message}`);
        appendLog(`Download error: ${err.message}`);
      },
    });

    downloadCtrlRef.current = ctrl;
  };

  // 3. Start Streaming
  const handleStartStream = async () => {
    let torrent = activeTorrent;
    let target = selectedTargetFile;

    if (!torrent || !target) {
      setStatus('Loading torrent metadata for stream...');
      appendLog(`Auto-loading torrent for streaming: ${torrentUrlInput}`);
      try {
        torrent = await loadTorrent(torrentUrlInput, { timeoutMs: 30000 });
        setActiveTorrent(torrent);
        const files = getTorrentFiles(torrent);
        setFilesList(files);
        target = findMediaFile(files, preferredFilenameInput);
        if (!target && files.length > 0) {
          target = files[0];
        }
        setSelectedTargetFile(target);
      } catch (err: any) {
        appendLog(`Stream start failed: ${err.message}`);
        setStatus(`Failed: ${err.message}`);
        return;
      }
    }

    if (!target) {
      appendLog('No target media file found to stream.');
      return;
    }

    if (downloadCtrlRef.current) {
      downloadCtrlRef.current.pause();
    }

    setIsStreaming(true);
    setStreamReady(false);
    setStatus(`Streaming "${target.name}" to HTML5 video player...`);
    appendLog(`Connecting torrent chunks to <video> for "${target.name}"`);

    setTimeout(() => {
      if (!videoRef.current) return;
      try {
        const streamCtrl = streamMedia(target.rawFile, videoRef.current, {
          autoplay: true,
          controls: true,
          onCanPlay: () => {
            setStreamReady(true);
            appendLog('HTML5 video buffered enough chunks to begin playback!');
          },
          onError: (err) => {
            appendLog(`Stream error: ${err.message}`);
            setStatus(`Stream playback error: ${err.message}`);
          },
        });
        streamCtrlRef.current = streamCtrl;
      } catch (err: any) {
        appendLog(`Stream init error: ${err.message}`);
      }
    }, 150);
  };

  // 4. Open in App Global Modal
  const handleOpenGlobalModal = () => {
    const mockMedia: MediaItem = {
      id: 999999,
      title: preferredFilenameInput.replace(/\.[^/.]+$/, '').toUpperCase(),
      media_type: 'movie',
      poster_path: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      backdrop_path: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
      vote_average: 8.5,
      overview: 'Test media item for WebTorrent browser streaming and client-side extraction.',
      torrentUrl: torrentUrlInput,
      mediaFile: preferredFilenameInput,
    };
    openTorrentModal(mockMedia, torrentUrlInput, preferredFilenameInput, 'download');
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 sm:p-8 font-sans selection:bg-[#E50914] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-[#222] pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-[#aaa] hover:text-white transition-colors border border-[#333]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-display tracking-tight text-white">
                  WebTorrent P2P Browser Engine
                </span>
                <span className="text-[10px] font-mono uppercase bg-[#E50914]/20 text-[#E50914] px-2 py-0.5 rounded border border-[#E50914]/40 font-bold">
                  Test Suite
                </span>
              </div>
              <p className="text-xs text-[#808080]">
                Zero Backend &bull; 100% Client-Side WebTorrent &bull; In-Browser Media Extraction (.mp4/.mkv)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                webrtcSupported
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : 'bg-red-950/40 text-red-400 border-red-800/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {webrtcSupported ? 'WebRTC Supported' : 'WebRTC Unavailable'}
            </span>
          </div>
        </div>

        {/* System Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-1">
            <div className="text-xs text-[#808080]">Architecture</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Frontend-Only
            </div>
            <div className="text-[11px] text-[#666]">Runs in browser memory, no Node.js server</div>
          </div>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-1">
            <div className="text-xs text-[#808080]">Output Guarantee</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#E50914]" /> Media File Delivered
            </div>
            <div className="text-[11px] text-[#666]">User gets .mp4, never the .torrent file</div>
          </div>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-1">
            <div className="text-xs text-[#808080]">Deployment Target</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Vercel Deployable
            </div>
            <div className="text-[11px] text-[#666]">Standard Next.js client component</div>
          </div>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-1">
            <div className="text-xs text-[#808080]">WebTorrent Version</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> v3.0.21 Browser Bundle
            </div>
            <div className="text-[11px] text-[#666]">Zero webpack Node polyfill conflicts</div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#aaa]">
            Quick Test Presets (Hosted .torrent with active WebRTC / WebSeed trackers):
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESETS.map((p) => {
              const isSelected = torrentUrlInput === p.url;
              return (
                <div
                  key={p.url}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#1e1515] border-[#E50914] shadow-lg shadow-[#E50914]/10'
                      : 'bg-[#141414] border-[#262626] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                    <span className="text-[11px] font-mono text-[#E50914] bg-[#E50914]/15 px-2 py-0.5 rounded">
                      {p.size}
                    </span>
                  </div>
                  <p className="text-xs text-[#808080] mt-1.5">{p.desc}</p>
                  <div className="mt-3 text-[11px] font-mono text-[#aaa] truncate">
                    File: <span className="text-white">{p.mediaFile}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Configuration Panel */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#aaa]">
            Torrent Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-[#aaa] font-medium">
                Torrent URL (hosted .torrent or magnet URI):
              </label>
              <input
                type="text"
                value={torrentUrlInput}
                onChange={(e) => setTorrentUrlInput(e.target.value)}
                placeholder="/torrents/sintel.torrent or magnet:?xt=..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#1f1f1f] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#aaa] font-medium">Preferred Media Filename:</label>
              <input
                type="text"
                value={preferredFilenameInput}
                onChange={(e) => setPreferredFilenameInput(e.target.value)}
                placeholder="e.g. sintel.mp4 (optional)"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1f1f1f] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleInspectTorrent}
              className="px-5 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333] text-white text-xs font-bold transition-colors flex items-center gap-2 border border-[#3a3a3a]"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" /> Inspect Metadata & Files
            </button>

            <button
              onClick={handleStartDownload}
              className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#E50914]/20"
            >
              <Download className="w-4 h-4" /> Start Client-Side Download
            </button>

            <button
              onClick={handleStartStream}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
            >
              <Play className="w-4 h-4 fill-black" /> Stream in HTML5 Video
            </button>

            <button
              onClick={handleOpenGlobalModal}
              className="px-5 py-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-[#B3B3B3] hover:text-white text-xs font-bold transition-colors flex items-center gap-2 border border-[#333] ml-auto"
            >
              <ExternalLink className="w-4 h-4 text-[#E50914]" /> Open In-App Modal
            </button>
          </div>
        </div>

        {/* Current Status Banner */}
        <div className="p-4 rounded-xl bg-[#181818] border border-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#E50914] animate-ping" />
            <div className="text-xs">
              <span className="text-[#808080]">Status: </span>
              <span className="font-semibold text-white">{status}</span>
            </div>
          </div>
          {progress && (
            <div className="text-xs font-mono text-[#E50914] font-bold">
              {progress.progressPercent} &bull; {progress.speedFormatted}
            </div>
          )}
        </div>

        {/* Interactive Workspace: Files List & Player / Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Files in Torrent */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-[#E50914]" />
                Files Inside Torrent ({filesList.length})
              </h3>
              {selectedTargetFile && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  Target: {selectedTargetFile.name}
                </span>
              )}
            </div>

            {filesList.length === 0 ? (
              <div className="py-12 text-center text-[#666] text-xs">
                No torrent loaded. Click &quot;Inspect Metadata &amp; Files&quot; above to inspect.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filesList.map((file) => {
                  const isSelected = selectedTargetFile?.index === file.index;
                  return (
                    <div
                      key={file.index}
                      onClick={() => {
                        setSelectedTargetFile(file);
                        appendLog(`Manually selected target file: "${file.name}"`);
                      }}
                      className={`p-3 rounded-xl cursor-pointer border text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1e1515] border-[#E50914] text-white'
                          : 'bg-[#1a1a1a] border-[#292929] hover:border-[#383838] text-[#aaa]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.isMedia ? (
                          <FileVideo className="w-4 h-4 text-[#E50914] flex-shrink-0" />
                        ) : (
                          <HardDrive className="w-4 h-4 text-[#666] flex-shrink-0" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                        <span>{file.lengthFormatted}</span>
                        {isSelected && <span className="text-[#E50914] font-bold">✓ Selected</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Streaming Player or Download Progress */}
          <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-[#E50914]" />
              Media Player &amp; Download Stream
            </h3>

            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#242424] flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                controls
              />
              {!isStreaming && !isDownloading && !downloadBlobUrl && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <Play className="w-10 h-10 text-[#555]" />
                  <p className="text-xs text-[#808080]">
                    Click &quot;Stream in HTML5 Video&quot; or &quot;Start Client-Side Download&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Live Progress Bar & Metrics */}
            {progress && (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{progress.progressPercent}</span>
                  <span className="text-[#888]">
                    {progress.downloadedFormatted} / {progress.totalFormatted}
                  </span>
                </div>

                <div className="h-2.5 w-full bg-[#222] rounded-full overflow-hidden p-0.5 border border-[#333]">
                  <div
                    className="h-full bg-[#E50914] rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-[#aaa] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#E50914]" /> {progress.speedFormatted}
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> {progress.peers} Peers
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> {progress.eta}
                  </div>
                </div>

                {downloadBlobUrl && (
                  <button
                    onClick={() => {
                      if (selectedTargetFile) {
                        triggerBrowserSave(downloadBlobUrl, selectedTargetFile.name);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download className="w-4 h-4" /> Save {selectedTargetFile?.name} to Computer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Diagnostics Console Log */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Engine Diagnostics Console
            </h3>
            <button
              onClick={() => setLogMessages([])}
              className="text-xs text-[#808080] hover:text-white"
            >
              Clear Logs
            </button>
          </div>
          <div className="p-4 rounded-xl bg-black border border-[#222] font-mono text-[11px] text-[#00ff88] h-48 overflow-y-auto space-y-1">
            {logMessages.length === 0 ? (
              <div className="text-[#555]">No events logged yet.</div>
            ) : (
              logMessages.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
