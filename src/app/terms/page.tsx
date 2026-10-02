import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Welcome to VidFast. By accessing or using our streaming application and interfaces, you agree to comply with and be bound by these Terms of Service.
        </p>
        <h2 className="text-lg font-bold text-white">Acceptable Use</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          You agree to use our application for personal and informational entertainment discovery. You agree not to attempt to reverse engineer, disrupt our infrastructure, or bypass security features.
        </p>
      </div>
    </div>
  );
}
