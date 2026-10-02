'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Play,
  Search,
  Bookmark,
  Shield,
  ShieldCheck,
  Menu,
  X,
  Film,
  Tv,
  Flame,
  Layers,
  Heart,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AdBlocker } from '@/lib/adblocker';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shieldDropdownOpen, setShieldDropdownOpen] = useState(false);

  const {
    favorites,
    watchlist,
    setIsSearchOpen,
    adBlockStats,
    setAdBlockStats,
    toggleAdBlock,
  } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subscribe to adblock stats
  useEffect(() => {
    const unsub = AdBlocker.subscribe((stats) => {
      setAdBlockStats(stats);
    });
    return unsub;
  }, [setAdBlockStats]);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const navLinks = [
    { name: 'Home', href: '/', icon: Film },
    { name: 'Movies', href: '/search?type=movie', icon: Film },
    { name: 'TV Shows', href: '/search?type=tv', icon: Tv },
    { name: 'Trending', href: '/search?sort=trending', icon: Flame },
    { name: 'Genres', href: '/genre/action', icon: Layers },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark, badge: watchlist.length },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-lg border-b border-surface-border/50 py-3'
            : 'bg-gradient-to-b from-background/90 via-background/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-hover flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1 font-display">
                VID<span className="text-primary font-black">FAST</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted -mt-1">
                Streaming HD
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href.split('?')[0]);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white bg-surface-light/80 shadow-sm border border-surface-border/60'
                      : 'text-text-secondary hover:text-white hover:bg-surface/60'
                  }`}
                >
                  <link.icon className="w-4 h-4 opacity-70" />
                  {link.name}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold bg-primary text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full shadow-glow" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Search, AdBlocker Shield, Profile */}
          <div className="flex items-center gap-3">
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className="flex items-center gap-2 bg-surface/80 hover:bg-surface-light border border-surface-border text-text-secondary hover:text-white px-3 py-1.5 rounded-lg text-sm transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <Search className="w-4 h-4 text-text-muted" />
              <span className="hidden sm:inline text-xs text-text-muted">Search titles...</span>
              <kbd className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 bg-surface-dark border border-surface-border rounded text-text-muted">
                ⌘K
              </kbd>
            </button>

            {/* AdBlocker Shield Badge & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShieldDropdownOpen(!shieldDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  adBlockStats.enabled
                    ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
                    : 'bg-surface border-surface-border text-text-muted hover:text-white'
                }`}
                title="VidFast AdBlocker Shield"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Shield</span>
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-[11px] text-accent">
                  {adBlockStats.totalBlocked}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {shieldDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl bg-surface border border-surface-border shadow-2xl p-4 z-50 text-xs text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-bold">VidFast AdShield</div>
                        <div className="text-[10px] text-text-muted">Zero Pop-unders Active</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !adBlockStats.enabled;
                        AdBlocker.toggle(next);
                        toggleAdBlock(next);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        adBlockStats.enabled
                          ? 'bg-primary text-white'
                          : 'bg-surface-light text-text-muted'
                      }`}
                    >
                      {adBlockStats.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-text-secondary text-[11px]">
                    <div className="flex justify-between">
                      <span>Pop-unders intercepted:</span>
                      <span className="text-white font-mono font-bold">
                        {adBlockStats.blockedPopups}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ad domain calls blocked:</span>
                      <span className="text-white font-mono font-bold">
                        {adBlockStats.blockedRequests}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overlay scripts removed:</span>
                      <span className="text-white font-mono font-bold">
                        {adBlockStats.blockedElements}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-border text-[10px] text-text-muted">
                    Engine: Override `window.open` + Network filter + MutationObserver
                  </div>
                </div>
              )}
            </div>

            {/* Watchlist Quick Icon (Mobile) */}
            <Link
              href="/watchlist"
              aria-label="Favorites & Watchlist"
              className="relative p-2 rounded-lg bg-surface/60 hover:bg-surface-light border border-surface-border text-text-secondary hover:text-white md:hidden"
            >
              <Heart className="w-4 h-4" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              className="p-2 rounded-lg bg-surface/60 hover:bg-surface-light border border-surface-border text-text-secondary hover:text-white md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-dark/95 backdrop-blur-xl border-b border-surface-border px-4 py-4 space-y-2 animate-fadeIn">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-white hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-surface-dark text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
};
