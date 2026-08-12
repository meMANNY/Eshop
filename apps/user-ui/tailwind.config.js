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
          The storefront is the light half of this product. `#ff6f61` was written
          out as a literal 218 times across 30 files, so the palette existed but
          could not be adjusted anywhere.
        */
        canvas: "#f5f5f5",
        surface: "#ffffff",
        sunken: "#fafafa",
        rule: "#e4e7eb",

        ink: {
          DEFAULT: "#10151c",
          muted: "#5b6673",
          faint: "#8b95a3",
        },

        /*
          Coral has two jobs and they need two values on a light background.
          `#ff6f61` is 2.73:1 on white — fine as a button FILL under dark text,
          but it fails as text or as a hairline. `coral-ink` is the same hue
          stepped down to 6.4:1 so links and labels are actually readable; it is
          what every coral *word* in this app should wear.
        */
        coral: {
          DEFAULT: "#ff6f61",
          dim: "#e05a4d",
          ink: "#a83828",
          soft: "rgba(255,111,97,0.10)",
        },

        /*
          Status, re-stepped for a white surface. The dark-theme steps the two
          consoles use sit at 1.7–2.8:1 here, effectively invisible. `warn` needs
          two values for the same reason coral does: the amber reads as a dot or
          a tint but not as text.
        */
        pos: "#15803d",
        warn: { DEFAULT: "#eda100", ink: "#92400e" },
        neg: "#c0243c",

        // The one hue any chart may use, kept clear of brand and status.
        data: "#256abf",
      },
      fontFamily: {
        /*
          `font-jost` was already used across seven files, but Jost was never
          loaded and never added to this theme — so every heading meant to be
          Jost silently fell back to the system stack. It is loaded now.

          Plex Sans and Plex Mono are shared with the seller and admin consoles,
          which keeps one voice across the product; Jost is the storefront's own
          display face, geometric and a little fashion-leaning where the consoles
          are instrumental.
        */
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        jost: ["var(--font-jost)", "var(--font-sans)", "sans-serif"],
        display: ["var(--font-jost)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.12em" }],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,21,28,0.05)",
        lift: "0 8px 24px -10px rgba(16,21,28,0.18)",
        pop: "0 20px 48px -16px rgba(16,21,28,0.28)",
      },
      keyframes: {
        "rise-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "rise-in": "rise-in 0.3s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
