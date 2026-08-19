'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '../ui';

/*
  The parts every code-and-password screen needs. Login and signup keep their own
  left-hand panels on purpose — one flips a shop sign, the other tracks a setup
  journey, and they are different moments — but the controls between them should
  behave identically, and until now each screen carried its own copy.
*/

export const OTP_LENGTH = 4;

/* ----------------------------------------------------------------- fields -- */

const CONTROL =
  'w-full rounded-lg border bg-raised py-2.5 pl-3.5 pr-11 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)]';

/** A password input with its own show/hide control, which `Field` cannot carry. */
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
            error ? 'border-neg/60' : 'border-rule focus:border-coral/60'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[var(--faint)] transition-colors hover:text-[var(--text)]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
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

/**
 * Server-side failures. These were bare red paragraphs that a screen reader
 * announced only if it happened to be reading that part of the page.
 */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-neg/30 bg-neg/10 px-3.5 py-2.5 text-sm text-neg"
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------- otp -- */

/**
 * The code boxes. This was the third hand-rolled copy in the repo, and none of
 * them accepted a pasted code — which is what everyone does with a code from an
 * email.
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
    onChange(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ''));
    refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex gap-3" onPaste={onPaste}>
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
          className="figure h-14 w-14 rounded-lg border border-rule bg-raised text-center text-2xl font-semibold text-[var(--text)] outline-none transition-colors focus:border-coral/60 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/**
 * The resend countdown. The old copy leaked its interval — nothing cleared it if
 * the seller navigated away mid-countdown.
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
    <p className="text-center text-sm text-[var(--muted)]">
      {canResend ? (
        <button
          type="button"
          onClick={onResend}
          className="font-medium text-coral underline-offset-4 hover:underline"
        >
          Send a new code
        </button>
      ) : (
        <>
          Didn&apos;t get it? You can ask for a new code in{' '}
          <span className="figure text-[var(--text)]">{remaining}s</span>
        </>
      )}
    </p>
  );
}
