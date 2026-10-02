'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
  ListFilter,
  Check,
  RotateCcw,
  Sparkles,
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

export const TorrentModal: React.FC = () => {
  const { torrentModal, closeTorrentModal } = useAppStore();
  const { isOpen, media, torrentUrl, preferredFilename, mode: initialMode } = torrentModal;

  const [mode, setMode] = useState<'download' | 'stream'>(initialMode || 'download');
  const [phase, setPhase] = useState<
    'initializing' | 'loading_metadata' | 'ready' | 'downloading' | 'completed' | 'streaming' | 'error'
  >('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing WebTorrent engine...');
  const [retryKey, setRetryKey] = useState<number>(0);

  // Torrent Data
  const [torrentInstance, setTorrentInstance] = useState<any>(null);
  const [filesList, setFilesList] = useState<TorrentFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<TorrentFileInfo | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  // Download State
  const [progressData, setProgressData] = useState<DownloadProgress | null>(null);
  const [completedBlobUrl, setCompletedBlobUrl] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Streaming State
  const [isStreamingReady, setIsStreamingReady] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const downloadControllerRef = useRef<DownloadController | null>(null);
  const streamControllerRef = useRef<StreamController | null>(null);

  // Sync mode with store
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Clean shutdown helper
  const teardownActiveTorrent = useCallback(() => {
    if (downloadControllerRef.current) {
      downloadControllerRef.current.cancel();
      downloadControllerRef.current = null;
    }
    if (streamControllerRef.current) {
      streamControllerRef.current.stop();
      streamControllerRef.current = null;
    }
    if (torrentInstance) {
      cancelTorrent(torrentInstance);
      setTorrentInstance(null);
    }
    if (completedBlobUrl) {
      URL.revokeObjectURL(completedBlobUrl);
      setCompletedBlobUrl(null);
    }
  }, [torrentInstance, completedBlobUrl]);

  // Handle Close
  const handleClose = () => {
    teardownActiveTorrent();
    closeTorrentModal();
  };

  // Keyboard shortcut: Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Main lifecycle: Load Torrent on Open
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!torrentUrl || typeof torrentUrl !== 'string' || !torrentUrl.trim()) {
      setPhase('error');
      setErrorMessage('No torrent file or magnet link was configured for this title.');
      return;
    }

    let isCancelled = false;

    async function initTorrentFlow() {
      // 1. Verify WebRTC support in browser
      if (!isWebRTCSupported()) {
        setPhase('error');
        setErrorMessage(
          'WebRTC is not supported in this browser. Please use a modern browser (Chrome, Firefox, Edge, Safari) to use WebTorrent.'
        );
        return;
      }

      setPhase('loading_metadata');
      setLoadingStep('Step 1/3: Initializing in-browser WebTorrent WebRTC engine...');
      setErrorMessage(null);
      setProgressData(null);
      setCompletedBlobUrl(null);
      setIsPaused(false);
      setIsStreamingReady(false);
      setStreamError(null);

      try {
        console.log(`[TorrentModal] Loading torrent from: ${torrentUrl}`);
        setLoadingStep(
          torrentUrl.startsWith('/')
            ? 'Step 2/3: Reading local .torrent metadata package...'
            : 'Step 2/3: Connecting to WebRTC trackers swarm...'
        );

        const torrent = await loadTorrent(torrentUrl, { timeoutMs: 25000 });

        if (isCancelled) {
          cancelTorrent(torrent);
          return;
        }

        setLoadingStep('Step 3/3: Selecting media file (.mp4 / .mkv)...');
        setTorrentInstance(torrent);

        // 2. Read all files inside the torrent
        const files = getTorrentFiles(torrent);
        setFilesList(files);

        // 3. Find primary media file
        const detectedTarget = findMediaFile(files, preferredFilename);

        if (!detectedTarget) {
          setPhase('error');
          setErrorMessage(
            'No supported media files (.mp4, .mkv, .webm, .mov, .m4v, .avi) were detected inside this torrent.'
          );
          return;
        }

        setSelectedFile(detectedTarget);
        setPhase('ready');

        // Automatically start the selected mode
        if (mode === 'stream') {
          startStreaming(detectedTarget);
        } else {
          startDownloading(torrent, detectedTarget);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[TorrentModal Error]:', err);
          setPhase('error');
          setErrorMessage(err.message || 'Failed to load torrent metadata. Check connection or peers.');
        }
      }
    }

    initTorrentFlow();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, torrentUrl, retryKey]);

  // Start Downloading File
  const startDownloading = (torrent: any, target: TorrentFileInfo) => {
    if (!torrent || !target) return;

    if (streamControllerRef.current) {
      streamControllerRef.current.stop();
      streamControllerRef.current = null;
    }

    setPhase('downloading');
    setIsPaused(false);

    const controller = startDownload(torrent, target.rawFile, {
      onProgress: (data) => {
        setProgressData(data);
      },
      onComplete: (blobUrl, filename) => {
        setCompletedBlobUrl(blobUrl);
        setPhase('completed');
        // Auto trigger download save dialog
        triggerBrowserSave(blobUrl, filename);
      },
      onError: (err) => {
        setPhase('error');
        setErrorMessage(err.message || 'Download encountered an unexpected error.');
      },
    });

    downloadControllerRef.current = controller;
  };

  // Start Streaming Media
  const startStreaming = (target: TorrentFileInfo) => {
    if (!target) return;

    if (downloadControllerRef.current) {
      downloadControllerRef.current.pause();
    }

    setPhase('streaming');
    setStreamError(null);
    setIsStreamingReady(false);

    // Wait for video element ref to bind
    setTimeout(() => {
      if (!videoRef.current) return;

      try {
        const streamCtrl = streamMedia(target.rawFile, videoRef.current, {
          autoplay: true,
          controls: true,
          onCanPlay: () => {
            setIsStreamingReady(true);
          },
          onError: (err) => {
            setStreamError(err.message);
          },
        });
        streamControllerRef.current = streamCtrl;
      } catch (err: any) {
        setStreamError(err.message || 'Unable to stream this media in HTML5 video.');
      }
    }, 100);
  };

  // Change selected file inside torrent
  const handleSelectFile = (file: TorrentFileInfo) => {
    setSelectedFile(file);
    setShowFilePicker(false);

    if (mode === 'stream') {
      startStreaming(file);
    } else if (torrentInstance) {
      startDownloading(torrentInstance, file);
    }
  };

  // Toggle Pause/Resume
  const handleTogglePause = () => {
    if (!downloadControllerRef.current) return;
    if (isPaused) {
      downloadControllerRef.current.resume();
      setIsPaused(false);
    } else {
      downloadControllerRef.current.pause();
      setIsPaused(true);
    }
  };

  // Manual Trigger Save
  const handleSaveFile = () => {
    if (completedBlobUrl && selectedFile) {
      triggerBrowserSave(completedBlobUrl, selectedFile.name);
    } else if (downloadControllerRef.current) {
      downloadControllerRef.current.saveFile();
    }
  };

  // Switch between Download and Stream modes
  const handleSwitchMode = (newMode: 'download' | 'stream') => {
    setMode(newMode);
    if (!selectedFile) return;

    if (newMode === 'stream') {
      startStreaming(selectedFile);
    } else if (torrentInstance) {
      startDownloading(torrentInstance, selectedFile);
    }
  };

  if (!isOpen) return null;

  const currentFilename = selectedFile?.name || preferredFilename || `${media?.title || 'Media'}.mp4`;
  const extension = currentFilename.substring(currentFilename.lastIndexOf('.')).toUpperCase();
  const isPlayable = isBrowserPlayable(currentFilename);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-full max-w-2xl bg-[#141414] border border-[#2b2b2b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#242424] bg-[#1a1a1a]/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#E50914]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white truncate">
                  {media?.title || 'WebTorrent Direct Media'}
                </h3>
                <p className="text-xs text-[#8E8E93] truncate font-mono">{currentFilename}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mode Toggle Button */}
              {phase !== 'loading_metadata' && phase !== 'initializing' && phase !== 'error' && (
                <div className="flex items-center bg-[#242424] p-0.5 rounded-lg border border-[#333]">
                  <button
                    onClick={() => handleSwitchMode('download')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      mode === 'download'
                        ? 'bg-[#E50914] text-white shadow-sm'
                        : 'text-[#B3B3B3] hover:text-white'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => handleSwitchMode('stream')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      mode === 'stream'
                        ? 'bg-[#E50914] text-white shadow-sm'
                        : 'text-[#B3B3B3] hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Stream
                  </button>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-[#242424] hover:bg-[#333] text-[#B3B3B3] hover:text-white flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* 1. Loading Metadata Phase */}
            {(phase === 'loading_metadata' || phase === 'initializing') && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full border-4 border-[#333] border-t-[#E50914] animate-spin flex items-center justify-center" />
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-base font-semibold text-white">Reading Torrent Metadata...</h4>
                  <p className="text-xs text-[#E50914] font-medium font-mono animate-pulse">
                    {loadingStep}
                  </p>
                  <p className="text-[11px] text-[#8E8E93]">
                    Connecting directly in browser memory without intermediate proxy servers.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-1.5 rounded-lg bg-[#242424] hover:bg-[#333] text-xs text-[#B3B3B3] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 2. Error Phase */}
            {phase === 'error' && (
              <div className="p-5 rounded-xl bg-red-950/30 border border-red-800/40 text-left space-y-3">
                <div className="flex items-center gap-2.5 text-red-400 font-medium text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Torrent Operation Notice</span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed">{errorMessage}</p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setRetryKey((k) => k + 1);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#242424] hover:bg-[#333] text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Connection
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold bg-transparent hover:bg-white/5 text-[#B3B3B3] rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* 3. Streaming View */}
            {mode === 'stream' && phase !== 'loading_metadata' && phase !== 'initializing' && phase !== 'error' && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#242424] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    playsInline
                  />

                  {!isStreamingReady && !streamError && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center space-y-3 p-4">
                      <div className="w-10 h-10 border-3 border-[#333] border-t-[#E50914] rounded-full animate-spin" />
                      <p className="text-xs text-[#B3B3B3]">Buffering torrent chunks into HTML5 video...</p>
                    </div>
                  )}

                  {streamError && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-3 p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                      <p className="text-xs text-amber-200/90 max-w-md">{streamError}</p>
                      <button
                        onClick={() => handleSwitchMode('download')}
                        className="px-4 py-2 text-xs font-semibold bg-[#E50914] text-white rounded-lg hover:bg-[#f40612] transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        Switch to Direct Download
                      </button>
                    </div>
                  )}
                </div>

                {!isPlayable && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Notice: {extension} video formats may require downloading if your browser lacks native decoder
                      support.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Download Progress Card View */}
            {mode === 'download' && phase !== 'loading_metadata' && phase !== 'initializing' && phase !== 'error' && (
              <div className="space-y-5">
                {/* File Info Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#242424] border border-[#333] flex items-center justify-center text-white">
                      <FileVideo className="w-5 h-5 text-[#E50914]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{selectedFile?.name}</span>
                        <span className="text-[10px] font-mono uppercase bg-[#242424] text-[#B3B3B3] px-1.5 py-0.5 rounded border border-[#333]">
                          {extension}
                        </span>
                      </div>
                      <div className="text-xs text-[#8E8E93]">
                        {progressData?.totalFormatted || selectedFile?.lengthFormatted}
                      </div>
                    </div>
                  </div>

                  {filesList.length > 1 && (
                    <button
                      onClick={() => setShowFilePicker(!showFilePicker)}
                      className="px-3 py-1.5 text-xs bg-[#242424] hover:bg-[#2e2e2e] text-[#B3B3B3] hover:text-white rounded-lg border border-[#333] transition-colors flex items-center gap-1.5"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      {showFilePicker ? 'Hide Files' : `All Files (${filesList.length})`}
                    </button>
                  )}
                </div>

                {/* File Picker Dropdown */}
                {showFilePicker && (
                  <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#2b2b2b] max-h-48 overflow-y-auto space-y-1.5">
                    <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2">
                      Choose File to Download:
                    </p>
                    {filesList.map((file) => {
                      const isCur = selectedFile?.index === file.index;
                      return (
                        <div
                          key={file.index}
                          onClick={() => handleSelectFile(file)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isCur
                              ? 'bg-[#E50914]/15 border border-[#E50914]/40 text-white'
                              : 'hover:bg-[#252525] text-[#B3B3B3]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {file.isMedia ? (
                              <FileVideo className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                            ) : (
                              <HardDrive className="w-3.5 h-3.5 text-[#888] flex-shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
                            <span>{file.lengthFormatted}</span>
                            {isCur && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Progress Bar Container */}
                <div className="space-y-2 bg-[#1a1a1a] p-4 rounded-xl border border-[#282828]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {phase === 'completed'
                        ? '100% Downloaded'
                        : isPaused
                        ? 'Download Paused'
                        : progressData?.progressPercent || '0%'}
                    </span>
                    <span className="text-[#8E8E93]">
                      {progressData?.downloadedFormatted || '0 B'} /{' '}
                      {progressData?.totalFormatted || selectedFile?.lengthFormatted}
                    </span>
                  </div>

                  <div className="h-3 w-full bg-[#262626] rounded-full overflow-hidden p-0.5 border border-[#333]">
                    <div
                      className="h-full bg-gradient-to-r from-[#E50914] to-[#f40612] rounded-full transition-all duration-300"
                      style={{
                        width: phase === 'completed' ? '100%' : `${(progressData?.progress || 0) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Real-time metrics grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#262626] text-xs">
                    <div className="flex items-center gap-1.5 text-[#B3B3B3]">
                      <Gauge className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>{progressData?.speedFormatted || '0 B/s'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#B3B3B3] justify-center">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{progressData?.peers || 0} Peers</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#B3B3B3] justify-end">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{phase === 'completed' ? 'Finished' : progressData?.eta || 'Searching...'}</span>
                    </div>
                  </div>
                </div>

                {/* Waiting for Peers Banner */}
                {phase === 'downloading' && progressData && progressData.peers === 0 && progressData.downloaded === 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Waiting for peers...</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      The torrent is attempting to discover compatible WebTorrent/WebRTC peers. Browser WebTorrent
                      requires peers with WebRTC support or Web Seeds.
                    </p>
                  </div>
                )}

                {/* Completed Banner */}
                {phase === 'completed' && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-emerald-300 text-xs font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white">✓ Download ready</div>
                        <div className="text-[11px] text-emerald-200/80">
                          {selectedFile?.name} has been processed directly in your browser.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveFile}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Save {extension}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-[#242424] bg-[#1a1a1a]/60 flex items-center justify-between">
            <div className="text-xs text-[#8E8E93] hidden sm:block">
              100% Client-Side WebTorrent (No Server Needed)
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {phase === 'downloading' && (
                <button
                  onClick={handleTogglePause}
                  className="px-4 py-2 rounded-lg bg-[#242424] hover:bg-[#2f2f2f] text-white text-xs font-medium border border-[#383838] transition-colors flex items-center gap-1.5"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              )}

              {phase === 'completed' && (
                <button
                  onClick={handleSaveFile}
                  className="px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#f40612] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-[#E50914]/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save {extension}
                </button>
              )}

              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/5 text-[#B3B3B3] hover:text-white text-xs font-medium transition-colors"
              >
                {phase === 'completed' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
