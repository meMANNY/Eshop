"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Star } from "lucide-react";
import Link from "next/link";
import React from "react";

/*
  The storefront's primitives. Every page in the app is assembled from these, so
  this file is where the editorial theme actually lands — re-skinning a primitive
  here changes several dozen pages without any of them being edited.

  Two vocabularies live side by side. The lower half is the set that already
  existed (Card, Button, Field, StatusPill…), now wearing paper, hairlines and
  hard rectangles. The upper half is new: kicker, sys-strip, ghost index, framed
  figures with crosshairs, ledger rows, tile grids. Those are what make the theme
  read as a printed catalogue rather than as a recoloured web app, and Phase 2
  spends them across the pages.
*/

/* --------------------------------------------------------------- container -- */

/**
 * One page gutter for the whole storefront. Layouts here used `w-[80%]` with no
 * maximum, so the same page was a narrow ribbon on a phone and stretched edge to
 * edge on a wide monitor. A max width plus responsive padding gives a readable
 * measure at every size.
 */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ editorial bits -- */

/** The terracotta micro-label above a heading, with its 24px leading rule. */
export function Kicker({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`kicker ${className}`}>{children}</span>;
}

/** The one emphasised word in a heading. Instrument Serif, italic, terracotta. */
export function Serif({ children }: { children: React.ReactNode }) {
  return <span className="serif-hl">{children}</span>;
}

export type SysItem = {
  key?: string;
  value: string;
  /** Pushed to the far end of the strip — usually a count or a page readout. */
  trailing?: boolean;
  hideOnMobile?: boolean;
};

/**
 * The metadata bar that opens most pages, in the theme's filesystem voice:
 * `~/products ● 128 results ● 4 filters … page 02 / 11`. It replaces the
 * breadcrumb-and-count row, and it carries the two hard rules that separate the
 * page header from the page.
 */
