import React from 'react';
import { forwardRef } from 'react';

/*
  These shared form components are mounted inside whichever app renders them, so
  they read the host's CSS variables rather than naming a palette of their own.
  Every colour below is `var(--…)`, which is why the same control can sit on the
  seller console's warm ink today and on a cream surface tomorrow without being
  edited again. The hard-coded `#FF6B35`, `border-gray-700` and `text-white` they
  used before pinned them to a design system that no longer exists.
*/

interface BaseProps {
  label?: string;
  type?: 'text' | 'number' | 'password' | 'email' | 'textarea';
  className?: string;
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Props = InputProps | TextareaProps;

const CONTROL =
  'w-full border border-[var(--ink-border)] bg-[var(--ink-soft)] px-4 py-3 text-sm text-[var(--on-ink)] outline-none transition-colors placeholder:text-[var(--on-ink-faint)] focus:border-[var(--terra)]';

const LABEL =
  'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--on-ink-muted)]';

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, type = 'text', className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className={LABEL}>{label}</label>}
        {type === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${CONTROL} resize-y ${className ?? ''}`}
            {...(props as TextareaProps)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            className={`${CONTROL} ${className ?? ''}`}
            {...(props as InputProps)}
          />
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
