import type { Metadata, Viewport } from 'next';
import { Manrope, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import './midnight.css';
import './life.css';
import './refinements.css';
import './listening-room.css';
import './release-polish.css';
import './signal-details.css';
import './instagram-invitation.css';
import { assetPath } from './site-path';
const sans = Manrope({
  variable: '--font-archive-sans',
  subsets: ['latin'],
  display: 'swap',
});
const serif = Cormorant_Garamond({
  variable: '--font-archive-serif',
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});
export const metadata: Metadata = {
  title: 'AICANFEEL — CGI + VFX Music videos',
  description:
    'CGI + VFX music videos by AICANFEEL. Explore the portfolio and message the studio on Instagram about your next release.',
  metadataBase: new URL('https://global0809.github.io/Portfolio/'),
  alternates: { canonical: 'https://global0809.github.io/Portfolio/' },
  icons: { icon: assetPath('favicon.svg') },
};
export const viewport: Viewport = {
  themeColor: '#060709',
  colorScheme: 'dark',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
