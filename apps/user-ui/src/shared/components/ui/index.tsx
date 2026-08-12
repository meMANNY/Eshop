"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import React from "react";

/* -------------------------------------------------------------- container -- */

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

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      <Link href="/" className="text-ink-muted transition-colors hover:text-coral-ink">
        Home
      </Link>
      {trail.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-ink-faint" aria-hidden="true" />
          {crumb.href && i < trail.length - 1 ? (
            <Link
              href={crumb.href}
              className="text-ink-muted transition-colors hover:text-coral-ink"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={i === trail.length - 1 ? "text-ink" : "text-ink-muted"}
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

/* ---------------------------------------------------------------- titles -- */

/**
 * Section heading with the coral marker the whole product uses to say "here".
 * The old one carried a coral drop-shadow glow, which works on the consoles'
 * black canvas and just muddies the edge on this light one.
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
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="marker mt-1 h-8" aria-hidden="true" />
        <div>
          <h2 className="font-jost text-2xl font-semibold tracking-[-0.01em] text-ink md:text-3xl">
            {title}
          </h2>
          {/* The old component accepted `subtitle` and then never rendered it. */}
          {subtitle ? (
            <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeading({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="marker mt-1 h-9" aria-hidden="true" />
        <div>
          <h1 className="font-jost text-2xl font-semibold tracking-[-0.01em] text-ink md:text-3xl">
            {title}
          </h1>
          {meta ? <p className="mt-1 text-sm text-ink-muted">{meta}</p> : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- cards -- */

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-card border border-rule bg-surface shadow-card ${className}`}
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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
      <div>
        <h2 className="font-jost text-base font-semibold text-ink">{title}</h2>
        {note ? <p className="mt-0.5 text-xs text-ink-muted">{note}</p> : null}
      </div>
      {actions}
    </header>
  );
}

/* --------------------------------------------------------------- controls -- */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

/*
  `coral` is 2.73:1 on white, so it is a fill and never a label. The primary
  button pairs it with near-black ink rather than the white text it used to carry
  (white on coral is 2.7:1 — unreadable at body size).
*/
const BTN_VARIANT = {
  primary: "bg-coral text-[#2b0f0a] hover:bg-coral-dim",
  ghost: "border border-rule bg-surface text-ink hover:border-ink-faint hover:bg-sunken",
  danger: "bg-neg/10 text-neg hover:bg-neg/20",
  quiet: "text-ink-muted hover:text-coral-ink",
} as const;

export function Button({
  variant = "ghost",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN_VARIANT;
}) {
  return (
    <button {...props} className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${className}`} />
  );
}

/** Same shape as Button, for links that read as actions. */
export function ButtonLink({
  variant = "primary",
  className = "",
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: keyof typeof BTN_VARIANT;
  href: string;
}) {
  return (
    <Link
      href={href}
      {...props}
      className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${className}`}
    >
      {children}
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
      className="mb-1.5 block text-label font-semibold uppercase text-ink-muted"
    >
      {children}
      {required ? (
        <span className="ml-1 text-coral-ink" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint";

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
          error ? "border-neg/60" : "border-rule focus:border-coral"
        } ${className}`}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-neg">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
});

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
      className={`rounded-lg border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-ink-faint ${className}`}
    >
      {children}
    </select>
  );
}

/* ---------------------------------------------------------------- status -- */

const TONES = {
  pos: "bg-pos/10 text-pos ring-pos/20",
  warn: "bg-warn/10 text-warn-ink ring-warn/30",
  neg: "bg-neg/10 text-neg ring-neg/20",
  coral: "bg-coral-soft text-coral-ink ring-coral/30",
  neutral: "bg-sunken text-ink-muted ring-rule",
} as const;

export type Tone = keyof typeof TONES;

/**
 * State ships as a word plus a colour, never a colour alone. Note `warn` uses the
 * amber for its tint and the darker `warn-ink` for its text — the amber that reads
 * as a background is 2.2:1 as type.
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
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

/* ----------------------------------------------------------------- money -- */

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
          <span className="figure text-xs text-ink-faint line-through">
            {money(compareAt)}
          </span>
          <span className="sr-only">
            reduced from {money(compareAt)}
          </span>
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

/* ---------------------------------------------------------------- rating -- */

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
                ? "fill-warn text-warn"
                : "fill-rule text-rule"
            }
          />
        ))}
      </span>
      <span className="figure text-xs text-ink-muted">
        {rounded.toFixed(1)}
        {count != null ? ` (${count})` : ""}
      </span>
      <span className="sr-only">
        rated {rounded} out of 5{count != null ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------ empty/load -- */

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
      {icon ? <div className="text-ink-faint">{icon}</div> : null}
      <p className="font-jost text-lg font-semibold text-ink">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-ink-muted">{hint}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-sunken ring-1 ring-inset ring-rule ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-black/[0.04] to-transparent motion-reduce:animate-none" />
    </div>
  );
}

/** Placeholder in the shape of a product card, for grid loading states. */
export function CardSkeleton() {
  return (
    <div className="rounded-card border border-rule bg-surface p-3">
      <Bar className="aspect-square w-full" />
      <Bar className="mt-3 h-3.5 w-4/5" />
      <Bar className="mt-2 h-3 w-1/2" />
      <Bar className="mt-3 h-4 w-1/3" />
    </div>
  );
}

/* ---------------------------------------------------------------- dialog -- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-card border border-rule bg-surface p-6 shadow-pop">
          <DialogTitle className="font-jost text-lg font-semibold text-ink">
            {title}
          </DialogTitle>
          {children ? (
            <div className="mt-2.5 text-sm leading-relaxed text-ink-muted">
              {children}
            </div>
          ) : null}
          <div className="mt-6 flex justify-end gap-2.5">{footer}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
