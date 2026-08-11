"use client";

import axiosInstance from "@/utils/axiosInstance";
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Loader from "../Loader";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Naming each rule and ticking it off while the user types beats a strength
// bar: it says what is actually missing instead of scoring it after the fact.
const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "A number", test: (v: string) => /\d/.test(v) },
];

export default function ChangePassword() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const newPassword = watch("newPassword") ?? "";

  const onSubmit = async (data: FormData) => {
    setError("");
    setMessage("");
    try {
      await axiosInstance.post("/api/change-password", data);
      setMessage("Password updated. Use it the next time you sign in.");
      reset();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "We couldn't update your password. Check your current password and try again."
      );
    }
  };

  return (
    <div className="max-w-xl">
      <p className="text-sm text-slate-500">
        Pick a password you don&apos;t use on any other site. You&apos;ll stay
        signed in on this device.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          placeholder="Your password today"
          error={errors.currentPassword?.message}
          // Deliberately no format rules here: an existing password only has to
          // be correct, and length checks would lock out older accounts.
          {...register("currentPassword", {
            required: "Enter your current password",
          })}
        />

        <div className="h-px bg-slate-100" />

        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            placeholder="Your new password"
            aria-describedby="password-rules"
            error={errors.newPassword?.message}
            {...register("newPassword", {
              required: "Enter a new password",
              validate: {
                rules: (v) =>
                  RULES.every((rule) => rule.test(v)) ||
                  "Your password doesn't meet all the requirements yet",
                notReused: (v) =>
                  v !== watch("currentPassword") ||
                  "Choose a password different from your current one",
              },
            })}
          />

          <ul id="password-rules" className="mt-3 grid gap-2 sm:grid-cols-2">
            {RULES.map((rule) => {
              const met = rule.test(newPassword);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    met ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                      met
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-transparent"
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {rule.label}
                  <span className="sr-only">{met ? " — met" : " — not met"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Type it once more"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Confirm your new password",
            validate: (v) => v === newPassword || "These passwords don't match",
          })}
        />

        {(error || message) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {error || message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6f61] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e05a4d] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61] sm:w-auto"
        >
          {isSubmitting && <Loader size={16} color="text-white" />}
          {isSubmitting ? "Updating" : "Update password"}
        </button>
      </form>
    </div>
  );
}

type PasswordFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error)}
            className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                : "border-slate-200 focus:border-[#ff6f61] focus:ring-[#ff6f61]/25"
            }`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
