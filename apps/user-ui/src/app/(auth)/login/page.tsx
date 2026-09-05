'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Button, Field } from '@/shared/components/ui';
import {
  AuthHeading,
  AuthShell,
  FormError,
  PasswordField,
  Slip,
  SlipLine,
} from '@/shared/components/auth';

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/login-user`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError('');
      // The header reads the session from this query; without invalidating it
      // the storefront still renders as signed out after the redirect.
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(
        error.response?.data?.message ??
          // No response body means the request never landed. Reporting that as
          // "invalid credentials" sends you off checking a password that was
          // never the problem.
          (error.response
            ? 'Something went wrong. Try again.'
            : "Can't reach the server. Check that the gateway is running.")
      );
    },
  });

  return (
    <AuthShell
      headline={
        <>
          Everything you saved
          <br />
          is still here.
        </>
      }
      blurb="Your basket, your wishlist and every order you have placed, waiting where you left them."
      slip={
        /*
          The lines are deliberately not counts. A signed-out screen has no idea
          how many orders you have, and inventing "12" would be a lie printed in
          the one place the design is asking you to trust it.
        */
        <Slip kind="Sign-in receipt" total={{ label: 'Total', value: '1 account' }}>
          <SlipLine label="Your orders" value="saved" />
          <SlipLine label="Your wishlist" value="saved" />
          <SlipLine label="Shipping addresses" value="saved" />
          <SlipLine label="Order updates" value="on" />
        </Slip>
      }
    >
      <AuthHeading title="Welcome back">
        New to Eshop?{' '}
        <Link
          href="/signup"
          className="font-medium text-terra-2 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </AuthHeading>

      <form
        onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
        className="mt-8 space-y-4"
        noValidate
      >
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
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
          id="login-password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Enter your password',
            minLength: {
              value: 6,
              message: 'Passwords are at least 6 characters',
            },
          })}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-ink-500 underline-offset-4 transition-colors hover:text-terra-2 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <FormError>{serverError}</FormError>

        <Button
          type="submit"
          variant="primary"
          disabled={loginMutation.isPending}
          className="w-full"
        >
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
