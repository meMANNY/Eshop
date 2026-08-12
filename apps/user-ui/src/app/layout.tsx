import './global.css';
import { IBM_Plex_Mono, IBM_Plex_Sans, Jost } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';
import Header from '@/shared/widgets/header';

export const metadata = {
  title: 'Zshop',
  description: 'Shop from independent sellers',
};

/*
  Roboto was loaded here and used in zero files — a wasted font request on every
  page load. Jost is the opposite problem: `font-jost` was already applied across
  seven files but the font was never loaded and never added to the Tailwind
  theme, so those headings silently fell back to the system stack.

  Plex Sans and Plex Mono are shared with the seller and admin consoles so the
  product has one voice; Jost is the storefront's own display face.
*/
const sans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const jost = Jost({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-jost',
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
        className={`${sans.variable} ${mono.variable} ${jost.variable} min-h-screen bg-canvas font-sans text-ink antialiased`}
      >
        <Providers>
          <Header />
          {children}
        </Providers>
        {/*
          No Toaster was mounted anywhere in this app, so the four
          toast.success/toast.error calls in the storefront resolved to nothing —
          adding to the cart and failing to sign in were both silent.
        */}
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              '!bg-surface !text-ink !border !border-rule !rounded-xl !text-sm !font-medium !shadow-pop',
            style: { padding: '12px 14px', maxWidth: '360px' },
            success: { iconTheme: { primary: '#15803d', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#c0243c', secondary: '#ffffff' } },
            loading: { iconTheme: { primary: '#a83828', secondary: '#ffffff' } },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
