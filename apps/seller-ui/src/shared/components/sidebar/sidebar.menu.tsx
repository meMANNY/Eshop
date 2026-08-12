import React from 'react'

interface Props {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className='mt-6 flex w-full flex-col gap-1 first:mt-0'>
      <h2 className='px-3 text-label font-semibold uppercase text-[var(--faint)]'>
        {title}
      </h2>
      {/*
        The children are <SidebarItem> components, which render an anchor — not
        <li>. A <ul> whose children aren't list items is invalid, and screen
        readers announce a list with zero entries.
      */}
      <div className='space-y-0.5'>
        {children}
      </div>
    </div>
  )
}

export default SidebarMenu
