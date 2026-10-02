'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  ShieldCheck,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AdBlocker } from '@/lib/adblocker';

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileBrowse, setShowMobileBrowse] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    activeProfile,
    watchlist,
    adBlockStats,
    setAdBlockStats,
    toggleAdBlock,
  } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsub = AdBlocker.subscribe((stats) => {
      setAdBlockStats(stats);
    });
    return unsub;
  }, [setAdBlockStats]);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'TV Shows', href: '/search?type=tv' },
    { name: 'Movies', href: '/search?type=movie' },
    { name: 'New & Popular', href: '/search?sort=trending' },
    { name: 'My List', href: '/my-list' },
    { name: 'Browse by Languages', href: '/genre/action' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[68px] px-[4%] flex items-center justify-between transition-colors duration-300 ${
        isScrolled
          ? 'bg-[#141414] shadow-md'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      {/* Left: Netflix Logo & Nav Links */}
      <div className="flex items-center gap-6 lg:gap-10">
        <Link href="/" className="flex items-center select-none group">
          <span className="text-2xl sm:text-3xl font-black tracking-wider text-[#E50914] font-display hover:scale-105 transition-transform duration-200">
            NETFLIX
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href.split('?')[0]);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors duration-200 ${
                  isActive
                    ? 'font-bold text-white'
                    : 'text-[#B3B3B3] hover:text-[#E5E5E5]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Browse Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowMobileBrowse(!showMobileBrowse)}
            className="flex items-center gap-1 text-xs font-semibold text-white py-1"
          >
            <span>Browse</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showMobileBrowse && (
            <div
              className="absolute left-0 mt-2 w-48 rounded bg-[#141414]/95 border border-[#282828] py-2 shadow-2xl z-50 animate-fadeIn"
              onClick={() => setShowMobileBrowse(false)}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-2 text-xs text-[#B3B3B3] hover:text-white hover:bg-[#1F1F1F] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Search, Notifications, Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Search Bar / Expanding Search */}
        <div className="relative flex items-center">
          {isSearchActive ? (
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-black/90 border border-white px-2.5 py-1 rounded transition-all duration-300 w-48 sm:w-64"
            >
              <Search className="w-4 h-4 text-white mr-2 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titles, people, genres"
                className="bg-transparent text-white text-xs placeholder-[#808080] focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchActive(false);
                  setSearchQuery('');
                }}
                className="text-[#808080] hover:text-white ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsSearchActive(true)}
              aria-label="Search"
              className="text-white hover:text-[#B3B3B3] transition-colors p-1"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            aria-label="Notifications"
            className="relative text-white hover:text-[#B3B3B3] transition-colors p-1"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#E50914]" />
          </button>

          {showNotificationDropdown && (
            <div
              className="absolute right-0 mt-3 w-72 rounded bg-[#141414] border border-[#282828] p-3 shadow-2xl z-50 text-xs animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-bold text-white pb-2 border-b border-[#282828]">
                Notifications
              </div>
              <div className="py-2.5 space-y-2 text-[#B3B3B3]">
                <div className="flex items-start gap-2.5 hover:text-white transition-colors cursor-pointer">
                  <div className="w-2 h-2 rounded-full bg-[#E50914] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">New on Netflix</p>
                    <p className="text-[11px] text-[#808080]">Deadpool & Wolverine is now streaming</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 hover:text-white transition-colors cursor-pointer">
                  <div className="w-2 h-2 rounded-full bg-[#46D369] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">AdBlock Shield Active</p>
                    <p className="text-[11px] text-[#808080]">{adBlockStats.totalBlocked} popunders blocked</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-1.5 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded overflow-hidden bg-[#E50914] flex items-center justify-center font-bold text-white text-xs border border-transparent group-hover:border-white transition-all">
              {activeProfile.name.charAt(0)}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
                showProfileDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showProfileDropdown && (
            <div
              className="absolute right-0 mt-3 w-56 rounded bg-[#141414] border border-[#282828] py-2 shadow-2xl z-50 text-xs text-[#B3B3B3] animate-fadeIn divide-y divide-[#282828]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Selection */}
              <div className="py-1">
                <Link
                  href="/profiles"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:text-white hover:bg-[#1F1F1F] transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-[#E50914] text-white flex items-center justify-center font-bold text-[10px]">
                    {activeProfile.name.charAt(0)}
                  </div>
                  <span className="font-medium text-white">{activeProfile.name}</span>
                </Link>
                <Link
                  href="/profiles"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:text-white hover:bg-[#1F1F1F] transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Manage Profiles</span>
                </Link>
              </div>

              {/* Navigation & AdShield */}
              <div className="py-1">
                <Link
                  href="/my-list"
                  onClick={() => setShowProfileDropdown(false)}
                  className="block px-4 py-2 hover:text-white hover:bg-[#1F1F1F] transition-colors"
                >
                  My List ({watchlist.length})
                </Link>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#46D369]" /> AdShield
                  </span>
                  <button
                    onClick={() => {
                      const next = !adBlockStats.enabled;
                      AdBlocker.toggle(next);
                      toggleAdBlock(next);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      adBlockStats.enabled
                        ? 'bg-[#46D369] text-black'
                        : 'bg-[#282828] text-[#808080]'
                    }`}
                  >
                    {adBlockStats.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Account & Help */}
              <div className="py-1">
                <Link
                  href="/terms"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:text-white hover:bg-[#1F1F1F] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account</span>
                </Link>
                <Link
                  href="/dmca"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:text-white hover:bg-[#1F1F1F] transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help Center</span>
                </Link>
                <button
                  onClick={() => router.push('/profiles')}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 hover:text-white hover:bg-[#1F1F1F] transition-colors text-[#E50914]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out of Netflix</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
