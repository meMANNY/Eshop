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
          The editorial palette: warm cream paper, near-black ink, one terracotta
          hue with exactly two steps. There is deliberately no blue, green or
          purple in the chrome — status colours are re-tinted warm so they sit on
          paper without reading as a different design system.

          The block at the bottom keeps the old coral-marketplace names alive and
          pointed at the new values. That is what makes this phase safe to merge
          on its own: several hundred existing call sites change colour without
          any of them being edited. Phase 7 deletes them once the components stop
          referring to them.
        */
        paper: "#FAF7F0",
        surface: "#F2EDE0",
        "surface-alt": "#EFE8D8",
        line: "#D8D2C2",

        ink: {
          DEFAULT: "#1A1A1A",
          // The hard rule. Same value as ink, named separately because it means
          // "1px near-black divider", not "text colour" — the two diverge on the
          // ink surfaces, where the rule lightens but the text does not.
          line: "#1A1A1A",
          // Dark bands inside a cream page: the footer, the spotlight, code.
          soft: "#262220",
          raised: "#302B27",
          border: "#3A3530",
          100: "#ECE7DA",
          200: "#D8D2C2",
          300: "#9A9285",
          400: "#6E665A",
          500: "#4D4639",
          600: "#2A241B",
          // Transitional aliases — Phase 7 deletes these.
          muted: "#4D4639",
          faint: "#6E665A",
        },

        "on-ink": {
          DEFAULT: "#FAF7F0",
          muted: "#A89E8F",
          faint: "#6E665A",
        },

        /*
          Terracotta is the only hue in the system and it needs two steps for the
          same reason coral did: `terra` is 2.7:1 on paper — a fill, a rule, or a
          kicker at 11px bold, never body-size text. `terra-2` is 5.1:1 and is
          what every terracotta *word* wears.
        */
        terra: {
          DEFAULT: "#FF6B35",
          2: "#C24A1B",
          soft: "rgba(255,107,53,0.08)",
        },

        // Status, re-tinted warm so it belongs to the paper rather than sitting
        // on top of it. Reserved vocabulary; never a chart series.
        pos: "#2E7D5B",
        warn: { DEFAULT: "#C57E1A", ink: "#7A4B0E" },
        neg: "#A6321E",

        // The one hue any chart may use, kept clear of brand and status.
        data: "#256abf",

        // Blur decorations only.
        glow: { terra: "#FF6B35", yellow: "#FFBF4B" },

        // ---- transitional aliases (deleted in Phase 7) ----
        canvas: "#FAF7F0",
        sunken: "#F2EDE0",
        rule: "#D8D2C2",
        coral: {
          DEFAULT: "#FF6B35",
          dim: "#C24A1B",
          ink: "#C24A1B",
          soft: "rgba(255,107,53,0.08)",
        },
      },
      fontFamily: {
        /*
          Four faces, four jobs. The portfolio this theme comes from self-hosts
          Helvetica Neue; that face is proprietary and cannot ship in a public
          repo, so `display` is Inter Tight — a true grotesque with the same
          tight, neutral character. It sits next to Inter for body copy, which is
          the same superfamily at a different width: related, not identical.

          Mono does roughly half the visible work in this theme (kickers, nav
          labels, captions, indices), which is its strongest signature.
        */
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter Tight", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        // Transitional alias — `font-jost` is still on 15 files.
        jost: ["var(--font-display)", "Inter Tight", "sans-serif"],
      },
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.16em" }],
        micro: ["0.625rem", { lineHeight: "1rem", letterSpacing: "0.18em" }],
      },
      letterSpacing: {
        // NOTE: this redefines Tailwind's built-in `tracking-tight` (-0.025em)
        // for the whole app, which is intended — the portfolio sets the same
        // value globally on `body`. Every existing `tracking-tight` shifts too.
        tight: "-0.41px",
        kicker: "0.18em",
        label: "0.14em",
      },
      borderRadius: {
        // Everything in this theme is a hard rectangle; the pill is reserved for
        // buttons. Redefining the token to 0 flips all 212 `rounded-card` call
        // sites at once instead of editing them.
        card: "0",
        panel: "0",
      },
      boxShadow: {
        card: "none",
        // The portfolio's offset hard shadow, paired with a soft drop so the
        // lift reads as paper moving rather than a UI card floating.
        lift: "4px 4px 0 0 #1A1A1A, 0 16px 30px -14px rgba(26,26,26,0.22)",
        pop: "0 0 0 1px #1A1A1A, 0 10px 30px rgba(0,0,0,0.15)",
        ink: "0 10px 24px -12px rgba(26,26,26,0.35)",
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
        "sig-draw": { to: { strokeDashoffset: "0" } },
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
        //
        // The last two are transitional aliases so existing call sites animate.
        "rise-in": "fade-in 0.55s cubic-bezier(0.22,1,0.36,1) both",
        fadeSlideUp: "reveal-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
