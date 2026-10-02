import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PlayerModal } from '@/components/PlayerModal';
import { DownloadModal } from '@/components/DownloadModal';
import { SearchModal } from '@/components/SearchModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdBlockerInit } from '@/components/AdBlockerInit';

export const metadata: Metadata = {
  title: 'VidFast - Stream Movies & TV Shows in 4K UHD',
  description:
    'Experience high-speed 4K movie & TV show streaming with VidFast. Zero intrusive pop-under ads, multi-server embeds, and direct high-speed Fasel HD downloads.',
  keywords: [
    'streaming',
    'vidfast',
    '1flex',
    'watch movies online',
    'stream tv shows',
    'hd streaming',
    'fasel hd download',
    'free movies',
  ],
  authors: [{ name: 'VidFast Engineering' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'VidFast - Stream Movies & TV Shows in 4K UHD',
    description:
      'Ultra high-speed movie and series streaming platform with zero pop-up ads and multi-quality downloads.',
    siteName: 'VidFast',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://vidfast.vc" />
      </head>
      <body className="bg-background text-white min-h-screen flex flex-col selection:bg-primary selection:text-white">
        <AdBlockerInit />
        <Navbar />
        <main className="flex-grow pt-16">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
        <PlayerModal />
        <DownloadModal />
        <SearchModal />
      </body>
    </html>
  );
}
