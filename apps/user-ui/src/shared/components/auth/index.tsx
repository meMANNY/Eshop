'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '../ui';

/* ------------------------------------------------------------------ shell -- */

/**
 * The frame every auth screen shares: a paper slip on a coral-washed panel, and
 * the form beside it.
 *
 * Each console's sign-in wears the artifact of the person using it — the seller
 * flips a neon shop sign, the admin works on ruled ledger paper. A shopper's
 * artifact is paper from a shop counter, so all three screens here hand you a
 * different slip: a receipt, a new-account docket, a claim ticket.
 *
 * Below `lg` the panel drops entirely rather than stacking. A decorative half
 * above the form on a phone is just something to scroll past to reach the thing
 * you came for.
 */
export function AuthShell({
  slip,
  headline,
  blurb,
  children,
}: {
  slip: React.ReactNode;
  headline: React.ReactNode;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full bg-canvas">
      <aside
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden px-12 py-10 lg:flex"
        style={{
          background:
            'linear-gradient(155deg, rgba(255,111,97,0.20) 0%, rgba(255,111,97,0.07) 48%, #f5f5f5 100%)',
        }}
      >
        <Link href="/" className="relative flex items-center gap-3">
          {/* The same coral rail every page header in this app uses. */}
          <span className="marker h-7" aria-hidden="true" />
          <span className="font-jost text-2xl font-semibold tracking-[-0.02em] text-ink">
            Eshop
          </span>
        </Link>

        <div className="relative flex flex-col items-start">
          {slip}
          <h2 className="mt-12 max-w-sm font-jost text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            {headline}
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-muted">
            {blurb}
          </p>
        </div>

        <p className="relative text-sm text-ink-faint">
          Shop from independent sellers.
        </p>
      </aside>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[54%]">
        <div className="w-full max-w-[380px] animate-rise-in motion-reduce:animate-none">
          {/* The panel is hidden at this width, so the brand comes along. */}
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="marker h-6" aria-hidden="true" />
            <span className="font-jost text-xl font-semibold tracking-[-0.02em] text-ink">
              Eshop
            </span>
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}

export function AuthHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <h1 className="font-jost text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">
        {title}
      </h1>
      {children ? (
        <p className="mt-2.5 text-sm text-ink-muted">{children}</p>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------- slip -- */

/** One printed line, with the dotted leader that makes it read as counter paper. */
export function SlipLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <span
        className="flex-1 border-b border-dotted border-ink-faint/60"
        aria-hidden="true"
      />
      <span className="text-ink">{value}</span>
    </div>
  );
}

/**
 * The slip itself. `total` is the bottom line — a receipt always has one, and it
 * is where each screen says the one thing worth remembering.
 */
export function Slip({
  kind,
  children,
  total,
}: {
  kind: string;
  children: React.ReactNode;
  total: { label: string; value: string };
}) {
  return (
    <figure className="relative w-[290px] -rotate-[1.5deg]">
      <div className="rounded-t-[3px] bg-surface px-7 pb-6 pt-7 font-mono text-[11px] uppercase leading-[2.1] tracking-[0.07em] text-ink-muted shadow-pop">
        <div className="text-center">
          <p className="font-jost text-lg font-semibold normal-case tracking-[-0.01em] text-ink">
            Eshop
          </p>
          <p className="mt-0.5 text-[10px] text-ink-faint">{kind}</p>
        </div>

        <div className="my-5 border-b border-dashed border-rule" />
        {children}
        <div className="my-5 border-b border-dashed border-rule" />

        <div className="flex items-center gap-2 font-semibold text-ink">
          <span>{total.label}</span>
          <span
            className="flex-1 border-b border-dotted border-ink-faint/60"
            aria-hidden="true"
          />
          <span>{total.value}</span>
        </div>
      </div>

      {/* The torn edge. One physical cue is enough to say "paper". */}
      <div
        aria-hidden="true"
        className="h-3 w-full"
        style={{
          background:
            'linear-gradient(135deg, #ffffff 25%, transparent 25%) -8px 0 / 16px 16px repeat-x, linear-gradient(225deg, #ffffff 25%, transparent 25%) -8px 0 / 16px 16px repeat-x',
          filter: 'drop-shadow(0 6px 10px rgba(16,21,28,0.10))',
        }}
      />
    </figure>
  );
}

/* ----------------------------------------------------------------- fields -- */

const CONTROL =
  'w-full rounded-lg border bg-surface py-2.5 pl-3.5 pr-11 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint';

/**
 * A password input with its own show/hide control. `Field` cannot carry a
 * trailing button, and all three screens need one.
 */
export const PasswordField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function PasswordField({ label, error, id, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? 'auth-password';

  return (
    <div>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
          className={`${CONTROL} ${
            error ? 'border-neg/60' : 'border-rule focus:border-coral'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-faint transition-colors hover:text-ink"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-neg">
          {error}
        </p>
      ) : null}
    </div>
  );
});

/** Server-side failures, announced rather than just coloured. */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-neg/30 bg-neg/5 px-3.5 py-2.5 text-sm text-neg"
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------- otp -- */

export const OTP_LENGTH = 4;

/**
 * The code boxes. Signup and password-reset had a copy each of this, including
 * two copies of the arrow/backspace handling — and neither accepted a pasted
 * code, which is what everyone actually does with a code from an email.
 */
export function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const next = [...value];
    next[index] = digit.slice(-1);
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1)
      refs.current[index + 1]?.focus();
  };

  const onPaste = (event: React.ClipboardEvent) => {
    const digits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!digits) return;
    event.preventDefault();
    const next = Array.from(
      { length: OTP_LENGTH },
      (_, i) => digits[i] ?? ''
    );
    onChange(next);
    refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-3" onPaste={onPaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className="figure h-14 w-14 rounded-lg border border-rule bg-surface text-center text-xl font-semibold text-ink outline-none transition-colors focus:border-coral disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/**
 * The resend countdown. Both screens had their own copy, and both leaked the
 * interval — nothing cleared it if you navigated away mid-countdown.
 */
export function useResendTimer(seconds = 60) {
  const [remaining, setRemaining] = useState(seconds);
  const [canResend, setCanResend] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    setCanResend(false);
    setRemaining(seconds);
    interval.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stop();
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, stop]);

  useEffect(() => stop, [stop]);

  return { remaining, canResend, start };
}

/** The "resend in 42s" line, so the two code screens word it identically. */
export function ResendLine({
  remaining,
  canResend,
  onResend,
}: {
  remaining: number;
  canResend: boolean;
  onResend: () => void;
}) {
  return (
    <p className="text-center text-sm text-ink-muted">
      {canResend ? (
        <button
          type="button"
          onClick={onResend}
          className="font-medium text-coral-ink underline-offset-4 hover:underline"
        >
          Send a new code
        </button>
      ) : (
        <>
          Didn&apos;t get it? You can ask for a new code in{' '}
          <span className="figure text-ink">{remaining}s</span>
        </>
      )}
    </p>
  );
}
