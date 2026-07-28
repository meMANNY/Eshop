'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

type AccountData = {
    name: string;
    email: string;
    phone_number: string;
    password: string;
}

type ShopData = {
    shopName: string;
    bio: string;
    address: string;
    openingHours: string;
    website: string;
    category: string;
}

const steps = ['Create Account', 'Register Shop', 'Connect to Bank'];

const Signup = () => {

    const [activeStep, setActiveStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(60);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [sellerData, setSellerData] = useState<AccountData | null>(null);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const router = useRouter();

    const {
        register: registerAccount,
        handleSubmit: handleSubmitAccount,
        formState: { errors: accountErrors },
    } = useForm<AccountData>();

    const {
        register: registerShop,
        handleSubmit: handleSubmitShop,
        formState: { errors: shopErrors },
    } = useForm<ShopData>();

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

    const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Step 1a: register the seller account and trigger the OTP email
    const signupMutation = useMutation({
        mutationFn: async (data: AccountData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/seller-registration`, data);
            return response.data;
        },
        onSuccess: (_, formData) => {
            setSellerData(formData);
            setServerError('');
            setShowOtp(true);
            setCanResend(false);
            setTimer(60);
            startResendTimer();
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Something went wrong. Please try again.');
        },
    });

    // Step 1b: verify the OTP, then advance to "Register Shop"
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!sellerData) return;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-seller`, {
                ...sellerData,
                otp: otp.join(''),
            });
            return response.data;
        },
        onSuccess: () => {
            setServerError('');
            setActiveStep(2);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Invalid OTP. Please try again.');
        },
    });

    // Step 2: register the shop, then advance to "Connect to Bank"
    const createShopMutation = useMutation({
        mutationFn: async (data: ShopData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`, {
                ...data,
                email: sellerData?.email,
            });
            return response.data;
        },
        onSuccess: () => {
            setServerError('');
            setActiveStep(3);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Could not register shop. Please try again.');
        },
    });

    // Step 3: kick off the Stripe/bank connection
    const connectBankMutation = useMutation({
        mutationFn: async () => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-stripe-link`, {
                email: sellerData?.email,
            });
            return response.data;
        },
        onSuccess: (data) => {
            setServerError('');
            if (data?.url) {
                window.location.href = data.url;
            } else {
                router.push('/login');
            }
        },
        onError: (error: AxiosError<{ message: string }>) => {
            setServerError(error.response?.data?.message || 'Could not connect to bank. Please try again.');
        },
    });

    const onSubmitAccount = (data: AccountData) => {
        signupMutation.mutate(data);
    };

    const onSubmitShop = (data: ShopData) => {
        createShopMutation.mutate(data);
    };

    const verifyOtp = () => {
        verifyOtpMutation.mutate();
    };

    const resendOtp = () => {
        if (!canResend || !sellerData) return;
        setOtp(['', '', '', '']);
        setCanResend(false);
        setTimer(60);
        startResendTimer();
        signupMutation.mutate(sellerData);
    };

    return (
        <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
            <h1 className="text-4xl font-Poppins font-semibold text-black text-center ">
                Become a Seller
            </h1>
            <p className='text-center text-lg font-medium py-3 text-[#00000099]'>
                HOME . SIGNUP
            </p>

            {/* Step indicator */}
            <div className="w-full flex justify-center mb-8">
                <div className="md:w-[560px] w-[90%] flex items-center justify-between">
                    {steps.map((label, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = activeStep > stepNumber;
                        const isActive = activeStep === stepNumber;
                        return (
                            <React.Fragment key={label}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 transition-all duration-200
                                        ${isCompleted || isActive
                                                ? 'bg-[#ff6f61] border-[#ff6f61] text-white'
                                                : 'bg-white border-gray-300 text-gray-400'}`}
                                    >
                                        {isCompleted ? <Check size={20} /> : stepNumber}
                                    </div>
                                    <span
                                        className={`mt-2 text-sm font-medium text-center
                                        ${isCompleted || isActive ? 'text-[#ff6f61]' : 'text-gray-400'}`}
                                    >
                                        {label}
                                    </span>
                                </div>
                                {stepNumber < steps.length && (
                                    <div
                                        className={`flex-1 h-[2px] mx-2 mb-6 transition-all duration-200
                                        ${activeStep > stepNumber ? 'bg-[#ff6f61]' : 'bg-gray-300'}`}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="w-full flex justify-center">
                <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

                    {/* STEP 1 — Create Account */}
                    {activeStep === 1 && (
                        <>
                            <h3 className="text-3xl font-semibold text-center mb-2">
                                Create Account
                            </h3>
                            {!showOtp && (
                                <p className="text-center text-[#00000099] mb-6">
                                    Already have an account? <Link href="/login" className="text-[#ff6f61] cursor-pointer">Login</Link>
                                </p>
                            )}

                            {!showOtp ? (
                                <>
                                    <button
                                        type="button"
                                        className="group w-full flex items-center justify-center gap-3 border border-[#e0e0e0] rounded-xl py-3 px-4 text-sm font-semibold text-[#000000cc] bg-white shadow-sm hover:shadow-md hover:border-[#c9c9c9] hover:bg-[#fafafa] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 transition-transform duration-200 group-hover:scale-110">
                                            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.08-6.08C34.46 3.09 29.52 1 24 1 14.82 1 6.98 6.48 3.38 14.34l7.08 5.5C12.13 13.65 17.6 9.5 24 9.5z" />
                                            <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.97-2.22 5.48-4.72 7.17l7.25 5.63C43.35 37.26 46.52 31.35 46.52 24.5z" />
                                            <path fill="#FBBC05" d="M10.46 28.16A14.6 14.6 0 0 1 9.5 24c0-1.44.2-2.84.55-4.16l-7.08-5.5A23.94 23.94 0 0 0 0 24c0 3.86.92 7.51 2.54 10.74l7.92-6.58z" />
                                            <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.53-4.96l-7.25-5.63c-1.83 1.23-4.17 1.96-6.28 1.96-6.4 0-11.87-4.15-13.54-9.84l-7.92 6.58C6.98 41.52 14.82 47 24 47z" />
                                            <path fill="none" d="M0 0h48v48H0z" />
                                        </svg>
                                        Sign up with Google
                                    </button>
                                    <div className="flex items-center my-5 text-gray-400 text-sm">
                                        <div className="flex-1 border-t border-gray-300" />
                                        <span>or Sign up with Email</span>
                                        <div className="flex-1 border-t border-gray-300" />
                                    </div>
                                    <form onSubmit={handleSubmitAccount(onSubmitAccount)}>
                                        <label className="block text-gray-700 mb-1"> Name</label>
                                        <input
                                            type="text"
                                            placeholder="Dark King"
                                            className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                            {...registerAccount('name', {
                                                required: 'Name is required',
                                            })}
                                        />
                                        {accountErrors.name &&
                                            (<p className="text-red-500 text-sm mb-1">{accountErrors.name.message}</p>)}
                                        <label className="block text-gray-700 mb-1"> Email</label>
                                        <input
                                            type="email"
                                            placeholder="support@DarkKing.com"
                                            className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                            {...registerAccount('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
                                                    message: 'Invalid email address',
                                                }
                                            })}
                                        />
                                        {accountErrors.email &&
                                            (<p className="text-red-500 text-sm mb-1">{accountErrors.email.message}</p>)}
                                        <label className="block text-gray-700 mb-1"> Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="9876543210"
                                            className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                            {...registerAccount('phone_number', {
                                                required: 'Phone number is required',
                                                pattern: {
                                                    value: /^\d{10}$/,
                                                    message: 'Phone number must be exactly 10 digits',
                                                },
                                            })}
                                        />
                                        {accountErrors.phone_number &&
                                            (<p className="text-red-500 text-sm mb-1">{accountErrors.phone_number.message}</p>)}
                                        <label className="block text-gray-700 mb-1"> Password</label>
                                        <div className="relative">
                                            <input
                                                type={passwordVisible ? 'text' : 'password'}
                                                placeholder="Minimum 6 characters"
                                                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                                {...registerAccount('password', {
                                                    required: 'Password is required',
                                                    minLength: {
                                                        value: 6,
                                                        message: 'Password must be at least 6 characters',
                                                    },
                                                })}
                                            />
                                            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)}
                                                className="absolute inset-y-0 right-3 flex items-center text-gray-400" >
                                                {passwordVisible ? <Eye /> : <EyeOff />}
                                            </button>
                                            {accountErrors.password &&
                                                (<p className="text-red-500 text-sm mb-1">{accountErrors.password.message}</p>)}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={signupMutation.isPending}
                                            className="w-full bg-[#ff6f61] text-white py-2 px-4 rounded font-semibold hover:bg-[#e05a4d] active:scale-[0.99] transition-all duration-200 mt-4 disabled:opacity-60"
                                        >
                                            {signupMutation.isPending ? 'Signing up...' : 'Sign Up'}
                                        </button>
                                        {serverError && <p className="text-red-500 text-sm mt-2">{serverError}</p>}
                                    </form>
                                </>
                            ) : (
                                <div>
                                    <h3 className="text-3xl font-semibold text-center mb-2">Enter OTP</h3>
                                    <p className="text-center text-sm text-[#00000099] mb-4">
                                        We sent a 4-digit code to {sellerData?.email}
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
                                                className="h-12 w-12 rounded border border-gray-300 bg-white text-center text-xl font-semibold outline-0 focus:border-[#ff6f61] focus:ring-2 focus:ring-[#ff6f61]/20"
                                            />
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={verifyOtp}
                                        disabled={verifyOtpMutation.isPending || otp.some((d) => d === '')}
                                        className="w-full bg-[#ff6f61] text-white py-2 px-4 rounded font-semibold hover:bg-[#e05a4d] active:scale-[0.99] transition-all duration-200 mt-6 disabled:opacity-60"
                                    >
                                        {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                    <p className="text-center text-sm text-[#00000099] mt-4">
                                        {canResend ? (
                                            <button type="button" onClick={resendOtp} className="text-[#ff6f61] font-medium cursor-pointer">
                                                Resend OTP
                                            </button>
                                        ) : (
                                            <>Resend OTP in {timer}s</>
                                        )}
                                    </p>
                                    {serverError && <p className="text-red-500 text-sm mt-2 text-center">{serverError}</p>}
                                </div>
                            )}
                        </>
                    )}

                    {/* STEP 2 — Register Shop */}
                    {activeStep === 2 && (
                        <>
                            <h3 className="text-3xl font-semibold text-center mb-2">
                                Register Shop
                            </h3>
                            <p className="text-center text-[#00000099] mb-6">
                                Tell customers about your shop
                            </p>
                            <form onSubmit={handleSubmitShop(onSubmitShop)}>
                                <label className="block text-gray-700 mb-1"> Shop Name</label>
                                <input
                                    type="text"
                                    placeholder="Dark King Store"
                                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                    {...registerShop('shopName', {
                                        required: 'Shop name is required',
                                    })}
                                />
                                {shopErrors.shopName &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.shopName.message}</p>)}
                                <label className="block text-gray-700 mb-1"> Bio (max 100 words)</label>
                                <input
                                    type="text"
                                    placeholder="A short description of your shop"
                                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                    {...registerShop('bio', {
                                        required: 'Shop bio is required',
                                        validate: (value) =>
                                            value.trim().split(/\s+/).length <= 100 || 'Bio must be 100 words or less',
                                    })}
                                />
                                {shopErrors.bio &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.bio.message}</p>)}
                                <label className="block text-gray-700 mb-1"> Address</label>
                                <input
                                    type="text"
                                    placeholder="Shop address"
                                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                    {...registerShop('address', {
                                        required: 'Shop address is required',
                                    })}
                                />
                                {shopErrors.address &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.address.message}</p>)}
                                <label className="block text-gray-700 mb-1"> Opening Hours</label>
                                <input
                                    type="text"
                                    placeholder="Mon - Fri, 9:00 AM - 6:00 PM"
                                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                    {...registerShop('openingHours', {
                                        required: 'Opening hours are required',
                                    })}
                                />
                                {shopErrors.openingHours &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.openingHours.message}</p>)}
                                <label className="block text-gray-700 mb-1"> Website</label>
                                <input
                                    type="text"
                                    placeholder="https://darkking.com"
                                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                    {...registerShop('website', {
                                        pattern: {
                                            value: /^https?:\/\/.+\..+/,
                                            message: 'Enter a valid URL (https://...)',
                                        },
                                    })}
                                />
                                {shopErrors.website &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.website.message}</p>)}
                                <label className="block text-gray-700 mb-1"> Category</label>
                                <select
                                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1 bg-white"
                                    defaultValue=""
                                    {...registerShop('category', {
                                        required: 'Category is required',
                                    })}
                                >
                                    <option value="" disabled>Select a category</option>
                                    <option value="electronics">Electronics</option>
                                    <option value="fashion">Fashion</option>
                                    <option value="groceries">Groceries</option>
                                    <option value="home">Home & Living</option>
                                    <option value="beauty">Beauty</option>
                                    <option value="other">Other</option>
                                </select>
                                {shopErrors.category &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.category.message}</p>)}
                                <button
                                    type="submit"
                                    disabled={createShopMutation.isPending}
                                    className="w-full bg-[#ff6f61] text-white py-2 px-4 rounded font-semibold hover:bg-[#e05a4d] active:scale-[0.99] transition-all duration-200 mt-4 disabled:opacity-60"
                                >
                                    {createShopMutation.isPending ? 'Saving...' : 'Register Shop'}
                                </button>
                                {serverError && <p className="text-red-500 text-sm mt-2">{serverError}</p>}
                            </form>
                        </>
                    )}

                    {/* STEP 3 — Connect to Bank */}
                    {activeStep === 3 && (
                        <>
                            <h3 className="text-3xl font-semibold text-center mb-2">
                                Connect to Bank
                            </h3>
                            <p className="text-center text-[#00000099] mb-6">
                                Connect your bank account to receive payouts from your sales.
                            </p>
                            <button
                                type="button"
                                onClick={() => connectBankMutation.mutate()}
                                disabled={connectBankMutation.isPending}
                                className="w-full bg-[#ff6f61] text-white py-2 px-4 rounded font-semibold hover:bg-[#e05a4d] active:scale-[0.99] transition-all duration-200 disabled:opacity-60"
                            >
                                {connectBankMutation.isPending ? 'Connecting...' : 'Connect with Stripe'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="w-full text-[#00000099] py-2 px-4 rounded font-medium mt-3 hover:text-black transition-all duration-200"
                            >
                                Skip for now
                            </button>
                            {serverError && <p className="text-red-500 text-sm mt-2 text-center">{serverError}</p>}
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}

export default Signup
