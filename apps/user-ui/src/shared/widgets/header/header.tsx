'use client';
import Link from 'next/link'
import React from 'react'
import { Search, ShoppingCartIcon } from 'lucide-react'
import { HeartIcon } from 'lucide-react'
import { PersonIcon } from '@/assets/svgs/profile-icon'
import HeaderBottom from './header-bottom'
import useUser from '@/hooks/useUser';

const Header = () => {
    const { user, isLoading } = useUser();
    return (
        <div className='w-full bg-white'>
            <div className='w-[80%] py-5 m-auto flex items-center justify-between'>
                <div>
                    <Link href={'/'} >
                        <span className='text-3xl font-[600]'>Eshop</span>
                    </Link>
                </div>
                <div className="w-[50%] relative">
                    <input type="text "
                        placeholder="Search..."
                        className="w-full px-4 font-Poppins font-medium border-[2.5px] border-[#ff6f61] outline-none h-[55px]" />
                    <div className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-[#ff6f61] absolute top-0 right-0">
                        <Search color="#fff" />
                    </div>
                </div>
                <div className="flex items-center gap-8" >

                    {
                        !isLoading && user ? (
                            <div className="flex items-center gap-2">
                                <Link href={"/profile"}
                                    className="border-2 w-[50px] h=[50px] flex items-center justify-center rounded-full border-[#010f1c1a]">
                                    <PersonIcon />
                                </Link>
                                <Link href={"/profile"}>
                                    <span className='block font-medium'>Hello,</span>
                                    <span className='font-semibold'>{user?.name}</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href={"/login"}
                                    className="border-2 w-[50px] h=[50px] flex items-center justify-center rounded-full border-[#010f1c1a]">
                                    <PersonIcon />
                                </Link>
                                <Link href={"/login"}>
                                    <span className='block font-medium'>Hello,</span>
                                    <span className='font-semibold'>Sign In</span>
                                </Link>
                            </div>
                        )
                    }
                    <div className="flex items-center gap-5">
                        <Link href={"/wishlist"} className="relative">
                            <HeartIcon />
                            <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                                <span className='text-white font-medium text-sm'>0</span>
                            </div>
                        </Link>
                        <Link href={"/cart"} className="relative">
                            <ShoppingCartIcon />
                            <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                                <span className='text-white font-medium text-sm'>0</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="border-b border-b-slate-200" />
            <HeaderBottom />

        </div>
    )
}

export default Header
