import React from 'react'

interface Props{
  title: string;
  children: React.ReactNode;
}
const SidebarMenu = ({title, children}: Props) => {
  return (
    <div className='w-full flex flex-col gap-4 mt-6'>
      <h2 className='text-lg font-bold tracking-wide text-slate-400 uppercase'>
        {title}
      </h2>
      <ul className='space-y-2'>
        {children}
      </ul>
      
    </div>
  )
}

export default SidebarMenu