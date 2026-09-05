import './global.css';
import {
  Inter,
  Inter_Tight,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

export const metadata = {
  title: 'Eshop Seller',
  description: 'Run your shop on Eshop',
};

/*
  Four faces, four jobs — the same set the storefront and the ops console load,
  so all three surfaces of the product speak in one voice.

  The theme this is ported from sets its headings in Helvetica Neue, self-hosted.
  That face is proprietary and cannot ship in this repository, so `display` is
  Inter Tight: a genuine grotesque with the same tight, neutral character. Inter
  carries body copy — the same superfamily at a different width.

  JetBrains Mono does the heaviest lifting in a back-office: every label, table
  head, price, stock count, order id and date. Instrument Serif appears only as
  an italic accent word inside a heading.
*/
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Instrument Serif is not a variable font; the two styles are separate files.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/*
          Marks the document as scripted before first paint. The scroll-reveal
          CSS is gated on `html.js`, so without this the reveal never starts —
          and, more importantly, a visitor with JavaScript disabled sees the
          content rather than a page of elements stuck at opacity 0.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${serif.variable} ${mono.variable} min-h-screen bg-ink font-sans text-on-ink antialiased selection:bg-terra/30`}
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
              '!rounded-none !border !border-ink-border !bg-ink-soft !text-on-ink !font-mono !text-[11px] !uppercase !tracking-[0.12em] !shadow-pop',
            style: { padding: '12px 14px', maxWidth: '360px' },
            success: { iconTheme: { primary: '#6FBF9A', secondary: '#1A1A1A' } },
            error: { iconTheme: { primary: '#E8735A', secondary: '#1A1A1A' } },
            loading: { iconTheme: { primary: '#FF6B35', secondary: '#1A1A1A' } },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
