"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import React from "react";

/* ------------------------------------------------------------------ shell -- */

/**
 * The canvas every dashboard page sits on. Pages each declared their own
 * `min-h-screen` and their own padding, which is why the gutter width drifted
 * from page to page.
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
              i === trail.length - 1 ? "text-[var(--text)]" : "text-[var(--muted)]"
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
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {/* The same marker the sidebar puts against the active route. */}
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
        {note ? <p className="mt-0.5 text-xs text-[var(--muted)]">{note}</p> : null}
      </div>
      {actions}
    </header>
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
      className="mb-1.5 block text-label font-semibold uppercase text-[var(--muted)]"
    >
      {children}
      {required ? (
        <span className="ml-1 text-coral" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

/* --------------------------------------------------------------- controls -- */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const BTN_VARIANT = {
  primary: "bg-coral text-[#1a0d0b] hover:bg-coral-dim",
  ghost:
    "border border-rule bg-raised text-[var(--text)] hover:border-[#2a3547] hover:bg-[#232b3b]",
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
    <button {...props} className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${className}`} />
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

const CONTROL =
  "w-full rounded-lg border bg-raised px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)]";

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
        className={`${CONTROL} ${
          error ? "border-neg/60" : "border-rule focus:border-coral/60"
        } ${className}`}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-neg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-[var(--faint)]">
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
        className={`${CONTROL} resize-y ${
          error ? "border-neg/60" : "border-rule focus:border-coral/60"
        } ${className}`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-neg">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--faint)]">{hint}</p>
      ) : null}
    </div>
  );
});

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
        className={`${CONTROL} ${
          error ? "border-neg/60" : "border-rule focus:border-coral/60"
        } ${className}`}
      >
        {children}
      </select>
      {error ? <p className="mt-1.5 text-xs text-neg">{error}</p> : null}
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
      className={`rounded-lg border border-rule bg-raised px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors hover:border-[#2a3547] ${className}`}
    >
      {children}
    </select>
  );
}

/* ---------------------------------------------------------------- status -- */

// Opacities must come from Tailwind's scale — `/12` is not a step and silently
// generates no rule at all.
const TONES = {
  pos: "bg-pos/10 text-pos ring-pos/25",
  warn: "bg-warn/10 text-warn ring-warn/25",
  neg: "bg-neg/10 text-neg ring-neg/25",
  coral: "bg-coral/10 text-coral ring-coral/25",
  neutral: "bg-white/5 text-[var(--muted)] ring-white/10",
} as const;

export type Tone = keyof typeof TONES;

/**
 * State ships as a word plus a colour, never a colour alone — the amber/green
 * pair sits in the marginal band for red-green colour blindness, so the label is
 * what actually carries the meaning.
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
      {note ? <p className="mt-1.5 text-xs text-[var(--faint)]">{note}</p> : null}
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
      {icon ? <div className="text-[var(--faint)]">{icon}</div> : null}
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-[var(--muted)]">{hint}</p> : null}
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
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-4">
      <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  tone?: Tone;
}) {
  const accent = {
    pos: "text-pos",
    warn: "text-warn",
    neg: "text-neg",
    coral: "text-coral",
    neutral: "text-[var(--text)]",
  }[tone];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-panel border border-rule bg-panel p-6 shadow-pop">
          <DialogTitle
            className={`font-display text-lg font-bold tracking-[-0.01em] ${accent}`}
          >
            {title}
          </DialogTitle>
          {children ? (
            <div className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
              {children}
            </div>
          ) : null}
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
