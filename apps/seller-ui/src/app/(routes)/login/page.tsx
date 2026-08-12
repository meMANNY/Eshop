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
      {/* ── Left: storefront-at-night panel ───────────────────────── */}
      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#171310] px-12 py-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,111,97,0.28),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_100%,rgba(255,111,97,0.14),transparent_55%)]" />

        <div className="relative flex items-center gap-3">
          <span className="font-display text-2xl font-bold tracking-tight">
            Zshop
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-label font-semibold uppercase text-white/70">
            Seller
          </span>
        </div>

        {/* The signature: a shop sign you flip to Open. */}
        <div className="relative">
          <div className="inline-flex flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] px-9 py-7 backdrop-blur-sm">
            <span className="neon-text neon-flicker font-sign text-7xl leading-none">
              Open.
            </span>
            <span className="mt-3 text-sm text-white/45">
              Your shop is one sign-in away.
            </span>
          </div>

          <h1 className="mt-10 max-w-sm font-display text-4xl font-bold leading-tight tracking-[-0.01em]">
            Flip the sign.
            <br />
            Start selling.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/55">
            Manage orders, inventory and payouts from one dashboard.
          </p>
        </div>

        <div className="relative flex items-center gap-8 text-white/60">
          <span className="flex items-center gap-2 text-sm">
            <Package size={17} className="text-coral-bright" aria-hidden="true" />{' '}
            Orders
          </span>
          <span className="flex items-center gap-2 text-sm">
            <Boxes size={17} className="text-coral-bright" aria-hidden="true" />{' '}
            Inventory
          </span>
          <span className="flex items-center gap-2 text-sm">
            <Wallet size={17} className="text-coral-bright" aria-hidden="true" />{' '}
            Payouts
          </span>
        </div>
      </aside>

      {/* ── Right: sign-in form ───────────────────────────────────── */}
      <main className="flex w-full items-center justify-center px-6 py-12 lg:w-[55%]">
        <div className="fade-up w-full max-w-[400px]">
          {/* Mobile brand — the storefront panel is hidden at this width. */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Zshop
            </span>
            <span className="rounded-full border border-rule px-2 py-0.5 text-label font-semibold uppercase text-[var(--muted)]">
              Seller
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-[-0.01em] text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
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
                className={`w-full rounded-lg border bg-raised px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] ${
                  errors.email ? 'border-neg/60' : 'border-rule focus:border-coral/60'
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
                  className={`w-full rounded-lg border bg-raised px-3.5 py-2.5 pr-11 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] ${
                    errors.password
                      ? 'border-neg/60'
                      : 'border-rule focus:border-coral/60'
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
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--faint)] transition-colors hover:text-[var(--text)]"
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
                className="text-sm font-medium text-coral transition-colors hover:text-coral-bright"
              >
                Forgot password?
              </Link>
            </div>

            {serverError ? (
              <p
                role="alert"
                className="rounded-lg border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg"
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

          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            New to Zshop?{' '}
            <Link
              href="/signup"
              className="font-medium text-coral transition-colors hover:text-coral-bright"
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
