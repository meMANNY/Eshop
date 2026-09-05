'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Boxes, Eye, EyeOff, Package, Wallet } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Button, Label } from '@/shared/components/ui';

type FormData = {
  email: string;
  password: string;
};

const WHAT_YOU_GET = [
  { n: "01", icon: <Package size={15} aria-hidden="true" />, label: "Orders", note: "as they land" },
  { n: "02", icon: <Boxes size={15} aria-hidden="true" />, label: "Inventory", note: "stock and events" },
  { n: "03", icon: <Wallet size={15} aria-hidden="true" />, label: "Payouts", note: "straight to Stripe" },
];

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/login-seller`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError('');
      router.push('/');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(
        error.response?.data?.message ??
          // No response body means the request never landed. Calling that
          // "invalid credentials" sends the seller off checking a password that
          // was never the problem.
          (error.response
            ? 'Something went wrong. Try again.'
            : "Can't reach the server. Check that the gateway is running.")
      );
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => loginMutation.mutate(data);

  return (
    /*
      The form half used to be `bg-white` with black text while every other screen
      in this app is near-black — the front door looked like a different product
      from the thing behind it. Both halves are night now: the storefront panel
      stays warm (#171310, a shop lit from inside) against the app's cooler ink.
    */
    <div className="flex min-h-screen w-full bg-ink">
      {/*
        The neon "Open." sign lived here, set in Pacifico with a flicker
        animation and a coral glow. It was the one piece of this app that
        contradicted the editorial system outright — a glowing script sign on a
        surface whose whole argument is print. What replaces it makes the same
        promise in the theme's own voice: a sys-strip, a kicker, a display
        heading with one serif word, and the three things you actually get, set
        out as a ledger.
      */}
      <aside className="ink-section relative hidden w-[45%] flex-col justify-between overflow-hidden border-r border-ink-border px-12 py-10 lg:flex">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-terra opacity-20 blur-[90px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-glow-yellow opacity-[0.15] blur-[90px]"
        />

        <div className="relative flex items-baseline gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-terra-2"
            aria-hidden="true"
          />
          <span className="font-display text-xl font-medium tracking-tight text-on-ink">
            Eshop
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-ink-faint">
            /seller
          </span>
        </div>

        <div className="relative">
          <div className="sys-strip mb-10">
            <span className="sys-key">~/seller</span>
            <span className="sys-dot" aria-hidden="true">
              ●
            </span>
            <span className="sys-value">sign-in</span>
            <span className="sys-dot" aria-hidden="true">
              ●
            </span>
            <span className="sys-value">status: open</span>
          </div>

          <span className="kicker">seller portal · trade with us</span>

          <h1 className="mt-5 max-w-sm font-display text-4xl font-medium leading-[0.98] tracking-tight text-on-ink lg:text-5xl">
            Flip the sign.
            <br />
            <span className="serif-hl">Start selling.</span>
          </h1>

          <p className="mt-5 max-w-sm text-[15px] leading-[1.55] text-on-ink-muted">
            Manage orders, inventory and payouts from one dashboard.
          </p>

          <ul className="mt-9 max-w-sm border-t border-ink-border">
            {WHAT_YOU_GET.map((row) => (
              <li
                key={row.n}
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-ink-border py-3.5"
              >
                <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-terra-2">
                  {row.n}
                </span>
                <span className="flex items-center gap-2 text-sm text-on-ink">
                  <span className="text-terra">{row.icon}</span>
                  {row.label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-faint">
                  {row.note}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-faint">
          independent sellers · shipped with care
        </p>
      </aside>

      {/* ── Right: sign-in form ───────────────────────────────────── */}
      <main className="flex w-full items-center justify-center px-6 py-12 lg:w-[55%]">
        <div className="fade-up w-full max-w-[400px]">
          {/* Mobile brand — the storefront panel is hidden at this width. */}
          <div className="mb-8 flex items-baseline gap-2.5 lg:hidden">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-terra-2"
              aria-hidden="true"
            />
            <span className="font-display text-xl font-medium tracking-tight text-on-ink">
              Eshop
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-ink-faint">
              /seller
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-[-0.01em] text-on-ink">
            Welcome back
          </h2>
          <p className="mt-2 text-[15px] text-on-ink-muted">
            Sign in to manage your shop.
          </p>

          {/*
            A "Continue with Google" button and a "Remember me" checkbox used to
            sit here. Neither was wired to anything — the button had no onClick
            and the checkbox's state was never sent with the request. A control
            that looks live and does nothing costs more than a missing one, so
            both are gone until there's something behind them.
          */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourshop.com"
                aria-invalid={errors.email ? 'true' : undefined}
                className={`w-full  border bg-ink-raised px-3.5 py-2.5 text-sm text-on-ink outline-none transition-colors placeholder:text-on-ink-faint ${
                  errors.email ? 'border-neg/60' : 'border-ink-border focus:border-terra/60'
                }`}
                {...register('email', {
                  required: 'Enter your email address',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                    message: "That doesn't look like an email address",
                  },
                })}
              />
              {errors.email ? (
                <p className="mt-1.5 text-xs text-neg">{errors.email.message}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="At least 6 characters"
                  aria-invalid={errors.password ? 'true' : undefined}
                  className={`w-full  border bg-ink-raised px-3.5 py-2.5 pr-11 text-sm text-on-ink outline-none transition-colors placeholder:text-on-ink-faint ${
                    errors.password
                      ? 'border-neg/60'
                      : 'border-ink-border focus:border-terra/60'
                  }`}
                  {...register('password', {
                    required: 'Enter your password',
                    minLength: {
                      value: 6,
                      message: 'At least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-on-ink-faint transition-colors hover:text-on-ink"
                >
                  {/* These two were the wrong way round: the open eye now means
                      "click to hide", which is what it does. */}
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1.5 text-xs text-neg">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-terra transition-colors hover:text-terra"
              >
                Forgot password?
              </Link>
            </div>

            {serverError ? (
              <p
                role="alert"
                className="border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg"
              >
                {serverError}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              disabled={loginMutation.isPending}
              className="w-full py-2.5"
            >
              {loginMutation.isPending ? 'Signing you in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-on-ink-muted">
            New to Eshop?{' '}
            <Link
              href="/signup"
              className="font-medium text-terra transition-colors hover:text-terra"
            >
              Create a seller account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
