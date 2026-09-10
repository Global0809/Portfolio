import type { Metadata, Viewport } from 'next';
import { Manrope, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import './midnight.css';
import './life.css';
import './refinements.css';
import './listening-room.css';
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
  title: 'AICANFEEL — Sound. Made visible.',
  description:
    'CGI and VFX music videos by AICANFEEL. Enter the light archive. Five films, five different feelings.',
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
