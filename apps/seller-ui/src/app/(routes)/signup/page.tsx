'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, UserRound, Store, Landmark, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import countries from '@/utils/countries';
import categories from '@/utils/categories';
import axios, { AxiosError } from 'axios';
import {
    FormError,
    OTP_LENGTH,
    OtpInput,
    PasswordField,
    ResendLine,
    useResendTimer,
} from '@/shared/components/auth';

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

const Signup = () => {

    const [activeStep, setActiveStep] = useState(1);
    const [serverError, setServerError] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [sellerData, setSellerData] = useState<AccountData | null>(null);
    const [sellerId, setSellerId] = useState<string | null>(null);

    const router = useRouter();
    const resend = useResendTimer(60);

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

    // Step 1a: register the seller account and trigger the OTP email
    const signupMutation = useMutation({
        mutationFn: async (data: AccountData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/seller-registration`, data);
            return response.data;
        },
        onSuccess: (_, formData) => {
            setSellerData(formData);
            setServerError('');
            setOtp(Array(OTP_LENGTH).fill(''));
            setShowOtp(true);
            resend.start();
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
        if (!resend.canResend || !sellerData) return;
        setOtp(Array(OTP_LENGTH).fill(''));
        resend.start();
        signupMutation.mutate(sellerData);
    };

    /*
      Shared field styling — kept in sync with the seller login page. Both were
      white forms with grey borders while the whole dashboard behind them is
      near-black; signing up looked like a different product from the thing you
      were signing up for. These six constants are where that lived, so this is
      where it's fixed.
    */
    const labelCls = 'mb-1.5 block text-label font-semibold uppercase text-[var(--muted)]';
    const inputCls = 'w-full rounded-lg border border-rule bg-raised px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-coral/60';
    const triggerCls = 'flex w-full items-center justify-between rounded-lg border border-rule bg-raised px-3.5 py-2.5 text-left text-sm text-[var(--text)] outline-none transition-colors focus:border-coral/60';
    const menuCls = 'absolute z-20 max-h-60 w-full overflow-auto rounded-xl border border-rule bg-panel shadow-pop';
    const errorCls = 'mt-1.5 text-xs text-neg';
    const submitCls = 'mt-2 w-full rounded-lg bg-coral py-2.5 text-sm font-medium text-[#1a0d0b] transition-colors hover:bg-coral-dim disabled:cursor-not-allowed disabled:opacity-60';

    // left-rail metadata — labels + icons for the setup journey
    const stepMeta = [
        { label: 'Create account', desc: 'Your sign-in details', Icon: UserRound },
        { label: 'Register shop', desc: 'Name, bio & category', Icon: Store },
        { label: 'Connect payouts', desc: 'Get paid via Stripe', Icon: Landmark },
    ];

    return (
        <div className="flex min-h-screen w-full bg-ink">

            {/* ── Left: setup-rail panel (storefront at night) ──────────── */}
            <aside className="relative hidden lg:flex lg:sticky lg:top-0 h-screen w-[42%] flex-col justify-between overflow-hidden bg-[#171310] px-12 py-10 text-white">
                {/* ambient coral glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,111,97,0.28),transparent_58%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_100%,rgba(255,111,97,0.14),transparent_55%)]" />

                {/* brand */}
                <div className="relative flex items-center gap-3">
                    <span className="font-display text-2xl font-bold tracking-tight">Zshop</span>
                    <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                        Seller
                    </span>
                </div>

                {/* signature: headline + live setup rail */}
                <div className="relative">
                    <h1 className="max-w-sm font-display text-4xl font-semibold leading-tight">
                        Let&apos;s open<br />your shop.
                    </h1>
                    <p className="mt-4 mb-10 max-w-sm text-[15px] leading-relaxed text-white/55">
                        Three quick steps and your storefront is live.
                    </p>

                    <ol className="relative space-y-7">
                        {stepMeta.map((step, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = activeStep > stepNumber;
                            const isActive = activeStep === stepNumber;
                            const Icon = step.Icon;
                            return (
                                <li key={step.label} className="relative flex items-start gap-4">
                                    {/* connector to the next node */}
                                    {stepNumber < stepMeta.length && (
                                        <span
                                            className={`absolute left-[19px] top-11 h-7 w-px transition-colors duration-300
                                            ${isCompleted ? 'bg-[#ff6f61]' : 'bg-white/15'}`}
                                        />
                                    )}
                                    <span
                                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300
                                        ${isCompleted
                                                ? 'border-[#ff6f61] bg-[#ff6f61] text-white'
                                                : isActive
                                                    ? 'border-[#ff6f61] bg-white/[0.04] text-[#ff8a7d] shadow-[0_0_18px_rgba(255,111,97,0.55)]'
                                                    : 'border-white/15 text-white/40'}`}
                                    >
                                        {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                                    </span>
                                    <div className="pt-0.5">
                                        <p className={`text-[15px] font-medium ${isActive || isCompleted ? 'text-white' : 'text-white/45'}`}>
                                            {step.label}
                                        </p>
                                        <p className={`text-[13px] ${isActive ? 'text-white/60' : 'text-white/35'}`}>
                                            {step.desc}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* trust footer */}
                <div className="relative flex items-center gap-2 text-sm text-white/45">
                    <ShieldCheck size={16} className="text-[#ff8a7d]" /> Secured with bank-grade encryption
                </div>
            </aside>

            {/* ── Right: form column ────────────────────────────────────── */}
            <main className="flex min-h-screen w-full items-start justify-center px-6 py-12 lg:w-[58%] lg:items-center">
                <div className="fade-up w-full max-w-[440px]">

                    {/* mobile brand */}
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <span className="font-display text-xl font-bold tracking-tight text-white">Zshop</span>
                        <span className="rounded-full border border-rule px-2 py-0.5 text-label font-semibold uppercase text-[var(--muted)]">
                            Seller
                        </span>
                    </div>

                    {/* mobile stepper (left rail is hidden on small screens) */}
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        {stepMeta.map((step, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = activeStep > stepNumber;
                            const isActive = activeStep === stepNumber;
                            return (
                                <React.Fragment key={step.label}>
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors
                                        ${isCompleted || isActive ? 'border-[#ff6f61] bg-[#ff6f61] text-white' : 'border-rule text-[var(--faint)]'}`}
                                    >
                                        {isCompleted ? <Check size={16} /> : stepNumber}
                                    </span>
                                    {stepNumber < stepMeta.length && (
                                        <span className={`h-px flex-1 ${activeStep > stepNumber ? 'bg-[#ff6f61]' : 'bg-rule'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* STEP 1 — Create Account */}
                    {activeStep === 1 && (
                        !showOtp ? (
                            <>
                                <h2 className="font-display text-3xl font-semibold text-white">Create your account</h2>
                                <p className="mt-2 text-[15px] text-[var(--muted)]">
                                    Already selling with us? <Link href="/login" className="font-medium text-[#ff6f61] hover:underline">Sign in</Link>
                                </p>

                                <form onSubmit={handleSubmitAccount(onSubmitAccount)} className="mt-7 space-y-4">
                                    <div>
                                        <label htmlFor="name" className={labelCls}>Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            placeholder="Dark King"
                                            className={inputCls}
                                            {...registerAccount('name', {
                                                required: 'Name is required',
                                            })}
                                        />
                                        {accountErrors.name &&
                                            (<p className={errorCls}>{accountErrors.name.message}</p>)}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className={labelCls}>Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="support@darkking.com"
                                            className={inputCls}
                                            {...registerAccount('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
                                                    message: 'Invalid email address',
                                                }
                                            })}
                                        />
                                        {accountErrors.email &&
                                            (<p className={errorCls}>{accountErrors.email.message}</p>)}
                                    </div>

                                    <div>
                                        <label className={labelCls}>Country</label>
                                        <div className="relative" ref={countryRef}>
                                            {/* registered hidden field so react-hook-form tracks + validates the value */}
                                            <input
                                                type="hidden"
                                                {...registerAccount('country', { required: 'Country is required' })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCountryOpen((prev) => !prev)}
                                                className={triggerCls}
                                            >
                                                <span className={selectedCountry ? 'text-[var(--text)]' : 'text-[var(--faint)]'}>
                                                    {selectedCountry
                                                        ? countries.find((c) => c.code === selectedCountry)?.name
                                                        : 'Select a country'}
                                                </span>
                                                <ChevronDown
                                                    size={18}
                                                    className={`text-[var(--faint)] transition-transform duration-200 ${countryOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {countryOpen && (
                                                <ul className={`${menuCls} mt-2`}>
                                                    {countries.map((c) => (
                                                        <li key={c.code}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setValueAccount('country', c.code, { shouldValidate: true });
                                                                    setCountryOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-[#ff6f61]/10 hover:text-[#ff6f61]
                                                                ${selectedCountry === c.code ? 'bg-coral-soft font-medium text-coral' : 'text-[var(--muted)]'}`}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        {accountErrors.country &&
                                            (<p className={errorCls}>{accountErrors.country.message}</p>)}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className={labelCls}>Phone number</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            placeholder="9876543210"
                                            className={inputCls}
                                            {...registerAccount('phone_number', {
                                                required: 'Phone number is required',
                                                pattern: {
                                                    value: /^\d{10}$/,
                                                    message: 'Phone number must be exactly 10 digits',
                                                },
                                            })}
                                        />
                                        {accountErrors.phone_number &&
                                            (<p className={errorCls}>{accountErrors.phone_number.message}</p>)}
                                    </div>

                                    <PasswordField
                                        label="Password"
                                        id="password"
                                        autoComplete="new-password"
                                        placeholder="At least 6 characters"
                                        error={accountErrors.password?.message}
                                        {...registerAccount('password', {
                                            required: 'Choose a password',
                                            minLength: {
                                                value: 6,
                                                message: 'Use at least 6 characters',
                                            },
                                        })}
                                    />

                                    <button
                                        type="submit"
                                        disabled={signupMutation.isPending}
                                        className={submitCls}
                                    >
                                        {signupMutation.isPending ? 'Creating account…' : 'Create account'}
                                    </button>
                                    <FormError>{serverError}</FormError>
                                </form>
                            </>
                        ) : (
                            <>
                                {/*
                                  There was no way back from here. Mistype your
                                  email on the previous screen and the only exit
                                  was reloading the page and starting over.
                                */}
                                <button
                                    type="button"
                                    onClick={() => { setShowOtp(false); setServerError(''); }}
                                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-white"
                                >
                                    <ArrowLeft size={15} aria-hidden="true" />
                                    Change details
                                </button>

                                <h2 className="font-display text-3xl font-semibold text-white">Verify your email</h2>
                                <p className="mt-2 text-[15px] text-[var(--muted)]">
                                    Enter the {OTP_LENGTH}-digit code we sent to <span className="font-medium text-white">{sellerData?.email}</span>.
                                </p>

                                <div className="mt-7">
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={verifyOtpMutation.isPending}
                                    />
                                </div>

                                <div className="mt-6 space-y-4">
                                    <FormError>{serverError}</FormError>

                                    <button
                                        type="button"
                                        onClick={verifyOtp}
                                        disabled={verifyOtpMutation.isPending || otp.some((d) => d === '')}
                                        className={submitCls}
                                    >
                                        {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify email'}
                                    </button>

                                    <ResendLine
                                        remaining={resend.remaining}
                                        canResend={resend.canResend}
                                        onResend={resendOtp}
                                    />
                                </div>
                            </>
                        )
                    )}

                    {/* STEP 2 — Register Shop */}
                    {activeStep === 2 && (
                        <>
                            <h2 className="font-display text-3xl font-semibold text-white">Register your shop</h2>
                            <p className="mt-2 text-[15px] text-[var(--muted)]">
                                Tell customers who you are.
                            </p>

                            <form onSubmit={handleSubmitShop(onSubmitShop)} className="mt-7 space-y-4">
                                <div>
                                    <label htmlFor="shopName" className={labelCls}>Shop name</label>
                                    <input
                                        id="shopName"
                                        type="text"
                                        placeholder="Dark King Store"
                                        className={inputCls}
                                        {...registerShop('shopName', {
                                            required: 'Shop name is required',
                                        })}
                                    />
                                    {shopErrors.shopName &&
                                        (<p className={errorCls}>{shopErrors.shopName.message}</p>)}
                                </div>

                                <div>
                                    <label htmlFor="bio" className={labelCls}>Bio (max 100 words)</label>
                                    <input
                                        id="bio"
                                        type="text"
                                        placeholder="A short description of your shop"
                                        className={inputCls}
                                        {...registerShop('bio', {
                                            required: 'Shop bio is required',
                                            validate: (value) =>
                                                value.trim().split(/\s+/).length <= 100 || 'Bio must be 100 words or less',
                                        })}
                                    />
                                    {shopErrors.bio &&
                                        (<p className={errorCls}>{shopErrors.bio.message}</p>)}
                                </div>

                                <div>
                                    <label htmlFor="address" className={labelCls}>Address</label>
                                    <input
                                        id="address"
                                        type="text"
                                        placeholder="Shop address"
                                        className={inputCls}
                                        {...registerShop('address', {
                                            required: 'Shop address is required',
                                        })}
                                    />
                                    {shopErrors.address &&
                                        (<p className={errorCls}>{shopErrors.address.message}</p>)}
                                </div>

                                <div>
                                    <label htmlFor="openingHours" className={labelCls}>Opening hours</label>
                                    <input
                                        id="openingHours"
                                        type="text"
                                        placeholder="Mon - Fri, 9:00 AM - 6:00 PM"
                                        className={inputCls}
                                        {...registerShop('openingHours', {
                                            required: 'Opening hours are required',
                                        })}
                                    />
                                    {shopErrors.openingHours &&
                                        (<p className={errorCls}>{shopErrors.openingHours.message}</p>)}
                                </div>

                                <div>
                                    <label htmlFor="website" className={labelCls}>Website</label>
                                    <input
                                        id="website"
                                        type="text"
                                        placeholder="https://darkking.com"
                                        className={inputCls}
                                        {...registerShop('website', {
                                            pattern: {
                                                value: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
                                                message: 'Enter a valid URL (e.g. https://darkking.com)',
                                            },
                                        })}
                                    />
                                    {shopErrors.website &&
                                        (<p className={errorCls}>{shopErrors.website.message}</p>)}
                                </div>

                                <div>
                                    <label className={labelCls}>Category</label>
                                    <div className="relative" ref={categoryRef}>
                                        {/* registered hidden field so react-hook-form tracks + validates the value */}
                                        <input
                                            type="hidden"
                                            {...registerShop('category', { required: 'Category is required' })}
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleCategory}
                                            className={triggerCls}
                                        >
                                            <span className={selectedCategory ? 'text-[var(--text)]' : 'text-[var(--faint)]'}>
                                                {selectedCategory
                                                    ? categories.find((c) => c.value === selectedCategory)?.name
                                                    : 'Select a category'}
                                            </span>
                                            <ChevronDown
                                                size={18}
                                                className={`text-[var(--faint)] transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {categoryOpen && (
                                            <ul className={`${menuCls} ${categoryDropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                                {categories.map((c) => (
                                                    <li key={c.value}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setValueShop('category', c.value, { shouldValidate: true });
                                                                setCategoryOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 hover:bg-[#ff6f61]/10 hover:text-[#ff6f61]
                                                            ${selectedCategory === c.value ? 'bg-coral-soft font-medium text-coral' : 'text-[var(--muted)]'}`}
                                                        >
                                                            {c.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    {shopErrors.category &&
                                        (<p className={errorCls}>{shopErrors.category.message}</p>)}
                                </div>

                                {selectedCategory === 'other' && (
                                    <div>
                                        <label htmlFor="customCategory" className={labelCls}>Your category</label>
                                        <input
                                            id="customCategory"
                                            type="text"
                                            placeholder="e.g. Handmade Candles"
                                            className={inputCls}
                                            {...registerShop('customCategory', {
                                                validate: (value) =>
                                                    selectedCategory !== 'other' ||
                                                    (!!value && value.trim().length > 0) ||
                                                    'Please enter your category',
                                            })}
                                        />
                                        {shopErrors.customCategory &&
                                            (<p className={errorCls}>{shopErrors.customCategory.message}</p>)}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={createShopMutation.isPending}
                                    className={submitCls}
                                >
                                    {createShopMutation.isPending ? 'Saving…' : 'Register shop'}
                                </button>
                                <FormError>{serverError}</FormError>
                            </form>
                        </>
                    )}

                    {/* STEP 3 — Connect to Bank */}
                    {activeStep === 3 && (
                        <>
                            <h2 className="font-display text-3xl font-semibold text-white">Connect payouts</h2>
                            <p className="mt-2 text-[15px] text-[var(--muted)]">
                                Link a bank account through Stripe so your sales reach you.
                            </p>

                            <div className="mt-7 rounded-xl border border-rule bg-raised p-4">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff6f61]/12 text-[#ff6f61]">
                                        <Landmark size={18} />
                                    </span>
                                    <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                                        You&apos;ll be taken to Stripe to add your bank details securely. Zshop never sees or stores them.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => connectBankMutation.mutate()}
                                disabled={connectBankMutation.isPending}
                                className={submitCls + ' mt-5'}
                            >
                                {connectBankMutation.isPending ? 'Connecting…' : 'Connect with Stripe'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="mt-3 w-full rounded-lg py-2.5 font-medium text-[var(--muted)] transition-colors duration-200 hover:text-white"
                            >
                                Skip for now
                            </button>
                            <FormError>{serverError}</FormError>
                        </>
                    )}

                </div>
            </main>
        </div>
    )
}

export default Signup
