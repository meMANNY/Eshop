'use client';
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

type FormData = {
    email: string;
    password: string;
}

const Login = () => {

    const [password, setPassword] = useState('');
    const [serverError, setServerError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const router  = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();
    

  return (
    <div className = "w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
        <h1 className = "text-4xl font-Poppins font-semibold text-black text-center ">
            Login
        </h1>
        <p className='text-center text-lg font-medium py-3 text-[#00000099]'>
            HOME . LOGIN
        </p>
    </div>
  )
}

export default Login
