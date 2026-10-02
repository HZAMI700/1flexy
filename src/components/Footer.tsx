import React from 'react';
import Link from 'next/link';
import { Play, Shield, Heart, Film, Tv, Github, Twitter, Send } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-dark border-t border-surface-border text-text-secondary text-sm mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent-hover flex items-center justify-center shadow-glow">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
              <span className="text-xl font-black text-white font-display">
                VID<span className="text-primary">FAST</span>
              </span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed">
              Your next-generation streaming destination inspired by VidFast & 1Flex. Stream movies and TV shows in 4K & Full HD with zero pop-up advertisements.
            </p>
            <div className="flex items-center gap-3 text-text-muted">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors p-2 rounded-lg bg-surface border border-surface-border"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors p-2 rounded-lg bg-surface border border-surface-border"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors p-2 rounded-lg bg-surface border border-surface-border"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search?type=movie" className="hover:text-white transition-colors">
                  Movies
                </Link>
              </li>
              <li>
                <Link href="/search?type=tv" className="hover:text-white transition-colors">
                  TV Shows
                </Link>
              </li>
              <li>
                <Link href="/search?sort=trending" className="hover:text-white transition-colors">
                  Trending Media
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="hover:text-white transition-colors">
                  My Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Popular Genres
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/genre/action" className="hover:text-white transition-colors">
                  Action & Adventure
                </Link>
              </li>
              <li>
                <Link href="/genre/sci-fi" className="hover:text-white transition-colors">
                  Sci-Fi & Cyberpunk
                </Link>
              </li>
              <li>
                <Link href="/genre/animation" className="hover:text-white transition-colors">
                  Animation & Anime
                </Link>
              </li>
              <li>
                <Link href="/genre/drama" className="hover:text-white transition-colors">
                  Drama & Thriller
                </Link>
              </li>
              <li>
                <Link href="/genre/comedy" className="hover:text-white transition-colors">
                  Comedy & Romance
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Privacy */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Features & Tech
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-accent">
                <Shield className="w-3.5 h-3.5" />
                <span>Integrated Pop-Under Shield</span>
              </li>
              <li>
                <span className="text-text-muted">VidFast Embed Player 2.0</span>
              </li>
              <li>
                <span className="text-text-muted">Fasel HD Direct High-Speed DL</span>
              </li>
              <li>
                <span className="text-text-muted">PWA Ready & Offline Sync</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer / DMCA */}
        <div className="pt-8 border-t border-surface-border text-xs text-text-muted space-y-2">
          <p>
            <strong>Disclaimer:</strong> VidFast does not host any files on its servers. All video media is provided by non-affiliated third-party APIs and content distribution networks (such as VidFast.vc). This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-2">
            <span>© {new Date().getFullYear()} VidFast Platform. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/dmca" className="hover:text-white transition-colors">
                DMCA Compliance
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
