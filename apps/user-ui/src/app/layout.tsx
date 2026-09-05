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
  title: 'Eshop',
  description: 'Shop from independent sellers',
};

/*
  Four faces, four jobs — the editorial theme's type system.

  The theme this is ported from sets its headings in Helvetica Neue, self-hosted.
  That face is proprietary and cannot ship in this repository, so `display` is
  Inter Tight: a genuine grotesque with the same tight, neutral, Swiss character.
  Pairing it with Inter for body copy is the same superfamily at two widths —
  related enough to feel deliberate, different enough to separate a heading from
  a paragraph.

  Instrument Serif appears only as an italic accent word inside a heading, and
  JetBrains Mono carries roughly half the visible text: kickers, nav labels,
  captions, prices and index numerals. That mono density is the single strongest
  signature of the look, which is why it is a loaded face rather than a fallback.
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
        className={`${sans.variable} ${display.variable} ${serif.variable} ${mono.variable} flex min-h-screen flex-col bg-paper font-sans text-ink antialiased selection:bg-terra-2/30`}
      >
        {/*
          The header used to sit here, which put the storefront's search bar and
          cart on the sign-in screen. It now belongs to the `(routes)` group, so
          the auth screens render on their own.
        */}
        <Providers>{children}</Providers>
        {/*
          No Toaster was mounted anywhere in this app, so the four
          toast.success/toast.error calls in the storefront resolved to nothing —
          adding to the cart and failing to sign in were both silent.
        */}
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              '!rounded-none !border !border-ink-line !bg-paper !text-ink !font-mono !text-[11px] !uppercase !tracking-[0.12em] !shadow-lift',
            style: { padding: '12px 14px', maxWidth: '360px' },
            success: { iconTheme: { primary: '#2E7D5B', secondary: '#FAF7F0' } },
            error: { iconTheme: { primary: '#A6321E', secondary: '#FAF7F0' } },
            loading: { iconTheme: { primary: '#C24A1B', secondary: '#FAF7F0' } },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
