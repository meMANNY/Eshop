"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Logo from "./assests/svgs/logo";

type FormData = {
  email: string;
  password: string;
};

export default function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/login-admin`,
        data,
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      setServerError(null);
      router.push("/dashboard");
    },
    onError: (error: AxiosError) => {
      setServerError(
        (error.response?.data as { message?: string })?.message ??
          // A network or CORS failure has no response body, and reporting it as
          // "invalid credentials" sends you off checking a password that was
          // never the problem.
          (error.response
            ? "Something went wrong. Try again."
            : "Can't reach the server. Check that the gateway is running.")
      );
    },
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      {/*
        Ruled paper. The console is a ledger, so the one decorative gesture on the
        page is the faint rule of an account book — cheap, quiet, and specific to
        what this tool is, unlike the floating gradient orbs it replaces.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(35,42,56,0.55)_32px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#08090c_78%)]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="marker h-9" aria-hidden="true" />
          <span>
            <Logo className="mb-1.5 h-4 w-4 text-coral" />
            <h1 className="font-display text-xl font-bold leading-none tracking-[-0.01em] text-white">
              Eshop Ops
            </h1>
          </span>
        </div>

        <div className="rounded-panel border border-rule bg-panel p-6 shadow-pop">
          <h2 className="text-[15px] font-semibold text-white">Sign in</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Admin accounts only. Everything you do here is recorded.
          </p>

          <form
            onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
            className="mt-6 space-y-4"
            noValidate
          >
            <Field
              label="Email"
              error={errors.email?.message}
              inputProps={{
                type: "email",
                autoComplete: "email",
                placeholder: "name@example.com",
                ...register("email", {
                  required: "Enter your email address",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                    message: "That doesn't look like an email address",
                  },
                }),
              }}
            />

            <Field
              label="Password"
              error={errors.password?.message}
              inputProps={{
                type: "password",
                autoComplete: "current-password",
                placeholder: "••••••••",
                ...register("password", {
                  required: "Enter your password",
                }),
              }}
            />

            {serverError ? (
              <p
                role="alert"
                className="rounded-lg border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg"
              >
                {serverError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-[#1a0d0b] transition-colors hover:bg-coral-dim disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--faint)]">
          © {new Date().getFullYear()} Eshop
        </p>
      </div>
    </main>
  );
}

/**
 * The form declared validation rules but never rendered `formState.errors`, so a
 * bad email just did nothing when you pressed the button. Pairing each input with
 * its message — and wiring `aria-invalid`/`aria-describedby` — is what makes the
 * rules visible.
 */
function Field({
  label,
  error,
  inputProps,
}: {
  label: string;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const id = `field-${label.toLowerCase()}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-label font-semibold uppercase text-[var(--muted)]"
      >
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-raised px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] ${
          error ? "border-neg/60" : "border-rule focus:border-coral/60"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-neg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
