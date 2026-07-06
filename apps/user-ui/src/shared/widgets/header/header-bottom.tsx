'use client';
import { navItems } from '@/configs/constants';
import { AlignLeft, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import Link from 'next/link';

const HeaderBottom = () => {

    const [show, setShow] = useState(false);
    const [isSticky, setIsSticky] = useState(false);

    //track scroll position

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return  (
        <div className={`w-full transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'}`}>
            <div className = {`w-[80%] relative m-auto flex items-center justify-between ${isSticky ? 'pt-3' : 'py-0'}`}>
                {/* Add your header dropdowns here */}
                <div className = {`w-[260px] 
                ${isSticky && '-mb-2'} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489ff]`}
                onClick = {() => setShow(!show)}>
                    <div className = "flex items-center gap-2">
                        <AlignLeft color = "white"/>
                        <span className = "text-white font-medium">All Departments</span>
                    </div>
                    <ChevronDown color = "white"/>
                </div>
                {/*Dropdown menu*/}
                {show && (
                    <div className = {
                        `absolute left-0 ${isSticky ? 
                            'top-[70px]' : "top-[50px]"
                        } w-[260px] h-[400px] bg-[#f5f5f5]`}>

                    </div>
                )}
                {/*Navigation links*/}
                <div className = "flex items-center gap-5">
                    {navItems.map((item : NavItem, index: number) => (
                        <Link key={index} href={item.href} className="text-gray-700 hover:text-gray-900">
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )


  
}

export default HeaderBottom;
