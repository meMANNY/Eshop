'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Button, Field } from '@/shared/components/ui';
import {
  AuthHeading,
  AuthShell,
  FormError,
  OTP_LENGTH,
  OtpInput,
  PasswordField,
  ResendLine,
  Slip,
  SlipLine,
  useResendTimer,
} from '@/shared/components/auth';

type FormData = {
  email: string;
  password: string;
};

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [serverError, setServerError] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const router = useRouter();
  const resend = useResendTimer(60);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const failed = (fallback: string) => (error: AxiosError<{ message: string }>) =>
    setServerError(
      error.response?.data?.message ??
        (error.response
          ? fallback
          : "Can't reach the server. Check that the gateway is running.")
    );

  const requestOtp = useMutation({
    mutationFn: async (address: string) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
        { email: address }
      );
      return response.data;
    },
    onSuccess: (_, address) => {
      setEmail(address);
      setServerError('');
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep('code');
      resend.start();
    },
    onError: failed('Something went wrong. Try again.'),
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-otp`,
        { email, otp: otp.join('') }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError('');
      setStep('password');
    },
    onError: failed('That code did not work. Check it and try again.'),
  });

  const resetPassword = useMutation({
    mutationFn: async (password: string) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`,
        { email, newPassword: password }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError('');
      // Was "Password reseted successfully", and it fired alongside a step reset
      // that briefly flashed the first screen on the way out.
      toast.success('Password changed. Sign in with your new one.');
      router.push('/login');
    },
    onError: failed('Could not change the password. Try again.'),
  });

  const slip = (
    /*
      A claim ticket rather than a receipt: you hand one over to get your things
      back, which is exactly what a reset code is. The dots mirror the code boxes
      on the next step rather than showing a fake code.
    */
    <Slip kind="Claim ticket" total={{ label: 'Valid for', value: 'One reset' }}>
      <SlipLine label="Issued to" value="your email" />
      <SlipLine label="Code" value="• • • •" />
      <SlipLine label="Expires" value="shortly" />
      <SlipLine label="Password" value="unchanged" />
    </Slip>
  );

  return (
    <AuthShell
      headline={
        <>
          Locked out?
          <br />
          Let&apos;s fix that.
        </>
      }
      blurb="We'll email you a short code. Enter it here and you can set a new password straight away."
      slip={slip}
    >
      {step === 'email' ? (
        <>
          <AuthHeading title="Reset your password">
            Remembered it?{' '}
            <Link
              href="/login"
              className="font-medium text-terra-2 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </AuthHeading>

          <form
            onSubmit={handleSubmit((data) => requestOtp.mutate(data.email))}
            className="mt-8 space-y-4"
            noValidate
          >
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="Use the address you signed up with."
              error={errors.email?.message}
              {...register('email', {
                required: 'Enter your email address',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                  message: "That doesn't look like an email address",
                },
              })}
            />

            <FormError>{serverError}</FormError>

            <Button
              type="submit"
              variant="primary"
              disabled={requestOtp.isPending}
              className="w-full"
            >
              {requestOtp.isPending ? 'Sending code…' : 'Send me a code'}
            </Button>
          </form>
        </>
      ) : step === 'code' ? (
        <>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setServerError('');
            }}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-terra-2"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Use a different email
          </button>

          <AuthHeading title="Check your email">
            We sent a {OTP_LENGTH}-digit code to{' '}
            <span className="font-medium text-ink">{email}</span>.
          </AuthHeading>

          <div className="mt-8 space-y-5">
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={verifyOtp.isPending}
            />

            <FormError>{serverError}</FormError>

            <Button
              type="button"
              variant="primary"
              onClick={() => verifyOtp.mutate()}
              disabled={verifyOtp.isPending || otp.some((digit) => digit === '')}
              className="w-full"
            >
              {verifyOtp.isPending ? 'Checking…' : 'Continue'}
            </Button>

            <ResendLine
              remaining={resend.remaining}
              canResend={resend.canResend}
              onResend={() => {
                if (!resend.canResend || !email) return;
                setOtp(Array(OTP_LENGTH).fill(''));
                resend.start();
                requestOtp.mutate(email);
              }}
            />
          </div>
        </>
      ) : (
        <>
          <AuthHeading title="Set a new password">
            For <span className="font-medium text-ink">{email}</span>.
          </AuthHeading>

          <form
            onSubmit={handleSubmit((data) => resetPassword.mutate(data.password))}
            className="mt-8 space-y-4"
            noValidate
          >
            <PasswordField
              label="New password"
              id="reset-password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Choose a new password',
                minLength: {
                  value: 6,
                  message: 'Use at least 6 characters',
                },
              })}
            />

            <FormError>{serverError}</FormError>

            <Button
              type="submit"
              variant="primary"
              disabled={resetPassword.isPending}
              className="w-full"
            >
              {resetPassword.isPending ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
