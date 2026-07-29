import React from 'react'
import Link from 'next/link';

interface Props{
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href: string;
}
const SidebarItem = ({icon,title,isActive,href}: Props) => {
  return (
    
      <Link href={href} className = "my-2 block">
        <div className={`flex
         items-center
          gap-3
           px-3
            py-2
             rounded-md
              transition-all
               duration-200
                ${isActive
            ? "bg-primary text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
      >
        {icon}
        <h5>{title}</h5>
        </div>
      </Link>
    
  )
}

export default SidebarItem