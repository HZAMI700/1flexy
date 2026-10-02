import React from 'react';
import Link from 'next/link';
import { Globe, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export const Footer: React.FC = () => {
  const footerLinks = [
    { title: 'Audio Description', href: '#' },
    { title: 'Help Center', href: '/dmca' },
    { title: 'Gift Cards', href: '#' },
    { title: 'Media Center', href: '#' },
    { title: 'Investor Relations', href: '#' },
    { title: 'Jobs', href: '#' },
    { title: 'Terms of Use', href: '/terms' },
    { title: 'Privacy', href: '/privacy' },
    { title: 'Legal Notices', href: '/dmca' },
    { title: 'Cookie Preferences', href: '#' },
    { title: 'Corporate Information', href: '#' },
    { title: 'Contact Us', href: '#' },
  ];

  return (
    <footer className="bg-black text-[#808080] pt-16 pb-12 px-[4%] border-t border-[#181818] mt-16 select-none">
      <div className="max-w-[1000px] mx-auto space-y-6">
        {/* Social Icons */}
        <div className="flex items-center gap-6 text-white">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="hover:text-[#B3B3B3] transition-colors"
          >
            <Facebook className="w-5 h-5 fill-current" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hover:text-[#B3B3B3] transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter"
            className="hover:text-[#B3B3B3] transition-colors"
          >
            <Twitter className="w-5 h-5 fill-current" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube"
            className="hover:text-[#B3B3B3] transition-colors"
          >
            <Youtube className="w-5 h-5" />
          </a>
        </div>

        {/* Questions hotline */}
        <p className="text-xs hover:underline cursor-pointer">
          Questions? Call 1-800-019-8234 (Toll-Free)
        </p>

        {/* Links Grid (4 columns desktop, 2 tablet, 1 mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-3 gap-x-6 text-[13px]">
          {footerLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="hover:underline transition-colors leading-normal"
            >
              {link.title}
            </Link>
          ))}
        </div>

        {/* Service Code / Language Selector */}
        <div className="pt-3">
          <div className="inline-flex items-center gap-2 border border-[#808080] px-4 py-1.5 rounded text-xs text-[#808080] hover:text-white cursor-pointer">
            <Globe className="w-4 h-4" />
            <span>English</span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-[#808080] pt-2">
          Netflix Clone © 2024-2026 • Powered by VidFast Streaming & Fasel HD
        </p>
      </div>
    </footer>
  );
};
