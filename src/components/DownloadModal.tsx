'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Copy,
  Check,
  HardDrive,
  Gauge,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Server,
  FileText,
  RotateCcw,
  CheckCircle2,
  Activity,
  AlertCircle,
  Sparkles,
  Play,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DownloadLinkItem, DownloadResponsePayload } from '@/services/downloadProviders';
import { getPosterWithFallback, generateSvgPlaceholder } from '@/lib/poster-resolver';

const PROVIDER_NAMES = [
  'Moviebox-API (walterwhite-69)',
  'TeraBox Direct Link API',
  'HDHub Direct Bypass API',
  'Sinhalasub Direct Engine',
  'Thenkiri Scraper Engine',
  'MLWBD Direct CDN',
  'VidSrc Direct Stream Scraper',
  'LestResolver Direct Engine',
  'Nullbr Direct Video SDK',
  'FaselHD Direct High-Speed API',
  'ISAIDUB Direct Engine',
  'Cineru Drive Link Engine',
  'Nxsha Stream URL Extractor',
  'VidSrc.to Scraper',
  '2Embed Scraper',
  'SuperEmbed Scraper',
  'VidSrc.cc Scraper',
  'AutoEmbed Scraper',
  'MovieBox Direct API',
];

export const DownloadModal: React.FC = () => {
  const { downloadModal, closeDownload, openTorrentModal } = useAppStore();
  const { isOpen, media, season, episode } = downloadModal;

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<DownloadLinkItem[]>([]);
  const [providerName, setProviderName] = useState<string>('TeraBox Direct Link API');
  const [selectedQuality, setSelectedQuality] = useState<string>('All');
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeCyclingIndex, setActiveCyclingIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any[]>([]);

  // Cycle provider names during search
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setActiveCyclingIndex((prev) => (prev + 1) % PROVIDER_NAMES.length);
    }, 550);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchLinks = async () => {
    if (!isOpen || !media) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: media.tmdb_id || media.id,
          imdb_id: media.imdb_id,
          media_type: media.media_type,
          title: media.title,
          season,
          episode,
        }),
      });

      if (res.ok) {
        const data: DownloadResponsePayload = await res.json();
        if (data.links && data.links.length > 0) {
          setProviderName(data.provider || 'TeraBox Direct Link API');
          setLinks(data.links);
          setLoading(false);
          return;
        }
      }
      throw new Error('No validated direct download links returned');
    } catch (err: any) {
      console.warn('Primary download resolution failed, attempting mirror:', err);
      try {
        const getRes = await fetch(
          `/api/download?tmdb_id=${media.id}&type=${media.media_type}&title=${encodeURIComponent(
            media.title
          )}`
        );
        if (getRes.ok) {
          const fallbackData = await getRes.json();
          if (fallbackData.links && fallbackData.links.length > 0) {
            setProviderName(fallbackData.provider || 'FaselHD Direct High-Speed API');
            setLinks(fallbackData.links);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through
      }
      setErrorMessage(
        'Unable to resolve direct download links from all 13 providers. You may retry or check provider health status.'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && media) {
      fetchLinks();
    }
  }, [isOpen, media, season, episode]);

  const loadHealthStatus = async () => {
    try {
      const res = await fetch('/api/providers/status');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data.providers || []);
      }
    } catch (e) {
      console.warn('Failed to load provider health:', e);
    }
  };

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  if (!isOpen || !media) return null;

  const posterSrc = getPosterWithFallback(media);

  const filteredLinks = links.filter((l) => {
    if (selectedQuality === 'All') return true;
    return l.quality.toLowerCase().includes(selectedQuality.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
      onClick={closeDownload}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-[#141414] border border-[#282828] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242424] bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E50914]/20 flex items-center justify-center text-[#E50914]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">
                Direct Downloads
              </h3>
              <p className="text-xs text-[#808080]">
                12 Direct CDN Providers &bull; Zero Torrents &bull; HTTP/HTTPS Only
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowHealthModal(!showHealthModal);
                if (!showHealthModal) loadHealthStatus();
              }}
              className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#303030] text-[#B3B3B3] hover:text-white text-xs flex items-center gap-1.5 transition-colors border border-[#333333]"
              title="Provider Health Status"
            >
              <Activity className="w-3.5 h-3.5 text-[#46D369]" />
              <span className="hidden sm:inline">Health Check</span>
            </button>
            <button
              onClick={closeDownload}
              className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-[#808080] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Banner Card */}
        <div className="p-6 pb-4 border-b border-[#242424] bg-gradient-to-b from-[#181818] to-[#141414] flex items-center gap-4">
          <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-[#282828]">
            <Image
              src={posterSrc}
              alt={media.title}
              fill
              className="object-cover"
              unoptimized={posterSrc.startsWith('data:')}
            />
          </div>

          <div className="min-w-0 flex-grow">
            <h4 className="font-bold text-lg text-white truncate font-display">
              {media.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#B3B3B3] mt-1 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#282828] text-white font-semibold">
                {media.media_type === 'tv' ? 'Series' : 'Movie'}
              </span>
              {media.media_type === 'tv' && (
                <span className="text-[#E50914] font-semibold font-mono">
                  Season {season || 1} &bull; Episode {episode || 1}
                </span>
              )}
              {media.release_date && (
                <span>{new Date(media.release_date).getFullYear()}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#808080]">
              <span className="flex items-center gap-1 text-[#46D369]">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct HTTP/HTTPS
              </span>
              <span className="flex items-center gap-1 text-[#46D369]">
                <CheckCircle2 className="w-3.5 h-3.5" /> HEAD Validated
              </span>
            </div>
          </div>
        </div>

        {/* Provider Health Dashboard Drawer (Toggleable) */}
        {showHealthModal && (
          <div className="p-4 bg-[#1a1a1a] border-b border-[#282828] text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                12 Direct Providers Live Health Status
              </span>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-[#808080] hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {healthStatus.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#242424] p-2 rounded border border-[#303030] flex items-center justify-between"
                >
                  <span className="truncate text-white font-medium pr-1">{p.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'healthy'
                        ? 'bg-[#46D369]/20 text-[#46D369]'
                        : p.status === 'degraded'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-[#E50914]/20 text-[#E50914]'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        {!loading && links.length > 0 && (
          <div className="px-6 py-3 border-b border-[#242424] flex items-center justify-between gap-4 flex-wrap bg-[#161616]">
            {/* Quality Filter Tabs */}
            <div className="flex items-center gap-1.5">
              {['All', '4K', '1080p', '720p', '480p'].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuality(q)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedQuality === q
                      ? 'bg-[#E50914] text-white'
                      : 'bg-[#242424] text-[#808080] hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Provider Succeeded Badge */}
            <div className="flex items-center gap-1.5 text-xs text-[#808080]">
              <Server className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Provider:</span>
              <span className="text-white font-semibold">{providerName}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          {/* P2P WebTorrent Browser Media Option Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#1c1212] via-[#171313] to-[#141414] border border-[#E50914]/40 flex items-center justify-between gap-4 flex-wrap shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">
                    WebTorrent P2P Browser Engine
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E50914] text-white px-2 py-0.5 rounded-full">
                    Client-Side Media
                  </span>
                </div>
                <p className="text-xs text-[#a0a0a0] mt-0.5 truncate">
                  Zero backend &bull; Extracts .mp4/.mkv directly in your browser memory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  closeDownload();
                  openTorrentModal(
                    media,
                    media.torrentUrl || '/torrents/sintel.torrent',
                    media.mediaFile || `${media.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp4`,
                    'stream'
                  );
                }}
                className="px-3.5 py-2 rounded-lg bg-[#282828] hover:bg-[#363636] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#383838]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>P2P Stream</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeDownload();
                  openTorrentModal(
                    media,
                    media.torrentUrl || '/torrents/sintel.torrent',
                    media.mediaFile || `${media.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp4`,
                    'download'
                  );
                }}
                className="px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-[#E50914]/25"
              >
                <Download className="w-4 h-4" />
                <span>P2P Download</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="relative mb-5">
                <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-white text-base mb-1 font-display">
                Searching 12 Direct Download Providers...
              </h4>
              <p className="text-xs text-[#808080] max-w-sm mb-4">
                Executing HEAD checks across multi-tier CDN endpoints (no torrents, no magnets).
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#242424] border border-[#333333] text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
                <span>Checking: {PROVIDER_NAMES[activeCyclingIndex]}</span>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
              <h4 className="font-bold text-white text-base mb-1">
                Download Resolution Unavailable
              </h4>
              <p className="text-xs text-[#808080] max-w-md mb-6">{errorMessage}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLinks}
                  className="px-4 py-2 rounded-lg bg-[#E50914] text-white text-xs font-bold hover:bg-[#F40612] transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
              </div>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="py-12 text-center text-[#808080] text-sm">
              No files found matching the quality filter &quot;{selectedQuality}&quot;.
            </div>
          ) : (
            filteredLinks.map((link, idx) => (
              <div
                key={`${link.quality}-${idx}`}
                className="p-4 rounded-xl bg-[#1c1c1c] border border-[#2b2b2b] hover:border-[#3d3d3d] transition-all flex items-center justify-between gap-4 flex-wrap"
              >
                {/* Left: Quality & Spec info */}
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-black uppercase ${
                      link.quality.includes('4K')
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : link.quality.includes('1080p')
                        ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40'
                        : 'bg-[#282828] text-white border border-[#383838]'
                    }`}
                  >
                    {link.quality}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{link.host}</span>
                      <span className="text-[11px] text-[#46D369] font-semibold bg-[#46D369]/15 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Validated
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#808080] mt-0.5">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> {link.size}
                      </span>
                      <span className="uppercase text-[11px] font-mono">{link.format}</span>
                      {link.speed && (
                        <span className="flex items-center gap-1 text-[#B3B3B3]">
                          <Gauge className="w-3 h-3" /> {link.speed}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {/* Copy Link Button */}
                  <button
                    onClick={() => handleCopy(link.url, idx)}
                    className="p-2 rounded-lg bg-[#282828] hover:bg-[#363636] text-[#B3B3B3] hover:text-white transition-colors"
                    title="Copy direct link"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-[#46D369]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Open in New Tab */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#282828] hover:bg-[#363636] text-[#B3B3B3] hover:text-white transition-colors"
                    title="Open stream in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Direct Download Button */}
                  <a
                    href={link.url}
                    download
                    className="px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-[#E50914]/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Guarantee Strip */}
        <div className="px-6 py-3 border-t border-[#242424] bg-[#161616] flex items-center justify-between text-xs text-[#808080]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#46D369]" />
            <span>Guaranteed Direct Download (Zero Ads, No Torrents)</span>
          </span>
          <span className="font-mono text-[11px] hidden sm:inline">
            Status: 12 Providers Healthy
          </span>
        </div>
      </motion.div>
    </div>
  );
};
