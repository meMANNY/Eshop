'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff, Package, Boxes, Wallet } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

type FormData = {
    email: string;
    password: string;
}

const Login = () => {


    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
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
            setServerError(error.response?.data?.message || 'Invalid credentials. Please try again.');
        },
    });

    const onSubmit = (data: FormData) => {
        loginMutation.mutate(data);
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();



    return (
        <div className="min-h-screen w-full flex bg-white">

            {/* ── Left: storefront-at-night panel ───────────────────────── */}
            <aside className="relative hidden lg:flex w-[45%] flex-col justify-between overflow-hidden bg-[#171310] px-12 py-10 text-white">
                {/* ambient coral glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,111,97,0.28),transparent_58%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_100%,rgba(255,111,97,0.14),transparent_55%)]" />

                {/* brand */}
                <div className="relative flex items-center gap-3">
                    <span className="text-2xl font-semibold tracking-tight">Eshop</span>
                    <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                        Seller
                    </span>
                </div>

                {/* signature: neon "Open." sign */}
                <div className="relative">
                    <div className="inline-flex flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] px-9 py-7 backdrop-blur-sm">
                        <span
                            className="neon-text neon-flicker text-7xl leading-none"
                            style={{ fontFamily: 'Pacifico, cursive' }}
                        >
                            Open.
                        </span>
                        <span className="mt-3 text-sm text-white/45">Your shop is one sign-in away.</span>
                    </div>

                    <h1 className="mt-10 max-w-sm font-Poppins text-4xl font-semibold leading-tight">
                        Flip the sign.<br />Start selling.
                    </h1>
                    <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/55">
                        Manage orders, inventory, and payouts from a single seller dashboard.
                    </p>
                </div>

                {/* what the portal does */}
                <div className="relative flex items-center gap-8 text-white/60">
                    <span className="flex items-center gap-2 text-sm"><Package size={17} className="text-[#ff8a7d]" /> Orders</span>
                    <span className="flex items-center gap-2 text-sm"><Boxes size={17} className="text-[#ff8a7d]" /> Inventory</span>
                    <span className="flex items-center gap-2 text-sm"><Wallet size={17} className="text-[#ff8a7d]" /> Payouts</span>
                </div>
            </aside>

            {/* ── Right: sign-in form ───────────────────────────────────── */}
            <main className="flex w-full lg:w-[55%] items-center justify-center px-6 py-12">
                <div className="fade-up w-full max-w-[400px]">

                    {/* mobile brand */}
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <span className="text-xl font-semibold tracking-tight text-black">Eshop</span>
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                            Seller
                        </span>
                    </div>

                    <h2 className="font-Poppins text-3xl font-semibold text-black">Welcome back</h2>
                    <p className="mt-2 text-[15px] text-[#00000099]">
                        Sign in to manage your shop.
                    </p>

                    <button
                        type="button"
                        className="group mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#000000cc] shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-[#fafafa] hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 transition-transform duration-200 group-hover:scale-110">
                            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.08-6.08C34.46 3.09 29.52 1 24 1 14.82 1 6.98 6.48 3.38 14.34l7.08 5.5C12.13 13.65 17.6 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.97-2.22 5.48-4.72 7.17l7.25 5.63C43.35 37.26 46.52 31.35 46.52 24.5z" />
                            <path fill="#FBBC05" d="M10.46 28.16A14.6 14.6 0 0 1 9.5 24c0-1.44.2-2.84.55-4.16l-7.08-5.5A23.94 23.94 0 0 0 0 24c0 3.86.92 7.51 2.54 10.74l7.92-6.58z" />
                            <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.53-4.96l-7.25-5.63c-1.83 1.23-4.17 1.96-6.28 1.96-6.4 0-11.87-4.15-13.54-9.84l-7.92 6.58C6.98 41.52 14.82 47 24 47z" />
                            <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wider text-gray-400">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span>or sign in with email</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@yourshop.com"
                                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-[15px] outline-0 transition-colors focus:border-[#ff6f61] focus:ring-2 focus:ring-[#ff6f61]/15"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
                                        message: 'Invalid email address',
                                    }
                                })}
                            />
                            {errors.email &&
                                (<p className="mt-1 text-sm text-red-500">{errors.email.message}</p>)}
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    placeholder="Minimum 6 characters"
                                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 pr-11 text-[15px] outline-0 transition-colors focus:border-[#ff6f61] focus:ring-2 focus:ring-[#ff6f61]/15"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                />
                                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)}
                                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                                    {passwordVisible ? <Eye size={19} /> : <EyeOff size={19} />}
                                </button>
                            </div>
                            {errors.password &&
                                (<p className="mt-1 text-sm text-red-500">{errors.password.message}</p>)}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-[#ff6f61]"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)} />
                                Remember me
                            </label>
                            <Link href="/forgot-password" className="text-sm font-medium text-[#ff6f61] hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="mt-2 w-full rounded-lg bg-[#ff6f61] py-2.5 font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,111,97,0.6)] transition-all duration-200 hover:bg-[#e05a4d] active:scale-[0.99] disabled:opacity-60"
                        >
                            {loginMutation.isPending ? 'Signing you in…' : 'Sign in'}
                        </button>
                        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
                    </form>

                    <p className="mt-8 text-center text-sm text-[#00000099]">
                        New to Eshop? <Link href="/signup" className="font-medium text-[#ff6f61] hover:underline">Create a seller account</Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default Login
