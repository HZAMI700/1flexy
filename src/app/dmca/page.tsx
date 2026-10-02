import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white mb-6 py-1 px-3 rounded-lg bg-surface border border-surface-border"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
      <div className="bg-surface border border-surface-border rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3 text-primary">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            DMCA & Copyright Policy
          </h1>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          VidFast operates as an index and discovery interface for media metadata. VidFast does not host, store, or transmit any video files, media streams, or digital copyright assets on its servers.
        </p>
        <h2 className="text-lg font-bold text-white">Third-Party Embedding</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          All video streams and media embeds displayed on VidFast are served from independent third-party hosts (including VidFast.vc, external CDN nodes, and user-submitted streams). VidFast is not responsible for the content hosted on external domains.
        </p>
        <h2 className="text-lg font-bold text-white">Notice & Takedown</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          If you are a copyright owner or an authorized agent and believe that content accessible through our platform infringes your copyright, please submit a formal notification with the exact URL and proof of ownership to our compliance inbox.
        </p>
      </div>
    </div>
  );
}
