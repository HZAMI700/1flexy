'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Download,
  Copy,
  Check,
  HardDrive,
  Gauge,
  Film,
  Tv,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Server,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { FaselHd } from '@/services/faselhd';
import { DownloadLink } from '@/types';

export const DownloadModal: React.FC = () => {
  const { downloadModal, closeDownload } = useAppStore();
  const { isOpen, media, season, episode } = downloadModal;

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<DownloadLink[]>([]);
  const [providerName, setProviderName] = useState<string>('FaselHD API');
  const [selectedQuality, setSelectedQuality] = useState<string>('All');
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchLinks = () => {
    if (!isOpen || !media) return;
    setLoading(true);

    FaselHd.getDownloadResult({
      tmdbId: media.tmdb_id || media.id,
      type: media.media_type,
      season,
      episode,
      title: media.title,
    })
      .then((res) => {
        setProviderName(res.providerName);
        setLinks(res.links);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load download links:', err);
        setLoading(false);
      });
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
      onClick={closeDownload}
    >
      <div
        className="bg-surface-dark border border-surface-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/20 text-accent">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-display">
                  Download Manager
                </h3>
                {/* Active Provider Badge */}
                {!loading && links.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/20 text-accent border border-primary/40 flex items-center gap-1">
                    <Server className="w-3 h-3" /> {providerName}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                Multi-provider direct download engine with automated fallback
              </p>
            </div>
          </div>
          <button
            onClick={closeDownload}
            aria-label="Close"
            className="p-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Card */}
        <div className="px-6 py-3.5 bg-surface/50 border-b border-surface-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-16 rounded-md overflow-hidden flex-shrink-0 bg-surface-dark border border-surface-border">
              {media.poster_path ? (
                <Image
                  src={media.poster_path}
                  alt={media.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted">
                  N/A
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-white text-sm line-clamp-1">
                {media.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="capitalize">{media.media_type}</span>
                {season && episode && (
                  <span className="text-accent font-semibold">
                    • S{season} : E{episode}
                  </span>
                )}
                <span>•</span>
                <span className="text-primary flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3 h-3" /> Clean Mirror
                </span>
              </div>
            </div>
          </div>

          {/* Subtitles Toggle */}
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none bg-surface-dark px-3 py-1.5 rounded-lg border border-surface-border hover:border-primary/50">
            <input
              type="checkbox"
              checked={includeSubtitles}
              onChange={(e) => setIncludeSubtitles(e.target.checked)}
              className="accent-primary rounded cursor-pointer"
            />
            <span className="flex items-center gap-1 font-medium">
              <FileText className="w-3.5 h-3.5 text-accent" />
              With Subtitles (SRT/VTT)
            </span>
          </label>
        </div>

        {/* Quality Tabs */}
        <div className="px-6 py-2 bg-surface/30 border-b border-surface-border flex items-center gap-1.5 overflow-x-auto">
          {['All', '4K', '1080p', '720p', '480p'].map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuality(q)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedQuality === q
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-surface text-text-muted hover:text-white border border-surface-border'
              }`}
            >
              {q === 'All' ? 'All Qualities' : q}
            </button>
          ))}
        </div>

        {/* Links List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-3 text-text-muted">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">
                Querying download providers (FaselHD → EgyBest → ArabSeed → MovieBox)...
              </p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-text-muted text-sm">
                No matching download links found for the selected quality filter.
              </p>
              <button
                onClick={fetchLinks}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-glow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Providers
              </button>
            </div>
          ) : (
            filteredLinks.map((link, idx) => (
              <div
                key={idx}
                className="bg-surface hover:bg-surface-light border border-surface-border rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Quality, Size, Format */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-black tracking-wide ${
                        link.quality.includes('4K')
                          ? 'bg-purple-600 text-white'
                          : link.quality.includes('1080p')
                          ? 'bg-primary text-white'
                          : 'bg-surface-light text-text-secondary border border-surface-border'
                      }`}
                    >
                      {link.quality}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {link.format}
                    </span>
                    {includeSubtitles && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        +Subs
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1 font-mono text-text-secondary">
                      <HardDrive className="w-3.5 h-3.5 text-text-muted" />
                      {link.size}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[11px] text-accent">
                      <Gauge className="w-3.5 h-3.5" />
                      {link.speed}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-text-muted truncate max-w-[150px]">
                      {link.server}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Copy Link */}
                  <button
                    onClick={() => handleCopy(link.url, idx)}
                    className="p-2 rounded-lg bg-surface-dark hover:bg-surface-border border border-surface-border text-text-secondary hover:text-white transition-colors"
                    title="Copy direct download link"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Direct Download */}
                  <a
                    href={link.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-glow hover:scale-105"
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
        <div className="px-6 py-3 bg-surface border-t border-surface-border text-xs text-text-muted flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-accent text-[11px]">
            <span>Fallback order: FaselHD → EgyBest → ArabSeed → MovieBox → VibraVid → vidsrc → Torrent → Nullbr</span>
          </div>
          <span className="text-primary font-medium text-[11px]">Resumable SSL</span>
        </div>
      </div>
    </div>
  );
};
