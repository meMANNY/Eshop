"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import React from "react";

/* ------------------------------------------------------------------ shell -- */

/**
 * The canvas every dashboard page sits on. Pages used to each declare their own
 * `min-h-screen` and their own background gradient, which is why the padding and
 * the exact shade of near-black drifted from page to page.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full px-6 py-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1400px] animate-rise-in">
        {children}
      </div>
    </div>
  );
}

export function Crumbs({ trail }: { trail: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm">
      <Link
        href="/dashboard"
        className="text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        Dashboard
      </Link>
      {trail.map((crumb, i) => (
        <span key={crumb} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-[var(--faint)]" aria-hidden="true" />
          <span
            className={
              i === trail.length - 1
                ? "text-[var(--text)]"
                : "text-[var(--muted)]"
            }
          >
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}

/**
 * Title row. `meta` is the one line that says how much data you are looking at —
 * a count of records beats a decorative subtitle in a console, because it tells
 * you whether an empty table means "no matches" or "nothing here yet".
 */
export function PageTitle({
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
        <span className="marker mt-1 h-8" aria-hidden="true" />
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-[-0.01em] text-white">
            {title}
          </h1>
          {meta ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{meta}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
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
    <section
      className={`rounded-panel border border-rule bg-panel shadow-panel ${className}`}
    >
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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        {note ? (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{note}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

/* --------------------------------------------------------------- controls -- */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const BTN_VARIANT = {
  primary: "bg-coral text-[#1a0d0b] hover:bg-coral-dim",
  ghost: "border border-rule bg-raised text-[var(--text)] hover:border-[#2f3949] hover:bg-[#222a38]",
  danger: "bg-neg/10 text-neg hover:bg-neg/25",
  quiet: "text-[var(--muted)] hover:text-[var(--text)]",
} as const;

export function Button({
  variant = "ghost",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN_VARIANT;
}) {
  return (
    <button
      {...props}
      className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${className}`}
    />
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
  /** Screen-reader name for the box; the visible placeholder is not a label. */
  label: string;
  placeholder: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-rule bg-panel px-3.5 py-2.5 focus-within:border-coral/60">
      <Search size={16} className="shrink-0 text-[var(--faint)]" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
      />
    </div>
  );
}

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
      className={`rounded-lg border border-rule bg-raised px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors hover:border-[#2f3949] ${className}`}
    >
      {children}
    </select>
  );
}

export function TextField({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label font-semibold uppercase text-[var(--muted)]">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-lg border border-rule bg-raised px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-coral/60 placeholder:text-[var(--faint)] ${className}`}
      />
    </label>
  );
}

/* ---------------------------------------------------------------- status -- */

// Opacities have to come from Tailwind's scale — `/12` is not a step, so it
// generates no rule at all and the pill silently loses its tint.
const TONES = {
  pos: "bg-pos/10 text-pos ring-pos/25",
  warn: "bg-warn/10 text-warn ring-warn/25",
  neg: "bg-neg/10 text-neg ring-neg/25",
  neutral: "bg-white/5 text-[var(--muted)] ring-white/10",
} as const;

export type Tone = keyof typeof TONES;

/**
 * State always ships as a word plus a colour, never a colour alone — the
 * amber/green pair sits inside the marginal band for red-green colour blindness,
 * so the label is what actually carries the meaning.
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

/** Maps the payment states the order service emits onto the status vocabulary. */
export function paymentTone(status?: string): Tone {
  if (status === "Paid") return "pos";
  if (status === "Pending") return "warn";
  if (status === "Failed") return "neg";
  return "neutral";
}

/** Maps delivery states onto the same vocabulary. */
export function deliveryTone(status?: string): Tone {
  if (status === "Delivered") return "pos";
  if (status === "Cancelled") return "neg";
  if (status === "Processing" || status === "Packed") return "warn";
  return "neutral";
}

/* ----------------------------------------------------------------- money -- */

/** Money and counts render mono and tabular so columns of them stay aligned. */
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

/* ------------------------------------------------------------ stat tiles -- */

/**
 * One figure, one label, no sparkline and no percentage badge. A tile earns its
 * place by answering a question at a glance; anything else on it competes with
 * the number for the half-second the reader gives it.
 */
export function StatTile({
  label,
  value,
  note,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-panel border border-rule bg-panel px-5 py-4 shadow-panel">
      <p className="text-label font-semibold uppercase text-[var(--muted)]">
        {label}
      </p>
      {loading ? (
        <Bar className="mt-2.5 h-7 w-24" />
      ) : (
        <p className="figure mt-1.5 text-2xl font-medium leading-none text-white">
          {value}
        </p>
      )}
      {note ? (
        <p className="mt-1.5 text-xs text-[var(--faint)]">{note}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ empty/load -- */

/**
 * An empty screen says which of the two empties it is: nothing matched the
 * filter, or nothing exists yet. They need different next steps from the reader,
 * so they never share a message.
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
      {icon ? <div className="text-[var(--faint)]">{icon}</div> : null}
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      {hint ? (
        <p className="max-w-sm text-sm text-[var(--muted)]">{hint}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-raised ${className}`}
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
      className="mt-5 flex items-center justify-between gap-4"
    >
      <Button
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <p className="text-sm text-[var(--muted)]">
        Page <Figure className="text-[var(--text)]">{page}</Figure> of{" "}
        <Figure className="text-[var(--text)]">{totalPages}</Figure>
      </p>
      <Button
        variant="ghost"
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
 * One dialog shell for the console. Both places that ask "are you sure" — banning
 * a user and handing someone admin — had their own panel, their own padding and
 * their own button order; a destructive confirm should never look like a
 * different product depending on which page raised it.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  tone = "neutral",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  tone?: Tone;
}) {
  const accent = {
    pos: "text-pos",
    warn: "text-warn",
    neg: "text-neg",
    neutral: "text-[var(--text)]",
  }[tone];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-panel border border-rule bg-panel p-6 shadow-pop">
          <DialogTitle
            className={`font-display text-lg font-bold tracking-[-0.01em] ${accent}`}
          >
            {title}
          </DialogTitle>
          <div className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
            {children}
          </div>
          <div className="mt-6 flex justify-end gap-2.5">{footer}</div>
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
    typeof cell === "number" ? String(cell) : `"${String(cell).replace(/"/g, '""')}"`;

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
