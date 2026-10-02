import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white mb-6 py-1 px-3 rounded-lg bg-surface border border-surface-border"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
      <div className="bg-surface border border-surface-border rounded-2xl p-6 sm:p-10 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          VidFast places user privacy first. We do not track personal identifying information, sell user data to advertising exchanges, or inject tracking pixels into video streams.
        </p>
        <h2 className="text-lg font-bold text-white">Local Storage</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Your watch history, saved watchlist items, and player preferences are stored entirely in your local browser storage (LocalStorage) and are never uploaded to remote tracking databases.
        </p>
      </div>
    </div>
  );
}
