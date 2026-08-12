import "./global.css";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Zshop Ops",
  description: "Operations console for the Zshop marketplace",
};

/*
  Three faces, three jobs.

  Plex Sans and Plex Mono are one superfamily drawn for technical interfaces, so
  the interface text and the figures share a voice while staying obviously
  different in kind. Bricolage carries the page titles and the wordmark only — it
  has enough character to give the console an identity, and little enough
  presence at 700 to stay out of the way of the data.
*/
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${mono.variable} ${display.variable} min-h-screen bg-ink font-sans text-[var(--text)] antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "!bg-panel !text-[#e8eaed] !border !border-rule !rounded-xl !text-sm !font-medium !shadow-pop",
            style: {
              padding: "12px 14px",
              maxWidth: "360px",
            },
            success: {
              iconTheme: { primary: "#4ade80", secondary: "#0d1117" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#0d1117" },
            },
            loading: {
              iconTheme: { primary: "#ff6f61", secondary: "#0d1117" },
            },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
