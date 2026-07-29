import React from 'react'

interface Props {
  title: string;
  children: React.ReactNode;
}
const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className='mt-6 flex w-full flex-col gap-1'>
      <h2 className='px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
        {title}
      </h2>
      <ul className='space-y-0.5'>
        {children}
      </ul>
    </div>
  )
}

export default SidebarMenu
