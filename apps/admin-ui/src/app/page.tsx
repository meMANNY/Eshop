"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

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
        className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,rgba(58,53,48,0.55)_32px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#1A1A1A_78%)]"
      />

      <div className="relative w-full max-w-sm">
        <div className="sys-strip mb-8">
          <span className="sys-key">~/ops</span>
          <span className="sys-dot" aria-hidden="true">
            ●
          </span>
          <span className="sys-value">sign-in</span>
          <span className="sys-value ml-auto">audit: on</span>
        </div>

        <div className="mb-7 flex items-baseline gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-terra-2"
            aria-hidden="true"
          />
          <h1 className="font-display text-xl font-medium tracking-tight text-on-ink">
            Eshop
          </h1>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-ink-faint">
            /ops
          </span>
        </div>

        <div className="border border-ink-border bg-ink-soft p-6 shadow-pop">
          <h2 className="font-display text-lg font-medium tracking-tight text-on-ink">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-on-ink-muted">
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
                className="border border-neg/30 bg-neg/10 px-3 py-2 text-sm text-neg"
              >
                {serverError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary btn-mono w-full !justify-between"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
              <span aria-hidden="true" className="font-mono text-xs">
                →
              </span>
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-faint">
          © {new Date().getFullYear()} · eshop ops
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
        className="mb-1.5 block text-label font-semibold uppercase text-on-ink-muted"
      >
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full  border bg-ink-raised px-3 py-2.5 text-sm text-on-ink outline-none transition-colors placeholder:text-on-ink-faint ${
          error ? "border-neg/60" : "border-ink-border focus:border-terra/60"
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
