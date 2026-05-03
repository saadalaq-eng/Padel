import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Manhood League',
  description: 'Padel League Rankings',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#37003c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-pl-purple min-h-screen`}>
        <main className="pb-20 max-w-lg mx-auto">{children}</main>
        <Navigation />
      </body>
    </html>
  );
}
