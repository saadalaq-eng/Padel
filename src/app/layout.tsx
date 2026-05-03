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
        {/* Top header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-pl-purple-dark border-b border-white/10 h-14 flex items-center justify-center">
          <div className="flex items-center gap-3">
            {/* Badge */}
            <div className="flex flex-col items-center justify-center w-9 h-9 rounded-full border-2 border-pl-green bg-pl-purple">
              <span className="text-pl-green font-black text-xs leading-none tracking-tight">MPL</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-pl-green font-black text-lg tracking-widest uppercase">MPL</span>
              <span className="text-white/50 text-[9px] tracking-[0.2em] uppercase">Manhood Padel League</span>
            </div>
          </div>
        </header>
        <main className="pt-14 pb-20 max-w-lg mx-auto">{children}</main>
        <Navigation />
      </body>
    </html>
  );
}
