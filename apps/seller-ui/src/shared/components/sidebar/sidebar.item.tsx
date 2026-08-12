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
          transition-colors duration-200
          ${isActive
            ? "bg-coral-soft text-white"
            : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
          }`}
      >
        {/* "You are here" edge indicator — the signature. Solid and glowing when
            active, a faint ghost on hover to telegraph the affordance. */}
        <span
          aria-hidden="true"
          className={`marker absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-l-none
            transition-opacity duration-200
            ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
        />

        {/* Normalised to 20px regardless of the glyph passed in; inherits colour. */}
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-200
            [&>svg]:h-5 [&>svg]:w-5
            ${isActive ? "text-coral" : "text-[var(--muted)] group-hover:text-coral-bright"}`}
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
