'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff, Check, ChevronDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import countries from '@/utils/countries';
import categories from '@/utils/categories';
import axios, { AxiosError } from 'axios';

type AccountData = {
    name: string;
    email: string;
    phone_number: string;
    password: string;
    country: string;
}

type ShopData = {
    shopName: string;
    bio: string;
    address: string;
    openingHours: string;
    website: string;
    category: string;
    customCategory?: string;
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
    const [sellerId, setSellerId] = useState<string | null>(null);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const router = useRouter();

    const {
        register: registerAccount,
        handleSubmit: handleSubmitAccount,
        setValue: setValueAccount,
        watch: watchAccount,
        formState: { errors: accountErrors },
    } = useForm<AccountData>();

    const [countryOpen, setCountryOpen] = useState(false);
    const countryRef = React.useRef<HTMLDivElement | null>(null);
    const selectedCountry = watchAccount('country');

    // close the country dropdown when clicking outside of it
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
                setCountryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const {
        register: registerShop,
        handleSubmit: handleSubmitShop,
        setValue: setValueShop,
        watch: watchShop,
        formState: { errors: shopErrors },
    } = useForm<ShopData>();

    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categoryDropUp, setCategoryDropUp] = useState(false);
    const categoryRef = React.useRef<HTMLDivElement | null>(null);
    const selectedCategory = watchShop('category');

    // open the category dropdown upward when there isn't enough room below
    const toggleCategory = () => {
        if (!categoryOpen && categoryRef.current) {
            const rect = categoryRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 240; // matches max-h-60
            setCategoryDropUp(spaceBelow < dropdownHeight && rect.top > spaceBelow);
        }
        setCategoryOpen((prev) => !prev);
    };

    // close the category dropdown when clicking outside of it
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        onSuccess: (data: any) => {

            setSellerId(data?.seller?.id);
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
                name: data.shopName,
                bio: data.bio,
                address: data.address,
                opening_hours: data.openingHours,
                website: data.website,
                category: data.category === 'other'
                    ? (data.customCategory?.trim() || 'other')
                    : data.category,
                sellerId,
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
                sellerId
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
                                        <label className="block text-gray-700 mb-1"> Country</label>
                                        <div className="relative mb-1" ref={countryRef}>
                                            {/* registered hidden field so react-hook-form tracks + validates the value */}
                                            <input
                                                type="hidden"
                                                {...registerAccount('country', { required: 'Country is required' })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCountryOpen((prev) => !prev)}
                                                className="w-full flex items-center justify-between p-2 border border-gray-300 !rounded bg-white text-left outline-0 focus:border-[#ff6f61]"
                                            >
                                                <span className={selectedCountry ? 'text-black' : 'text-gray-400'}>
                                                    {selectedCountry
                                                        ? countries.find((c) => c.code === selectedCountry)?.name
                                                        : 'Select a country'}
                                                </span>
                                                <ChevronDown
                                                    size={18}
                                                    className={`text-gray-500 transition-transform duration-200 ${countryOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {countryOpen && (
                                                <ul
                                                    className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 bg-gradient-to-b from-white/90 to-white/60"
                                                >
                                                    {countries.map((c) => (
                                                        <li key={c.code}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setValueAccount('country', c.code, { shouldValidate: true });
                                                                    setCountryOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-[#ff6f61]/10 hover:text-[#ff6f61]
                                                                ${selectedCountry === c.code ? 'bg-[#ff6f61]/15 text-[#ff6f61] font-medium' : 'text-gray-700'}`}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        {accountErrors.country &&
                                            (<p className="text-red-500 text-sm mb-1">{accountErrors.country.message}</p>)}
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
                                            value: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
                                            message: 'Enter a valid URL (e.g. https://darkking.com)',
                                        },
                                    })}
                                />
                                {shopErrors.website &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.website.message}</p>)}
                                <label className="block text-gray-700 mb-1"> Category</label>
                                <div className="relative mb-1" ref={categoryRef}>
                                    {/* registered hidden field so react-hook-form tracks + validates the value */}
                                    <input
                                        type="hidden"
                                        {...registerShop('category', { required: 'Category is required' })}
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleCategory}
                                        className="w-full flex items-center justify-between p-2 border border-gray-300 !rounded bg-white text-left outline-0 focus:border-[#ff6f61]"
                                    >
                                        <span className={selectedCategory ? 'text-black' : 'text-gray-400'}>
                                            {selectedCategory
                                                ? categories.find((c) => c.value === selectedCategory)?.name
                                                : 'Select a category'}
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-gray-500 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {categoryOpen && (
                                        <ul
                                            className={`absolute z-20 w-full max-h-60 overflow-auto rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 bg-gradient-to-b from-white/90 to-white/60
                                            ${categoryDropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                                        >
                                            {categories.map((c) => (
                                                <li key={c.value}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValueShop('category', c.value, { shouldValidate: true });
                                                            setCategoryOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-[#ff6f61]/10 hover:text-[#ff6f61]
                                                        ${selectedCategory === c.value ? 'bg-[#ff6f61]/15 text-[#ff6f61] font-medium' : 'text-gray-700'}`}
                                                    >
                                                        {c.name}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {shopErrors.category &&
                                    (<p className="text-red-500 text-sm mb-1">{shopErrors.category.message}</p>)}
                                {selectedCategory === 'other' && (
                                    <>
                                        <label className="block text-gray-700 mb-1"> Your Category</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Handmade Candles"
                                            className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                                            {...registerShop('customCategory', {
                                                validate: (value) =>
                                                    selectedCategory !== 'other' ||
                                                    (!!value && value.trim().length > 0) ||
                                                    'Please enter your category',
                                            })}
                                        />
                                        {shopErrors.customCategory &&
                                            (<p className="text-red-500 text-sm mb-1">{shopErrors.customCategory.message}</p>)}
                                    </>
                                )}
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
