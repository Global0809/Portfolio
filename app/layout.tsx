import type { Metadata, Viewport } from 'next';
import { Manrope, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import './midnight.css';
import './life.css';
import './refinements.css';
import './listening-room.css';
import './release-polish.css';
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
    'CGI + VFX music videos by AICANFEEL. Explore the portfolio and book a studio slot for your next release.',
  metadataBase: new URL(
    'https://aicanfeel-light-archive.globalgupta14.chatgpt.site',
  ),
  icons: { icon: '/favicon.svg' },
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
