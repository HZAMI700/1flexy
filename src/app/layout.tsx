import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import { PlayerModal } from '@/components/PlayerModal';
import { DownloadModal } from '@/components/DownloadModal';
import { DetailModal } from '@/components/DetailModal';
import { SearchModal } from '@/components/SearchModal';
import { TorrentModal } from '@/components/TorrentModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdBlockerInit } from '@/components/AdBlockerInit';

export const metadata: Metadata = {
  title: 'Netflix - Watch TV Shows Online, Watch Movies Online',
  description:
    'Watch Netflix movies & TV shows online or stream right to your smart TV, game console, PC, Mac, mobile, tablet and more.',
  keywords: [
    'watch movies',
    'movies online',
    'watch TV',
    'TV online',
    'TV shows online',
    'watch series',
    'streaming',
    'netflix clone',
    'vidfast',
  ],
  authors: [{ name: 'Netflix Clone Engineering' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Netflix - Watch TV Shows Online, Watch Movies Online',
    description:
      'Unlimited movies, TV shows, and more. Watch anywhere. Cancel anytime.',
    siteName: 'Netflix',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://vidfast.vc" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col selection:bg-[#E50914] selection:text-white overflow-x-hidden">
        <AdBlockerInit />
        <TopNav />
        <main className="flex-grow">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
        <DetailModal />
        <PlayerModal />
        <DownloadModal />
        <TorrentModal />
        <SearchModal />
      </body>
    </html>
  );
}
