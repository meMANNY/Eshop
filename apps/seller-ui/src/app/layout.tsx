import './global.css';
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Pacifico,
} from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

export const metadata = {
  title: 'Eshop Seller',
  description: 'Run your shop on Eshop',
};

/*
  Fonts move from a render-blocking <link> to next/font: self-hosted, preloaded,
  and no layout shift on first paint. Roboto was in that link tag and used
  nowhere in the app, so it was a wasted request on every page load.

  Plex Sans and Plex Mono are one superfamily drawn for technical interfaces, so
  the interface text and the figures share a voice while staying different in
  kind. Bricolage carries page titles only. Pacifico exists for exactly one
  element — the neon "Open." shop sign on the login screen.
*/
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sign = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-sign',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${mono.variable} ${display.variable} ${sign.variable} min-h-screen bg-ink font-sans text-[var(--text)] antialiased`}
      >
        <Providers>{children}</Providers>
        {/*
          There was no Toaster mounted anywhere in this app, so all nineteen
          toast.success / toast.error calls across the seller portal resolved to
          nothing — saving a product, deleting a discount code and every failure
          in between gave the seller no feedback at all.
        */}
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              '!bg-panel !text-[#e8eaed] !border !border-rule !rounded-xl !text-sm !font-medium !shadow-pop',
            style: { padding: '12px 14px', maxWidth: '360px' },
            success: { iconTheme: { primary: '#4ade80', secondary: '#0d1117' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0d1117' } },
            loading: { iconTheme: { primary: '#ff6f61', secondary: '#0d1117' } },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
