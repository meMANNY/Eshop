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
          These five surfaces and three corals were already the design of this
          app — they were just written out as raw hex 196 times across 30 files,
          so nothing could be adjusted in one place and drift was inevitable.
          Same values, now named. Shared with admin-ui so the two consoles read
          as one product.
        */
        ink: "#08090c",
        panel: "#141922",
        raised: "#1c2230",
        rule: "#1e293b",

        coral: {
          DEFAULT: "#ff6f61",
          bright: "#ff8a7d",
          dim: "#e05a4d",
          soft: "rgba(255,111,97,0.10)",
        },

        // Reserved vocabulary: paid/pending/failed, in stock/low, live/ended.
        // Never reused as a chart series colour.
        pos: "#4ade80",
        warn: "#fbbf24",
        neg: "#f87171",

        // The one hue charts may use, kept clear of the coral chrome and of the
        // status set so a data mark can never be misread as a state.
        data: {
          DEFAULT: "#3987e5",
          high: "#6da7ec",
          low: "#256abf",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Only the shop sign on the login screen wears this.
        sign: ["var(--font-sign)", "cursive"],
      },
      fontSize: {
        // The uppercase micro-label used for field labels, table heads and
        // sidebar group headings.
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.14em" }],
      },
      borderRadius: {
        panel: "0.875rem",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.4)",
        pop: "0 16px 40px -12px rgba(0,0,0,0.7)",
        "coral-glow": "0 0 10px rgba(255,111,97,0.7)",
      },
      keyframes: {
        "rise-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // The staggered entrance for list items that start at `opacity-0`.
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.25s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        // `both` is load-bearing: it holds opacity:1 after the run, and holds
        // the from-state during the per-item animation-delay. Without it the
        // card falls back to its own `opacity-0` and never becomes visible.
        fadeSlideUp: "fadeSlideUp 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
