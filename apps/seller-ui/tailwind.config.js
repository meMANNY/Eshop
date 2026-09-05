// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    "./src/**/*.{ts,tsx,js,jsx}",
    "../../packages/**/*.{ts,tsx,js,jsx}",
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
//     ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    extend: {
      colors: {
        /*
          The editorial theme's ink half. The console stays dark, but the cool
          blue-black it used (#08090c / #141922 / #1e293b) becomes the warm
          near-black of the storefront's footer band, so the two surfaces are
          demonstrably one design system rather than two that happen to share an
          accent. Admin-ui now uses these exact values too — the consoles used to
          differ by a few points of blue for no reason anyone could name.        */
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#262220",
          raised: "#302B27",
          border: "#3A3530",
          line: "#1A1A1A",
        },

        "on-ink": {
          DEFAULT: "#FAF7F0",
          muted: "#A89E8F",
          faint: "#6E665A",
        },

        // Paper, for the rare inverted element — a primary button fill, a
        // message bubble that is yours.
        paper: "#FAF7F0",
        line: "#3A3530",

        /*
          Terracotta reads at 6.1:1 on this near-black, so unlike on the cream
          storefront the bright step is usable as text here. `terra-2` is the
          punctuation step: index numerals, dots, the active rail hairline.
        */
        terra: {
          DEFAULT: "#FF6B35",
          2: "#C24A1B",
          soft: "rgba(255,107,53,0.12)",
        },

        // Reserved vocabulary: paid/pending/failed, in stock/low, live/ended.
        // Warmed to sit on the new ink; never reused as a chart series colour.
        pos: "#6FBF9A",
        warn: "#E8A44B",
        neg: "#E8735A",

        // The one hue charts may use, kept clear of the accent and of the status
        // set so a data mark can never be misread as a state.
        data: {
          DEFAULT: "#3987e5",
          high: "#6da7ec",
          low: "#256abf",
        },

      },
      fontFamily: {
        /*
          Matched to the storefront so the whole product speaks with one voice.
          Inter Tight stands in for the theme's proprietary Helvetica Neue;
          JetBrains Mono carries the labels, table heads and every figure, which
          is most of what a back-office actually shows.
        */
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter Tight", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        // The uppercase micro-label used for field labels, table heads and
        // sidebar group headings.
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.16em" }],
        micro: ["0.625rem", { lineHeight: "1rem", letterSpacing: "0.18em" }],
      },
      letterSpacing: {
        // NOTE: redefines Tailwind's built-in `tracking-tight` app-wide, which is
        // intended — the theme sets this value globally on `body`.
        tight: "-0.41px",
        kicker: "0.18em",
        label: "0.14em",
      },
      boxShadow: {
        pop: "0 0 0 1px #3A3530, 0 16px 40px -12px rgba(0,0,0,0.6)",
        // The offset hard shadow, in terracotta on ink — a cream one would blow
        // out against the near-black.
        lift: "4px 4px 0 0 #C24A1B, 0 16px 30px -14px rgba(0,0,0,0.5)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
        hero: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(22px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "hero-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        heartbeat: {
          "0%,100%": { transform: "scale(1)" },
          "25%,75%": { transform: "scale(1.3)" },
          "50%": { transform: "scale(1)" },
        },
      },
      animation: {
        "reveal-up": "reveal-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "hero-up": "hero-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.55s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s infinite",
        heartbeat: "heartbeat 0.8s ease-in-out",
        // `both` is load-bearing: it holds opacity:1 after the run, and holds
        // the from-state during the per-item animation-delay. Without it the
        // card falls back to its own `opacity-0` and never becomes visible.
      },
    },
  },
  plugins: [],
};
