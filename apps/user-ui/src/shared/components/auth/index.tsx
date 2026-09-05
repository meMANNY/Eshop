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
    <main className="flex min-h-screen w-full bg-paper">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-ink-line bg-surface px-12 py-10 lg:flex">
        {/* One warm glow rather than a coral wash — the paper grain from the
            root stylesheet already carries most of the texture. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-glow-terra opacity-20 blur-[90px]"
        />

        <Link href="/" className="group relative flex items-baseline gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-terra-2 transition-transform group-hover:scale-125"
            aria-hidden="true"
          />
          <span className="font-display text-xl font-medium tracking-tight text-ink">
            Eshop
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            /account
          </span>
        </Link>

        <div className="relative flex flex-col items-start">
          {slip}
          <h2 className="mt-12 max-w-sm font-display text-[34px] font-medium leading-[1.05] tracking-tight text-ink">
            {headline}
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-[1.55] text-ink-500">
            {blurb}
          </p>
        </div>

        <p className="relative border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
          shop from independent sellers
        </p>
      </aside>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[54%]">
        <div className="w-full max-w-[380px] animate-fade-in motion-reduce:animate-none">
          {/* The panel is hidden at this width, so the brand comes along. */}
          <Link href="/" className="mb-10 flex items-baseline gap-2.5 lg:hidden">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-terra-2"
              aria-hidden="true"
            />
            <span className="font-display text-xl font-medium tracking-tight text-ink">
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
      <h1 className="font-display text-[32px] font-medium leading-[1.05] tracking-tight text-ink">
        {title}
      </h1>
      {children ? (
        <p className="mt-3 text-sm leading-[1.55] text-ink-500">{children}</p>
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
        className="flex-1 border-b border-dotted border-ink-300"
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
      <div className="border border-ink-line bg-paper px-7 pb-6 pt-7 font-mono text-[11px] uppercase leading-[2.1] tracking-[0.07em] text-ink-500">
        <div className="text-center">
          <p className="font-display text-lg font-medium normal-case tracking-tight text-ink">
            Eshop
          </p>
          <p className="mt-0.5 text-[10px] text-ink-400">{kind}</p>
        </div>

        <div className="my-5 border-b border-dashed border-ink-200" />
        {children}
        <div className="my-5 border-b border-dashed border-ink-200" />

        <div className="flex items-center gap-2 font-semibold text-ink">
          <span>{total.label}</span>
          <span
            className="flex-1 border-b border-dotted border-ink-300"
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
            'linear-gradient(135deg, #FAF7F0 25%, transparent 25%) -8px 0 / 16px 16px repeat-x, linear-gradient(225deg, #FAF7F0 25%, transparent 25%) -8px 0 / 16px 16px repeat-x',
          filter: 'drop-shadow(0 4px 6px rgba(26,26,26,0.12))',
        }}
      />
    </figure>
  );
}

/* ----------------------------------------------------------------- fields -- */

const CONTROL =
  'w-full  border bg-paper py-2.5 pl-3.5 pr-11 text-sm text-ink outline-none transition-colors placeholder:text-ink-400';

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
            error ? 'border-neg' : 'border-line focus:border-terra'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-400 transition-colors hover:text-ink"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-neg"
        >
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
      className="border border-neg/40 bg-neg/5 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] leading-[1.6] text-neg"
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
          className="figure h-14 w-14 border border-line bg-surface text-center text-xl font-semibold text-ink outline-none transition-colors focus:border-terra focus:bg-paper disabled:opacity-50"
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
    <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
      {canResend ? (
        <button
          type="button"
          onClick={onResend}
          className="link-underline text-terra-2 transition-colors hover:text-terra"
        >
          send a new code →
        </button>
      ) : (
        <>
          no code yet? ask again in{' '}
          <span className="figure text-ink">{remaining}s</span>
        </>
      )}
    </p>
  );
}
