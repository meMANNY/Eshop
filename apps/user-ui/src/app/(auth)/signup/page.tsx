'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
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
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const [serverError, setServerError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [pending, setPending] = useState<FormData | null>(null);
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

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`,
        data
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setPending(formData);
      setServerError('');
      setOtp(Array(OTP_LENGTH).fill(''));
      setShowOtp(true);
      resend.start();
    },
    onError: failed('Something went wrong. Try again.'),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-user`,
        { ...pending, otp: otp.join('') }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError('');
      router.push('/login');
    },
    onError: failed('That code did not work. Check it and try again.'),
  });

  const resendCode = () => {
    if (!resend.canResend || !pending) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    resend.start();
    signupMutation.mutate(pending);
  };

  const slip = (
    /*
      Signup's slip is a docket rather than a receipt — nothing has happened yet,
      so it lists what the account will hold rather than what it does. "Free,
      always" is the one claim on it, and it is true: there is no paid tier.
    */
    <Slip kind="New account" total={{ label: 'Total', value: 'Free, always' }}>
      <SlipLine label="Order history" value="kept" />
      <SlipLine label="Wishlist" value="kept" />
      <SlipLine label="Saved addresses" value="kept" />
      <SlipLine label="Faster checkout" value="yes" />
    </Slip>
  );

  return (
    <AuthShell
      headline={
        <>
          One account.
          <br />
          Every order in it.
        </>
      }
      blurb="Keep your orders, addresses and the things you liked in one place, on every device you shop from."
      slip={slip}
    >
      {!showOtp ? (
        <>
          <AuthHeading title="Create your account">
            Already have one?{' '}
            <Link
              href="/login"
              className="font-medium text-terra-2 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </AuthHeading>

          <form
            onSubmit={handleSubmit((data) => signupMutation.mutate(data))}
            className="mt-8 space-y-4"
            noValidate
          >
            <Field
              label="Name"
              autoComplete="name"
              placeholder="Your name"
              error={errors.name?.message}
              {...register('name', { required: 'Enter your name' })}
            />

            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="We'll send a 4-digit code here to confirm it's yours."
              error={errors.email?.message}
              {...register('email', {
                required: 'Enter your email address',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                  message: "That doesn't look like an email address",
                },
              })}
            />

            <PasswordField
              label="Password"
              id="signup-password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Choose a password',
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
              disabled={signupMutation.isPending}
              className="w-full"
            >
              {signupMutation.isPending ? 'Sending code…' : 'Create account'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setShowOtp(false);
              setServerError('');
            }}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-terra-2"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Change details
          </button>

          <AuthHeading title="Check your email">
            We sent a {OTP_LENGTH}-digit code to{' '}
            <span className="font-medium text-ink">{pending?.email}</span>.
          </AuthHeading>

          <div className="mt-8 space-y-5">
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={verifyMutation.isPending}
            />

            <FormError>{serverError}</FormError>

            <Button
              type="button"
              variant="primary"
              onClick={() => verifyMutation.mutate()}
              disabled={
                verifyMutation.isPending || otp.some((digit) => digit === '')
              }
              className="w-full"
            >
              {verifyMutation.isPending ? 'Confirming…' : 'Confirm email'}
            </Button>

            <ResendLine
              remaining={resend.remaining}
              canResend={resend.canResend}
              onResend={resendCode}
            />
          </div>
        </>
      )}
    </AuthShell>
  );
}
