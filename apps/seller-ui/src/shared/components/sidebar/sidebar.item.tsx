import React from 'react'
import Link from 'next/link';

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href: string;
}

const SidebarItem = ({ icon, title, isActive, href }: Props) => {
  return (
    <Link href={href} className="block" aria-current={isActive ? "page" : undefined}>
      <div
        className={`group relative my-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5
          transition-all duration-200
          ${isActive
            ? "bg-[#ff6f61]/10 text-white"
            : "text-slate-400 hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-slate-100"
          }`}
      >
        {/* "You are here" edge indicator — the signature. Solid + glowing when active,
            a faint ghost on hover to telegraph the affordance. */}
        <span
          aria-hidden="true"
          className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ff6f61]
            transition-all duration-200
            ${isActive
              ? "opacity-100 shadow-[0_0_10px_rgba(255,111,97,0.7)]"
              : "opacity-0 group-hover:opacity-40"
            }`}
        />

        {/* Icon — normalized to 20px regardless of the glyph passed in; inherits color. */}
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-200
            [&>svg]:h-5 [&>svg]:w-5
            ${isActive ? "text-[#ff6f61]" : "text-slate-400 group-hover:text-[#ff8a7d]"}`}
        >
          {icon}
        </span>

        <span className={`text-sm tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
          {title}
        </span>
      </div>
    </Link>
  );
};

export default SidebarItem;
