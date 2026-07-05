import Link from 'next/link'
import React from 'react'
import {Search} from 'lucide-react'
import { PersonIcon } from '@/assets/svgs/profile-icon'
const Header = () => {
  return (
    <div className='w-full bg-white'>
        <div className = 'w-[80%] py-5 m-auto flex items-center justify-between'>
                <div>
                    <Link href = {'/'} >
                        <span className='text-3xl font-[600]'>Eshop</span>
                    </Link>
                </div>
                <div className = "w-[50%] relative">
                    <input type="text " 
                            placeholder="Search..." 
                            className = "w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[55px]"/>
                    <div className = "w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-[#3489FF] absolute top-0 right-0">
                        <Search color="#fff"/>
                    </div>
                    <div className = "flex items-center gap-8" >
                        <div className = "flex items-center gap-2">
                            <Link href = {"/login"}>
                                <PersonIcon />
                            </Link>
                        </div>
                    </div>
                </div>
            
        </div>
    </div>
  )
}

export default Header
