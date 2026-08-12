'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import toast from "react-hot-toast"
type FormData = {
    email: string;
    password: string;
}

const ForgotPassword = () => {

    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(60);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();

    const startResendTimer = () => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (/^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value.slice(-1);
            setOtp(newOtp);
            if (value && index < inputRefs.current.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Step 1: request an OTP for the given email
    const requestOtpMutation = useMutation({
        mutationFn: async ({ email }: { email: string }) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
                { email }
            );
            return response.data;
        },
        onSuccess: (_, { email }) => {
            setUserEmail(email);
            setServerError('');
            setOtp(['', '', '', '']);
            setStep('otp');
            setCanResend(false);
            setTimer(60);
            startResendTimer();
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Something went wrong. Please try again.');
        },
    });

    // Step 2: verify the OTP
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-otp`,
                { email: userEmail, otp: otp.join('') }
            );
            return response.data;
        },
        onSuccess: () => {
            setServerError('');
            setStep('password');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Invalid OTP. Please try again.');
        },
    });

    // Step 3: set the new password
    const resetPasswordMutation = useMutation({
        mutationFn: async ({ password }: { password: string }) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`,
                { email: userEmail, newPassword: password }
            );
            return response.data;
        },
        onSuccess: () => {
            setStep("email");
            toast.success("Password reseted successfully");
            setServerError('');
            router.push('/login');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Could not reset password. Please try again.');
        },
    });

    const onSubmitEmail = (data: FormData) => {
        requestOtpMutation.mutate({ email: data.email });
    };

    const onSubmitPassword = (data: FormData) => {
        resetPasswordMutation.mutate({ password: data.password });
    };

    const verifyOtp = () => {
        verifyOtpMutation.mutate();
    };

    const resendOtp = () => {
        if (!canResend || !userEmail) return;
        setOtp(['', '', '', '']);
        setCanResend(false);
        setTimer(60);
        startResendTimer();
        requestOtpMutation.mutate({ email: userEmail });
    };

    return (
        <div className="w-full py-10 min-h-[85vh] bg-sunken">
            <h1 className="text-4xl font-jost font-semibold text-black text-center ">
                Forgot Password
            </h1>
            <p className='text-center text-lg font-medium py-3 text-[#00000099]'>
                HOME . FORGOT PASSWORD
            </p>
            <div className="w-full flex justify-center">
                <div className="md:w-[480px] p-8 bg-surface shadow rounded-lg">

                    {step === 'email' && (
                        <>
                            <h3 className="text-3xl font-semibold text-center mb-2">
                                Reset your password
                            </h3>
                            <p className="text-center text-[#00000099] mb-6">
                                Remembered it? <Link href="/login" className="text-coral-ink cursor-pointer">Login</Link>
                            </p>
                            <form onSubmit={handleSubmit(onSubmitEmail)}>
                                <label className="block text-ink-muted mb-1"> Email</label>
                                <input
                                    type="email"
                                    placeholder="support@DarkKing.com"
                                    className="w-full p-2 border border-rule outline-0 !rounded mb-1"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
                                            message: 'Invalid email address',
                                        }
                                    })}
                                />
                                {errors.email &&
                                    (<p className="text-neg text-sm mb-1">{errors.email.message}</p>)}
                                <button
                                    type="submit"
                                    disabled={requestOtpMutation.isPending}
                                    className="w-full bg-coral text-[#2b0f0a] py-2 px-4 rounded font-semibold hover:bg-coral-dim active:scale-[0.99] transition-all duration-200 mt-4 disabled:opacity-60"
                                >
                                    {requestOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
                                </button>
                                {serverError && <p className="text-neg text-sm mt-2">{serverError}</p>}
                            </form>
                        </>
                    )}

                    {step === 'otp' && (
                        <div>
                            <h3 className="text-3xl font-semibold text-center mb-2">Enter OTP</h3>
                            <p className="text-center text-sm text-[#00000099] mb-4">
                                We sent a 4-digit code to {userEmail}
                            </p>
                            <div className="flex justify-center gap-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            inputRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(event) => handleOtpChange(index, event.target.value)}
                                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                        aria-label={`OTP digit ${index + 1}`}
                                        className="h-12 w-12 rounded border border-rule bg-surface text-center text-xl font-semibold outline-0 focus:border-coral focus:ring-2 focus:ring-coral/20"
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={verifyOtp}
                                disabled={verifyOtpMutation.isPending || otp.some((d) => d === '')}
                                className="w-full bg-coral text-[#2b0f0a] py-2 px-4 rounded font-semibold hover:bg-coral-dim active:scale-[0.99] transition-all duration-200 mt-6 disabled:opacity-60"
                            >
                                {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <p className="text-center text-sm text-[#00000099] mt-4">
                                {canResend ? (
                                    <button type="button" onClick={resendOtp} className="text-coral-ink font-medium cursor-pointer">
                                        Resend OTP
                                    </button>
                                ) : (
                                    <>Resend OTP in {timer}s</>
                                )}
                            </p>
                            {serverError && <p className="text-neg text-sm mt-2 text-center">{serverError}</p>}
                        </div>
                    )}

                    {step === 'password' && (
                        <>
                            <h3 className="text-3xl font-semibold text-center mb-2">
                                Set a new password
                            </h3>
                            <p className="text-center text-[#00000099] mb-6">
                                for {userEmail}
                            </p>
                            <form onSubmit={handleSubmit(onSubmitPassword)}>
                                <label className="block text-ink-muted mb-1"> New Password</label>
                                <div className="relative">
                                    <input
                                        type={passwordVisible ? 'text' : 'password'}
                                        placeholder="Minimum 6 characters"
                                        className="w-full p-2 border border-rule outline-0 !rounded mb-1"
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters',
                                            },
                                        })}
                                    />
                                    <button type="button" onClick={() => setPasswordVisible(!passwordVisible)}
                                        className="absolute inset-y-0 right-3 flex items-center text-ink-faint" >
                                        {passwordVisible ? <Eye /> : <EyeOff />}
                                    </button>
                                    {errors.password &&
                                        (<p className="text-neg text-sm mb-1">{errors.password.message}</p>)}
                                </div>
                                <button
                                    type="submit"
                                    disabled={resetPasswordMutation.isPending}
                                    className="w-full bg-coral text-[#2b0f0a] py-2 px-4 rounded font-semibold hover:bg-coral-dim active:scale-[0.99] transition-all duration-200 mt-4 disabled:opacity-60"
                                >
                                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                                </button>
                                {serverError && <p className="text-neg text-sm mt-2">{serverError}</p>}
                            </form>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}

export default ForgotPassword