"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Search } from "lucide-react";
import Link from "next/link";
import React from "react";

/*
  The seller console's primitives, on the editorial theme's ink surface. Every
  dashboard page is assembled from these, so re-skinning here moves the whole
  back-office at once.

  The console inverts the storefront rather than differing from it: the same
  kickers, sys-strips, hard rules, mono labels and pill buttons, with cream on
  near-black instead of ink on paper. Terracotta reads at 6.1:1 here, so unlike on
  the cream side the bright step is usable as text.
*/

/* ------------------------------------------------------------------ shell -- */

/**
 * The canvas every dashboard page sits on. Pages each declared their own
 * `min-h-screen` and their own padding, which is why the gutter width drifted
 * from page to page.
 */
export function PageShell({
  children,
  sys,
}: {
  children: React.ReactNode;
  /** The metadata strip above the page — `~/dashboard ● 128 orders`. */
  sys?: SysItem[];
}) {
  return (
    <div className="min-h-screen w-full px-6 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1400px] animate-fade-in">
        {sys ? <SysStrip items={sys} className="mb-8" /> : null}
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- editorial bits -- */

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
 * The metadata bar that opens a console page, in the theme's filesystem voice:
 * `~/orders ● 128 records ● updated 14:02`. It tells an operator where they are
 * and how much of it there is before they read a single row.
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
 * behind it all.
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
    <div className={`relative mb-8 ${className}`}>
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

          <Tag className="max-w-3xl font-display text-2xl font-medium leading-[1.05] tracking-tight text-on-ink md:text-3xl">
            {title}
          </Tag>

          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-[1.55] text-on-ink-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Crumbs({ trail }: { trail: string[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]"
    >
      <Link
        href="/dashboard"
        className="text-on-ink-muted transition-colors hover:text-on-ink"
      >
        Dashboard
      </Link>
      {trail.map((crumb, i) => (
        <span key={crumb} className="flex items-center gap-2">
          {/* A typographic slash rather than a chevron icon: it belongs to the
              same filesystem voice as the sys-strip and the rail. */}
          <span className="text-terra-2" aria-hidden="true">
            /
          </span>
          <span
            className={
              i === trail.length - 1 ? "text-on-ink" : "text-on-ink-muted"
            }
          >
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function PageTitle({
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
          <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-on-ink lg:text-4xl">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
        ) : null}
      </div>
      {meta ? (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-on-ink-muted">
          {meta}
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- panels -- */

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-ink-border bg-ink-soft ${className}`}>
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  note,
  actions,
}: {
  title: string;
  note?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-border bg-ink-raised px-5 py-4">
      <div>
        <h2 className="font-display text-base font-medium tracking-tight text-on-ink">
          {title}
        </h2>
        {note ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-muted">
            {note}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

/**
 * A framed panel with registration crosshairs and an optional caption strip —
 * used around charts and image previews so they read as printed figures.
 */
export function Frame({
  children,
  caption,
  className = "",
  frameClassName = "",
}: {
  children: React.ReactNode;
  caption?: { left: string; right?: string };
  className?: string;
  frameClassName?: string;
}) {
  return (
    <div className={className}>
      <div
        className={`crosshairs relative overflow-hidden border border-ink-border bg-ink-soft ${frameClassName}`}
      >
        {children}
        {/* One element only has two pseudo-elements; this child carries the
            other two corners. */}
        <span className="xh-b" aria-hidden="true" />
      </div>
      {caption ? (
        <div className="mt-3 flex items-center justify-between border-t border-ink-border pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-muted">
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
      className={`relative grid h-12 w-12 place-items-center border border-ink-border bg-ink text-terra ${className}`}
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
  index?: number;
};

/** A ruled list with a mono index down the left — specs, totals, summaries. */
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
    <ul className={`border-t border-ink-border ${className}`}>
      {rows.map((row, i) => (
        <li
          key={i}
          className={`group grid items-baseline gap-4 border-b border-ink-border py-4 transition-colors hover:bg-ink-raised ${
            numbered ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[1fr_auto]"
          }`}
        >
          {numbered ? (
            <span className="w-10 font-mono text-xs font-semibold tracking-[0.14em] text-terra-2">
              {String(row.index ?? i + 1).padStart(2, "0")}
            </span>
          ) : null}
          <span className="text-sm text-on-ink-muted transition-colors group-hover:text-on-ink">
            {row.label}
          </span>
          <span className="figure text-sm text-on-ink">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

/*
  Scroll reveal. This observes its own element rather than relying on a global
  observer: the CSS hides `[data-reveal]` as soon as `html.js` is set, so a
  component that shipped before its observer did would be permanently invisible.
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

/** The uppercase micro-label used for field labels and section eyebrows. */
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
      className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-on-ink-muted"
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

/* --------------------------------------------------------------- controls -- */

const PILL =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-45";

/*
  Inverted from the storefront: primary rests as paper on ink and goes terracotta
  on hover. Both states clear 4.5:1 against their own fill, which the old coral
  button did not.
*/
const BTN_VARIANT = {
  primary: `${PILL} border border-paper bg-paper px-5 py-2.5 text-ink hover:-translate-y-px hover:border-terra hover:bg-terra hover:text-ink`,
  ghost: `${PILL} border border-ink-border bg-transparent px-5 py-2.5 text-on-ink hover:border-paper hover:bg-ink-soft`,
  danger: `${PILL} border border-neg bg-transparent px-5 py-2.5 text-neg hover:bg-neg hover:text-ink`,
  quiet:
    "link-underline inline-flex items-center gap-1.5 text-sm font-medium text-on-ink-muted transition-colors hover:text-on-ink",
} as const;

export type ButtonVariant = keyof typeof BTN_VARIANT;

/** The arrow vocabulary: internal, external, down the page, back. */
export type Arrow = "→" | "↗" | "↘" | "←";

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
      className={`group ${BTN_VARIANT[variant]} ${mono ? "btn-mono" : ""} ${className}`}
    >
      {children}
      {arrow ? <ArrowGlyph arrow={arrow} /> : null}
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Screen-reader name; the visible placeholder is not a label. */
  label: string;
  placeholder: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-2.5 border border-ink-border bg-ink-soft px-3.5 py-2.5 focus-within:border-terra">
      <Search size={16} className="shrink-0 text-on-ink-faint" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-on-ink outline-none placeholder:font-mono placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.1em] placeholder:text-on-ink-faint"
      />
    </div>
  );
}

const CONTROL =
  "w-full border bg-ink-raised px-4 py-3 text-sm text-on-ink outline-none transition-colors placeholder:text-on-ink-faint";

const CONTROL_STATE = (error?: string) =>
  error ? "border-neg" : "border-ink-border focus:border-terra";

const ERROR_TEXT =
  "mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-neg";

/**
 * A labelled text input that shows its own error. The forms in this app already
 * declared validation rules; several never rendered the messages, so a rejected
 * field just sat there looking fine.
 */
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
  const describedBy = error
    ? `${fieldId}-error`
    : hint
    ? `${fieldId}-hint`
    : undefined;

  return (
    <div>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...props}
        className={`${CONTROL} ${CONTROL_STATE(error)} ${className}`}
      />
      {error ? (
        <p id={`${fieldId}-error`} className={ERROR_TEXT}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-on-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
  }
>(function TextArea(
  { label, error, hint, required, id, className = "", ...props },
  ref
) {
  const fieldId = id ?? `t-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        {...props}
        className={`${CONTROL} resize-y ${CONTROL_STATE(error)} ${className}`}
      />
      {error ? (
        <p className={ERROR_TEXT}>{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-on-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
});

/*
  The chevron is painted as a background image rather than positioned as a
  sibling element, so the selects stay bare `<select>` elements. Wrapping them in
  a positioned div would change how they sit inside the flex and grid toolbars
  that already use them.
*/
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A89E8F' stroke-width='1.4'/%3E%3C/svg%3E\")";

const SELECT_STYLE: React.CSSProperties = {
  appearance: "none",
  backgroundImage: SELECT_CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.9rem center",
};

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string;
    required?: boolean;
  }
>(function SelectField(
  { label, error, required, id, className = "", children, ...props },
  ref
) {
  const fieldId = id ?? `s-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        {...props}
        style={{ ...SELECT_STYLE, ...props.style }}
        className={`${CONTROL} pr-9 ${CONTROL_STATE(error)} ${className}`}
      >
        {children}
      </select>
      {error ? <p className={ERROR_TEXT}>{error}</p> : null}
    </div>
  );
});

/** Bare select for toolbars, where the label lives in `aria-label`. */
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
      style={{ ...SELECT_STYLE, ...props.style }}
      className={`border border-ink-border bg-ink-soft py-2.5 pl-4 pr-9 text-sm text-on-ink outline-none transition-colors hover:border-on-ink-faint focus:border-terra ${className}`}
    >
      {children}
    </select>
  );
}

/* ---------------------------------------------------------------- status -- */

const TONES = {
  pos: "border-pos/40 bg-pos/10 text-pos",
  warn: "border-warn/40 bg-warn/10 text-warn",
  neg: "border-neg/40 bg-neg/10 text-neg",
  terra: "border-terra/40 bg-terra-soft text-terra",
  neutral: "border-ink-border text-on-ink-muted",
  /* Transitional alias — `tone="coral"` is still on a number of call sites. */
  coral: "border-terra/40 bg-terra-soft text-terra",
} as const;

export type Tone = keyof typeof TONES;

/**
 * State ships as a word plus a colour, never a colour alone — the amber/green
 * pair sits in the marginal band for red-green colour blindness, so the label is
 * what actually carries the meaning. Square and mono like every other label in
 * the theme; the rounded pill is reserved for things you can click.
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

export function paymentTone(status?: string): Tone {
  if (status === "Paid") return "pos";
  if (status === "Pending") return "warn";
  if (status === "Failed") return "neg";
  return "neutral";
}

export function deliveryTone(status?: string): Tone {
  if (status === "Delivered") return "pos";
  if (status === "Cancelled") return "neg";
  if (status === "Processing" || status === "Packed") return "warn";
  return "neutral";
}

/* ----------------------------------------------------------------- money -- */

export function Figure({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`figure ${className}`}>{children}</span>;
}

export function money(value?: number | null) {
  return `$${(value ?? 0).toFixed(2)}`;
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

/* ------------------------------------------------------------ stat tiles -- */

/**
 * The label is mono and the figure is display, not the other way round. In this
 * theme mono carries metadata and the display face carries the thing itself, so
 * a headline number is set like a headline.
 */
export function StatTile({
  label,
  value,
  note,
  loading,
  index,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  loading?: boolean;
  /** Zero-padded numeral in the top-right, when tiles form a numbered row. */
  index?: number;
}) {
  return (
    <div className="relative border border-ink-border bg-ink-soft px-5 py-4">
      {index != null ? (
        <span
          className="absolute right-4 top-4 font-mono text-[10px] font-semibold tracking-[0.18em] text-terra-2"
          aria-hidden="true"
        >
          {String(index).padStart(2, "0")}
        </span>
      ) : null}
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-on-ink-muted">
        {label}
      </p>
      {loading ? (
        <Bar className="mt-2.5 h-8 w-24" />
      ) : (
        <p className="mt-2 font-display text-3xl font-medium leading-none tracking-tight text-on-ink">
          {value}
        </p>
      )}
      {note ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-faint">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ empty/load -- */

/**
 * An empty screen names which empty it is: nothing matched the filter, or nothing
 * exists yet. Those need different next steps, so they never share a message.
 */
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
      {icon ? <div className="text-on-ink-faint">{icon}</div> : null}
      <p className="font-display text-lg font-medium tracking-tight text-on-ink">
        {title}
      </p>
      {hint ? <p className="max-w-sm text-sm text-on-ink-muted">{hint}</p> : null}
      {action}
    </div>
  );
}

export function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-ink-raised ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent motion-reduce:animate-none" />
    </div>
  );
}

/* ------------------------------------------------------------ pagination -- */

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex items-center justify-between gap-4 border-t border-ink-border pt-5"
    >
      <Button
        variant="ghost"
        mono
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <span aria-hidden="true">←</span> Previous
      </Button>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-ink-muted">
        page <Figure className="text-on-ink">{String(page).padStart(2, "0")}</Figure> /{" "}
        <Figure className="text-on-ink">{String(totalPages).padStart(2, "0")}</Figure>
      </p>
      <Button
        variant="ghost"
        mono
        arrow="→"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

/* ---------------------------------------------------------------- dialog -- */

/**
 * One dialog shell. This app had four separate modal components, each with its
 * own panel, padding and button order — a destructive confirm should not look
 * like a different product depending on which page raised it.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  tone = "neutral",
  label,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  tone?: Tone;
  /** The mono tag in the dialog's header strip — e.g. `~/confirm`. */
  label?: string;
}) {
  const accent: Record<Tone, string> = {
    pos: "text-pos",
    warn: "text-warn",
    neg: "text-neg",
    terra: "text-terra",
    coral: "text-terra",
    neutral: "text-on-ink",
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md border border-ink-border bg-ink-soft shadow-pop">
          {/*
            The header strip gives the dialog the same ruled top edge every other
            surface in the theme has, and it is where the escape affordance
            lives — a dialog that can only be dismissed by a footer button reads
            as a form, not as an overlay.
          */}
          <div className="flex items-center justify-between border-b border-ink-border bg-ink-raised px-6 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra">
              {label ?? "~/confirm"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-muted transition-colors hover:text-on-ink"
            >
              esc ×
            </button>
          </div>

          <div className="p-6">
            <DialogTitle
              className={`font-display text-lg font-medium tracking-tight ${accent[tone]}`}
            >
              {title}
            </DialogTitle>
            {children ? (
              <div className="mt-2.5 text-sm leading-relaxed text-on-ink-muted">
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

/* ----------------------------------------------------------------- utils -- */

/** Serialises rows to CSV and hands the browser a download. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const escape = (cell: string | number) =>
    typeof cell === "number"
      ? String(cell)
      : `"${String(cell).replace(/"/g, '""')}"`;

  const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n"
  );
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
