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
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { FaselHd } from '@/services/faselhd';
import { DownloadLink } from '@/types';

export const DownloadModal: React.FC = () => {
  const { downloadModal, closeDownload } = useAppStore();
  const { isOpen, media, season, episode } = downloadModal;

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<DownloadLink[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && media) {
      setLoading(true);
      FaselHd.getDownloadLinks({
        tmdbId: media.tmdb_id || media.id,
        type: media.media_type,
        season,
        episode,
        title: media.title,
      })
        .then((data) => {
          if (isMounted) {
            setLinks(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load Fasel HD links:', err);
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, media, season, episode]);

  if (!isOpen || !media) return null;

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

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
              <h3 className="font-bold text-white text-base font-display">
                Fasel HD High-Speed Downloader
              </h3>
              <p className="text-xs text-text-muted">
                Direct CDN mirrors with multi-stream resume support
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
        <div className="px-6 py-4 bg-surface/50 border-b border-surface-border flex items-center gap-4">
          <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-dark border border-surface-border">
            {media.poster_path ? (
              <Image
                src={media.poster_path}
                alt={media.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
                No poster
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm line-clamp-1">
              {media.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="capitalize">{media.media_type}</span>
              {season && episode && (
                <span className="text-accent font-semibold">
                  Season {season} • Episode {episode}
                </span>
              )}
              <span>•</span>
              <span className="text-primary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Ad-Free Direct
              </span>
            </div>
            <p className="text-[11px] text-text-secondary line-clamp-1">
              Powered by FaselHD Enterprise Network & High-speed Akamai Edge
            </p>
          </div>
        </div>

        {/* Links List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-muted">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">
                Resolving fastest Fasel HD mirror servers...
              </p>
            </div>
          ) : links.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">
              No download mirrors found at this moment. Please check back shortly.
            </div>
          ) : (
            links.map((link, idx) => (
              <div
                key={idx}
                className="bg-surface hover:bg-surface-light border border-surface-border rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Quality, Size, Format */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-black tracking-wide ${
                        link.quality === '4K UHD'
                          ? 'bg-purple-600 text-white'
                          : link.quality === '1080p'
                          ? 'bg-primary text-white'
                          : 'bg-surface-light text-text-secondary border border-surface-border'
                      }`}
                    >
                      {link.quality}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {link.format}
                    </span>
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
          <span>Speed capped at 1 Gbps per IP</span>
          <span className="text-primary font-medium">SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};