export function SysStrip({
  items,
  className = "",
}: {
  items: SysItem[];
  className?: string;
}) {
  return (
    <div className={`sys-strip ${className}`}>
      {items.map((item, i) => {
        const hide = item.hideOnMobile ? "hidden sm:inline" : "";
        return (
          <React.Fragment key={`${item.key ?? item.value}-${i}`}>
            {/* No separator before the first item, nor before a trailing one —
                that item is pushed to the other end of the bar. */}
            {i > 0 && !item.trailing ? (
              <span className={`sys-dot ${hide}`} aria-hidden="true">
                ●
              </span>
            ) : null}
            <span className={`${item.trailing ? "ml-auto" : ""} ${hide}`}>
              {item.key ? <span className="sys-key">{item.key}</span> : null}
              {item.key ? " " : null}
              <span className="sys-value">{item.value}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * A section heading with the full editorial apparatus: an optional zero-padded
 * index, a kicker, the display title, a subtitle, and the huge outlined numeral
 * that sits behind it all. `ghost` defaults to on whenever an index is given,
 * because the numeral is the index rendered large.
 */
export function SectionHeader({
  title,
  kicker,
  index,
  subtitle,
  ghost,
  action,
  className = "",
  as: Tag = "h2",
}: {
  title: React.ReactNode;
  kicker?: React.ReactNode;
  index?: number;
  subtitle?: React.ReactNode;
  ghost?: boolean;
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const padded = index != null ? String(index).padStart(2, "0") : null;
  const showGhost = ghost ?? padded != null;

  return (
    <div className={`relative mb-10 ${className}`}>
      {showGhost && padded ? (
        <span className="ghost-index" aria-hidden="true">
          {padded}
        </span>
      ) : null}

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {padded || kicker ? (
            <div className="mb-3 flex items-center gap-3">
              {padded ? (
                <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-terra-2">
                  {padded}
                </span>
              ) : null}
              {kicker ? <Kicker>{kicker}</Kicker> : null}
            </div>
          ) : null}

          <Tag className="max-w-3xl font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl lg:text-5xl">
            {title}
          </Tag>

          {subtitle ? (
            <p className="mt-4 max-w-2xl text-base leading-[1.5] text-ink-400 lg:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

/**
 * Kept as an alias so the existing call sites survive Phase 1 untouched. The old
 * signature took a coral marker bar and a 2xl heading; it now renders the
 * editorial header at the same three props.
 */
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return <SectionHeader title={title} subtitle={subtitle} action={action} />;
}

export function PageHeading({
  title,
  meta,
  actions,
  kicker,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  kicker?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {kicker ? (
            <div className="mb-3">
              <Kicker>{kicker}</Kicker>
            </div>
          ) : null}
          <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl lg:text-5xl">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
        ) : null}
      </div>
      {meta ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
          {meta}
        </p>
      ) : null}
    </div>
  );
}

/** `grid lg:grid-cols-12` header: heading on the left, an aside ruled off it. */
export function SplitHeader({
  left,
  aside,
  className = "",
}: {
  left: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-8 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-8">{left}</div>
      {aside ? (
        <div className="flex flex-col justify-end border-line lg:col-span-4 lg:border-l lg:pl-8">
          {aside}
        </div>
      ) : null}
    </div>
  );
}

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]"
    >
      <Link href="/" className="text-ink-400 transition-colors hover:text-ink">
        Home
      </Link>
      {trail.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-2">
          {/* A typographic slash rather than a chevron icon: it belongs to the
              same filesystem voice as the sys-strip and the mono nav. */}
          <span className="text-terra-2" aria-hidden="true">
            /
          </span>
          {crumb.href && i < trail.length - 1 ? (
            <Link
              href={crumb.href}
              className="text-ink-400 transition-colors hover:text-ink"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={i === trail.length - 1 ? "text-ink" : "text-ink-400"}
              aria-current={i === trail.length - 1 ? "page" : undefined}
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------- cards -- */

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adds the offset hard shadow and 4px lift on hover. */
  hover?: boolean;
}) {
  return (
    <section
      className={`border border-line bg-paper ${hover ? "card-hover group" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHead({
  title,
  note,
  actions,
}: {
  title: string;
  note?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
      <div>
        <h2 className="font-display text-base font-medium tracking-tight text-ink lg:text-lg">
          {title}
        </h2>
        {note ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
            {note}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

/**
 * A framed image with registration crosshairs and an optional caption strip —
 * the theme's device for turning a product photograph into a printed figure.
 */
export function Frame({
  children,
  caption,
  className = "",
  frameClassName = "",
  tone = "paper",
}: {
  children: React.ReactNode;
  caption?: { left: string; right?: string };
  className?: string;
  frameClassName?: string;
  /** `ink` re-tints the border and caption for use inside an InkSection. */
  tone?: "paper" | "ink";
}) {
  /*
    The tone is a prop rather than something a caller overrides through
    `frameClassName`. Two classes that both set `border-color` are resolved by
    their order in the generated stylesheet, not by their order in the class
    attribute, so an override there would work or not work depending on how
    Tailwind happened to sort that build.
  */
  const shell =
    tone === "ink" ? "border-ink-border bg-ink-soft" : "border-ink-line bg-surface";
  const strip =
    tone === "ink" ? "border-ink-border text-on-ink-muted" : "border-line text-ink-400";

  return (
    <div className={className}>
      <div
        className={`crosshairs relative overflow-hidden border ${shell} ${frameClassName}`}
      >
        {children}
        {/* One element only has two pseudo-elements; this child carries the
            other two corners. */}
        <span className="xh-b" aria-hidden="true" />
      </div>
      {caption ? (
        <div
          className={`mt-3 flex items-center justify-between border-t pt-2 font-mono text-[10px] uppercase tracking-[0.16em] ${strip}`}
        >
          <span>{caption.left}</span>
          {caption.right ? <span className="text-terra">{caption.right}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/** A bordered square holding an icon, with a terracotta corner mark. */
export function IconTile({
  icon,
  className = "",
}: {
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative grid h-12 w-12 place-items-center border border-ink-line bg-paper text-terra-2 ${className}`}
    >
      {icon}
      <span
        className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-terra-2"
        aria-hidden="true"
      />
    </div>
  );
}

export function Chip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`tag-chip ${className}`}>{children}</span>;
}

export type LedgerItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  href?: string;
  index?: number;
};

/**
 * A ruled list with a mono index down the left — order summaries, spec tables,
 * anything that reads as a ledger rather than as a set of cards.
 */
export function Ledger({
  rows,
  className = "",
  numbered = true,
}: {
  rows: LedgerItem[];
  className?: string;
  numbered?: boolean;
}) {
  return (
    <ul className={`border-t border-ink-line ${className}`}>
      {rows.map((row, i) => {
        const body = (
          <>
            {numbered ? (
              <span className="w-10 font-mono text-xs font-semibold tracking-[0.14em] text-terra-2">
                {String(row.index ?? i + 1).padStart(2, "0")}
              </span>
            ) : null}
            <span className="text-base text-ink-500 transition-colors group-hover:text-ink">
              {row.label}
            </span>
            <span className="figure text-sm text-ink">{row.value}</span>
          </>
        );
        const shape = `group grid items-baseline gap-4 border-b border-line py-4 transition-colors hover:bg-surface ${
          numbered ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[1fr_auto]"
        }`;
        return (
          <li key={`${i}`}>
            {row.href ? (
              <Link href={row.href} className={shape}>
                {body}
              </Link>
            ) : (
              <div className={shape}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The `gap-px` trick: a grid whose gaps show the border colour underneath, so a
 * set of tiles reads as a ruled table without any tile drawing its own borders.
 */
export function TileGrid({
  items,
  className = "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  tone = "paper",
}: {
  items: { label: string; href: string }[];
  className?: string;
  /** `ink` inverts the tiles for use inside an InkSection, such as the footer. */
  tone?: "paper" | "ink";
}) {
  const tile =
    tone === "ink"
      ? "bg-ink text-on-ink hover:bg-paper hover:text-ink"
      : "bg-paper text-ink hover:bg-ink hover:text-paper";

  // The rails are the grid's own background showing through its 1px gaps, so the
  // border and the gap colour always have to agree.
  const rails =
    tone === "ink" ? "border-ink-border bg-ink-border" : "border-line bg-line";

  return (
    <ul className={`grid gap-px border ${rails} ${className}`}>
      {items.map((item, i) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`group flex min-h-[88px] flex-col justify-between px-5 py-5 transition-colors duration-300 ${tile}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra">
              /{String(i + 1).padStart(2, "0")} ↗
            </span>
            <span className="font-display text-base font-medium tracking-tight">
              {item.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A full-bleed near-black band inside the cream page — footer, spotlight. */
export function InkSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`ink-section border-t border-ink-line ${className}`}>
      {children}
    </section>
  );
}

/*
  Scroll reveal. This observes its own element rather than relying on a global
  observer: the CSS hides `[data-reveal]` as soon as `html.js` is set, so a
  component that shipped before its observer did would be permanently invisible.
  Owning the observer here means the wrapper is always safe to use, whatever else
  is or is not mounted.
*/
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer (older browsers, jsdom): show the content rather than leave it
    // at opacity 0 forever.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-revealed");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      style={{ ["--reveal-delay" as string]: delay }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- controls -- */

const PILL =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-45";

/*
  Primary rests as ink and goes terracotta on hover, never the other way round:
  `terra` is 2.7:1 on paper, so a resting terracotta fill under white text would
  fail contrast at body size. Ink-on-paper rests at 16:1 and the hover state is
  brief and deliberate.
*/
const BTN_VARIANT = {
  primary: `${PILL} border border-ink bg-ink px-5 py-2.5 text-paper hover:-translate-y-px hover:border-terra hover:bg-terra hover:text-white`,
  ghost: `${PILL} border border-line bg-transparent px-5 py-2.5 text-ink-500 hover:border-ink hover:bg-surface hover:text-ink`,
  danger: `${PILL} border border-neg bg-transparent px-5 py-2.5 text-neg hover:bg-neg hover:text-paper`,
  quiet:
    "link-underline inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 transition-colors hover:text-ink",
} as const;

export type ButtonVariant = keyof typeof BTN_VARIANT;

/** The arrow vocabulary: internal, external, down the page, back. */
export type Arrow = "→" | "↗" | "↘" | "←";

function buttonClass(variant: ButtonVariant, mono?: boolean, className = "") {
  return `${BTN_VARIANT[variant]} ${mono ? "btn-mono" : ""} ${className}`;
}

/** The nudge that makes an arrow feel like it is going somewhere. */
function ArrowGlyph({ arrow }: { arrow: Arrow }) {
  const nudge =
    arrow === "↗"
      ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      : arrow === "←"
      ? "group-hover:-translate-x-1"
      : arrow === "↘"
      ? "group-hover:translate-y-0.5"
      : "group-hover:translate-x-1";
  return (
    <span
      className={`font-mono text-xs transition-transform duration-300 ${nudge}`}
      aria-hidden="true"
    >
      {arrow}
    </span>
  );
}

export function Button({
  variant = "ghost",
  className = "",
  mono,
  arrow,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  mono?: boolean;
  arrow?: Arrow;
}) {
  return (
    <button
      {...props}
      className={`group ${buttonClass(variant, mono, className)}`}
    >
      {children}
      {arrow ? <ArrowGlyph arrow={arrow} /> : null}
    </button>
  );
}

/** Same shape as Button, for links that read as actions. */
export function ButtonLink({
  variant = "primary",
  className = "",
  mono,
  arrow,
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  mono?: boolean;
  arrow?: Arrow;
  href: string;
}) {
  return (
    <Link
      href={href}
      {...props}
      className={`group ${buttonClass(variant, mono, className)}`}
    >
      {children}
      {arrow ? <ArrowGlyph arrow={arrow} /> : null}
    </Link>
  );
}

export function Label({
  children,
  htmlFor,
  required,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500"
    >
      {children}
      {required ? (
        <span className="ml-1 text-terra" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-400";

export const Field = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
  }
>(function Field({ label, error, hint, required, id, className = "", ...props }, ref) {
  const fieldId = id ?? `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
        className={`${CONTROL} ${
          error ? "border-neg" : "border-line focus:border-terra"
        } ${className}`}
      />
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-neg"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
});

/*
  The chevron is painted as a background image rather than positioned as a
  sibling element, so `Select` stays a bare `<select>`. Wrapping it in a
  positioned div would change how it sits inside the flex and grid toolbars that
  already use it.
*/
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236E665A' stroke-width='1.4'/%3E%3C/svg%3E\")";

export function Select({
  label,
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <select
      {...props}
      aria-label={label}
      style={{
        appearance: "none",
        backgroundImage: SELECT_CHEVRON,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.9rem center",
        ...props.style,
      }}
      className={`border border-line bg-surface py-2.5 pl-4 pr-9 text-sm text-ink outline-none transition-colors hover:border-ink focus:border-terra ${className}`}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ status -- */

const TONES = {
  pos: "border-pos/40 bg-pos/5 text-pos",
  warn: "border-warn/50 bg-warn/10 text-warn-ink",
  neg: "border-neg/40 bg-neg/5 text-neg",
  terra: "border-terra-2/40 bg-terra-soft text-terra-2",
  neutral: "border-line text-ink-500",
  /* Transitional alias — `tone="coral"` is still on a number of call sites. */
  coral: "border-terra-2/40 bg-terra-soft text-terra-2",
} as const;

export type Tone = keyof typeof TONES;

/**
 * State ships as a word plus a colour, never a colour alone. Square and mono
 * like every other label in the theme — the rounded pill is reserved for things
 * you can click.
 */
export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function deliveryTone(status?: string): Tone {
  if (status === "Delivered") return "pos";
  if (status === "Cancelled") return "neg";
  if (status === "Processing" || status === "Packed") return "warn";
  return "neutral";
}

export function paymentTone(status?: string): Tone {
  if (status === "Paid") return "pos";
  if (status === "Pending") return "warn";
  if (status === "Failed") return "neg";
  return "neutral";
}

/* ------------------------------------------------------------------- money -- */

export function money(value?: number | null) {
  return `$${(value ?? 0).toFixed(2)}`;
}

/**
 * A price, with its "was" figure when there is one. Both sit in the mono face so
 * a column of prices in a cart or a grid lines up, and so a total doesn't shift
 * width as the digits change.
 */
export function Price({
  value,
  compareAt,
  className = "",
}: {
  value?: number | null;
  compareAt?: number | null;
  className?: string;
}) {
  const discounted = compareAt != null && value != null && compareAt > value;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="figure font-semibold text-ink">{money(value)}</span>
      {discounted ? (
        <>
          <span className="figure text-xs text-ink-300 line-through">
            {money(compareAt)}
          </span>
          <span className="sr-only">reduced from {money(compareAt)}</span>
        </>
      ) : null}
    </span>
  );
}

export function Figure({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`figure ${className}`}>{children}</span>;
}

export function shortId(id?: string) {
  return id ? `#${id.slice(-6).toUpperCase()}` : "—";
}

export function shortDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ rating -- */

/** Rating as stars plus the number, so it isn't shape-only. */
export function Rating({
  value = 0,
  count,
  size = 13,
}: {
  value?: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(value * 10) / 10;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < Math.round(value)
                ? "fill-terra text-terra"
                : "fill-ink-100 text-ink-200"
            }
          />
        ))}
      </span>
      <span className="figure text-xs text-ink-400">
        {rounded.toFixed(1)}
        {count != null ? ` (${count})` : ""}
      </span>
      <span className="sr-only">
        rated {rounded} out of 5{count != null ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------- empty/load -- */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-ink-300">{icon}</div> : null}
      <p className="font-display text-lg font-medium tracking-tight text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-ink-400">{hint}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-surface ring-1 ring-inset ring-line ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-ink/[0.04] to-transparent motion-reduce:animate-none" />
    </div>
  );
}

/** Placeholder in the shape of a product card, for grid loading states. */
export function CardSkeleton() {
  return (
    <div className="border border-line bg-paper p-3">
      <Bar className="aspect-square w-full" />
      <Bar className="mt-3 h-3.5 w-4/5" />
      <Bar className="mt-2 h-3 w-1/2" />
      <Bar className="mt-3 h-4 w-1/3" />
    </div>
  );
}

/* ------------------------------------------------------------------ dialog -- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  label,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  /** The mono tag in the dialog's header strip — e.g. `~/confirm`. */
  label?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md border border-ink-line bg-paper shadow-pop">
          {/*
            The header strip gives the dialog the same ruled top edge every other
            surface in the theme has, and it is where the escape affordance
            lives — a dialog that can only be dismissed by a footer button reads
            as a form, not as an overlay.
          */}
          <div className="flex items-center justify-between border-b border-ink-line bg-surface px-6 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra-2">
              {label ?? "~/confirm"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-ink"
            >
              esc ×
            </button>
          </div>

          <div className="p-6">
            <DialogTitle className="font-display text-lg font-medium tracking-tight text-ink">
              {title}
            </DialogTitle>
            {children ? (
              <div className="mt-2.5 text-sm leading-relaxed text-ink-500">
                {children}
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-2.5">{footer}</div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
