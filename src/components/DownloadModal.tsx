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
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DownloadLinkItem, DownloadResponsePayload } from '@/services/downloadProviders';
import { getPosterWithFallback, generateSvgPlaceholder } from '@/lib/poster-resolver';

const PROVIDER_NAMES = [
  'HDHub Bypass API',
  'LestResolver (vidsrc)',
  'CinePro Backend',
  'VidFetch Parser',
  'ScarperApi (NetMirror)',
  'FaselHD API (Enhanced)',
  'Nullbr Resource SDK',
];

export const DownloadModal: React.FC = () => {
  const { downloadModal, closeDownload } = useAppStore();
  const { isOpen, media, season, episode } = downloadModal;

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<DownloadLinkItem[]>([]);
  const [providerName, setProviderName] = useState<string>('HDHub Bypass API');
  const [selectedQuality, setSelectedQuality] = useState<string>('All');
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeCyclingIndex, setActiveCyclingIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cycle provider names during loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setActiveCyclingIndex((prev) => (prev + 1) % PROVIDER_NAMES.length);
    }, 600);
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
          setProviderName(data.provider || 'HDHub Bypass API');
          setLinks(data.links);
          setLoading(false);
          return;
        }
      }
      throw new Error('No links returned from providers');
    } catch (err: any) {
      console.warn('Download resolver error, retrying fallback:', err);
      // Client-side emergency fallback
      try {
        const getRes = await fetch(
          `/api/download?tmdb_id=${media.id}&type=${media.media_type}&title=${encodeURIComponent(
            media.title
          )}`
        );
        if (getRes.ok) {
          const fallbackData = await getRes.json();
          if (fallbackData.links && fallbackData.links.length > 0) {
            setProviderName(fallbackData.provider || 'HDHub Bypass API');
            setLinks(fallbackData.links);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through
      }
      setErrorMessage('Unable to retrieve download links at this moment.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && media) {
      fetchLinks();
    }
  }, [isOpen, media, season, episode]);

  if (!isOpen || !media) return null;

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const filteredLinks =
    selectedQuality === 'All'
      ? links
      : links.filter((l) => l.quality.toLowerCase().includes(selectedQuality.toLowerCase()));

  const posterImg = getPosterWithFallback(media);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        onClick={closeDownload}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-[#181818] border border-[#282828] rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#282828] bg-[#141414]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#E50914]/20 text-[#E50914]">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base font-display">
                    Download Manager
                  </h3>
                  {!loading && links.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/30 flex items-center gap-1">
                      <Server className="w-3 h-3" /> {providerName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#808080]">
                  Multi-provider direct download engine with automated fallback & validation
                </p>
              </div>
            </div>
            <button
              onClick={closeDownload}
              aria-label="Close"
              className="p-1.5 rounded bg-[#242424] hover:bg-[#333333] text-[#808080] hover:text-white transition-colors border border-[#383838]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Preview Header */}
          <div className="px-6 py-3.5 bg-[#141414]/60 border-b border-[#282828] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-black border border-[#282828]">
                <Image
                  src={posterImg}
                  alt={media.title}
                  fill
                  className="object-cover"
                  unoptimized={posterImg.startsWith('data:')}
                />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-white text-sm line-clamp-1">
                  {media.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#808080]">
                  <span className="capitalize">{media.media_type}</span>
                  {season && episode && (
                    <span className="text-[#E50914] font-semibold">
                      • S{season} : E{episode}
                    </span>
                  )}
                  <span>•</span>
                  <span className="text-[#46D369] flex items-center gap-1 text-[11px] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> High-Speed Mirror
                  </span>
                </div>
              </div>
            </div>

            {/* Subtitles Toggle */}
            <label className="flex items-center gap-2 text-xs text-[#B3B3B3] cursor-pointer select-none bg-[#242424] px-3 py-1.5 rounded border border-[#383838] hover:border-white/40 transition-colors">
              <input
                type="checkbox"
                checked={includeSubtitles}
                onChange={(e) => setIncludeSubtitles(e.target.checked)}
                className="accent-[#E50914] rounded cursor-pointer"
              />
              <span className="flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-[#E50914]" />
                Include Subtitles (.SRT)
              </span>
            </label>
          </div>

          {/* Quality Filter Tabs */}
          <div className="px-6 py-2.5 bg-[#181818] border-b border-[#282828] flex items-center gap-2 overflow-x-auto">
            {['All', '4K UHD', '1080p', '720p', '480p'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  selectedQuality === q
                    ? 'bg-[#E50914] text-white shadow'
                    : 'bg-[#242424] text-[#808080] hover:text-white border border-[#383838]'
                }`}
              >
                {q === 'All' ? 'All Qualities' : q}
              </button>
            ))}
          </div>

          {/* Links List / States */}
          <div className="p-6 overflow-y-auto space-y-3 flex-grow">
            {/* Loading State: Spinning loader with cycling provider names */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#808080]">
                <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white">
                    Resolving download links...
                  </p>
                  <p className="text-xs text-[#B3B3B3]">
                    Checking provider:{' '}
                    <span className="text-[#E50914] font-mono font-bold">
                      {PROVIDER_NAMES[activeCyclingIndex]}
                    </span>
                  </p>
                </div>
              </div>
            ) : errorMessage || filteredLinks.length === 0 ? (
              /* Error / Empty State */
              <div className="py-14 text-center space-y-3">
                <p className="text-[#B3B3B3] text-sm">
                  {errorMessage || 'No matching download links found for the selected quality.'}
                </p>
                <button
                  onClick={fetchLinks}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#E50914] text-white text-xs font-bold hover:bg-[#F40612] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Providers
                </button>
              </div>
            ) : (
              /* Success Links List */
              filteredLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="bg-[#202020] hover:bg-[#252525] border border-[#2f2f2f] rounded p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Quality, Size, Host, Validation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-black tracking-wide ${
                          link.quality.includes('4K')
                            ? 'bg-purple-700 text-white'
                            : link.quality.includes('1080p')
                            ? 'bg-[#E50914] text-white'
                            : 'bg-[#303030] text-[#B3B3B3] border border-[#404040]'
                        }`}
                      >
                        {link.quality}
                      </span>
                      <span className="text-xs font-bold text-white uppercase font-mono">
                        {link.format}
                      </span>
                      {link.validated && (
                        <span className="px-1.5 py-0.2 rounded bg-[#46D369]/15 text-[#46D369] text-[10px] font-bold border border-[#46D369]/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Validated
                        </span>
                      )}
                      {includeSubtitles && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          +Subs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#808080]">
                      <span className="flex items-center gap-1 font-mono text-white">
                        <HardDrive className="w-3.5 h-3.5 text-[#808080]" />
                        {link.size}
                      </span>
                      <span>•</span>
                      {link.speed && (
                        <>
                          <span className="flex items-center gap-1 text-[11px] text-[#46D369]">
                            <Gauge className="w-3.5 h-3.5" />
                            {link.speed}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="text-[11px] text-[#808080] truncate max-w-[180px]">
                        {link.host}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopy(link.url, idx)}
                      className="p-2 rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#383838] text-[#B3B3B3] hover:text-white transition-colors"
                      title="Copy download URL"
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
                      rel="noreferrer"
                      className="p-2 rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#383838] text-[#B3B3B3] hover:text-white transition-colors"
                      title="Open direct link in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Direct Download Button */}
                    <a
                      href={link.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold transition-all shadow hover:scale-105"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="px-6 py-3 bg-[#141414] border-t border-[#282828] text-xs text-[#808080] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Fallback: HDHub → LestResolver → CinePro → VidFetch → ScarperApi → FaselHD → Nullbr</span>
            </div>
            <span className="text-[#46D369] font-medium text-[11px]">Resumable SSL</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
