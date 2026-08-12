'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
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
    const router  = useRouter();


    
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
    <div className = "w-full py-10 min-h-[85vh] bg-sunken">
        <h1 className = "text-4xl font-jost font-semibold text-black text-center ">
            Login
        </h1>
        <p className='text-center text-lg font-medium py-3 text-[#00000099]'>
            HOME . LOGIN
        </p>
        <div className = "w-full flex justify-center">
            <div className = "md:w-[480px] p-8 bg-surface shadow rounded-lg">
                <h3 className = "text-3xl font-semibold text-center mb-2">
                    Login to Eshop
                </h3>
                <p className = "text-center text-[#00000099] mb-6">
                        Don't have an account? <Link href="/signup" className = "text-coral-ink cursor-pointer">Sign Up</Link>
                </p>

                <button
                    type="button"
                    className="group w-full flex items-center justify-center gap-3 border border-[#e0e0e0] rounded-xl py-3 px-4 text-sm font-semibold text-[#000000cc] bg-surface shadow-sm hover:shadow-md hover:border-[#c9c9c9] hover:bg-[#fafafa] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 transition-transform duration-200 group-hover:scale-110">
                        <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.08-6.08C34.46 3.09 29.52 1 24 1 14.82 1 6.98 6.48 3.38 14.34l7.08 5.5C12.13 13.65 17.6 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.97-2.22 5.48-4.72 7.17l7.25 5.63C43.35 37.26 46.52 31.35 46.52 24.5z"/>
                        <path fill="#FBBC05" d="M10.46 28.16A14.6 14.6 0 0 1 9.5 24c0-1.44.2-2.84.55-4.16l-7.08-5.5A23.94 23.94 0 0 0 0 24c0 3.86.92 7.51 2.54 10.74l7.92-6.58z"/>
                        <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.53-4.96l-7.25-5.63c-1.83 1.23-4.17 1.96-6.28 1.96-6.4 0-11.87-4.15-13.54-9.84l-7.92 6.58C6.98 41.52 14.82 47 24 47z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    Sign in with Google
                </button>
                <div className = "flex items-center my-5 text-ink-faint text-sm">
                    <div className = "flex-1 border-t border-rule"/>
                    <span>or Sign in with Email</span>
                    <div className = "flex-1 border-t border-rule"/>

                    
                </div>
                <form onSubmit = {handleSubmit(onSubmit)}>
                        <label className = "block text-ink-muted mb-1"> Email</label>
                        <input
                        type = "email"
                        placeholder = "support@DarkKing.com"
                        className = "w-full p-2 border border-rule outline-0 !rounded mb-1"
                        {...register('email', { 
                            required: 'Email is required',
                            pattern: {
                                value: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
                                message: 'Invalid email address',
                            }
                        })}
                        />
                        {errors.email && 
                        (<p className = "text-neg text-sm mb-1">{errors.email.message}</p>)}
                        <label className = "block text-ink-muted mb-1"> Password</label>
                        <div className = "relative">
                            <input
                            type = {passwordVisible ? 'text' : 'password'}
                            placeholder = "Minimum 6 characters"
                            className = "w-full p-2 border border-rule outline-0 !rounded mb-1"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters',
                                },
                            })}
                            />
                            <button type ="button" onClick={()=>setPasswordVisible(!passwordVisible)}
                            className = "absolute inset-y-0 right-3 flex items-center text-ink-faint" >
                            {passwordVisible ? <Eye/> : <EyeOff/>}
                            </button>
                            {errors.password && 
                            (<p className = "text-neg text-sm mb-1">{errors.password.message}</p>)}

                            
                        </div>
                        <div className = "flex justify-between items-center my-4">
                                <label className = "flex items-center text-ink-muted">
                                    <input
                                    type="checkbox"
                                    className='mr-2'
                                    checked = {rememberMe}
                                    onChange= {()=>setRememberMe(!rememberMe)}/>
                                    Remember Me
                                </label>
                                <Link href="/forgot-password" className="text-coral-ink text-sm hover:underline">
                                    Forgot Password?
                                </Link>
                        </div>
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full bg-coral text-[#2b0f0a] py-2 px-4 rounded font-semibold hover:bg-coral-dim active:scale-[0.99] transition-all duration-200 mt-2 disabled:opacity-60"
                        >
                            {loginMutation.isPending ? 'Logging in...' : 'Login'}
                        </button>
                        {serverError && <p className="text-neg text-sm mt-2">{serverError}</p>}
                    </form>

            </div>
        </div>


    </div>
  )
}

export default Login
