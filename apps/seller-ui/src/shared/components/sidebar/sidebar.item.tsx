import React from "react";
import Link from "next/link";

interface Props {
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  href: string;
  /** Position in the flattened rail, rendered as a zero-padded numeral. */
  index?: number;
}

/*
  The rail item in the editorial voice: a mono uppercase label with its own index
  numeral, marked active by a 1px terracotta hairline on the leading edge rather
  than by a tinted, rounded tab with a glow. The index is not decoration — it
  gives every destination a stable short name ("06 all products") the way a
  printed contents page does.
*/
const SidebarItem = ({ icon, title, isActive, href, index }: Props) => {
  return (
    <Link href={href} className="block" aria-current={isActive ? "page" : undefined}>
      <div
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-200 ${
          isActive ? "text-on-ink" : "text-on-ink-muted hover:text-on-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 transition-colors duration-200 ${
            isActive
              ? "bg-terra-2"
              : "bg-transparent group-hover:bg-on-ink-faint"
          }`}
        />

        {index != null ? (
          <span
            aria-hidden="true"
            className="w-4 shrink-0 font-mono text-[9px] tracking-[0.1em] text-terra-2"
          >
            {String(index).padStart(2, "0")}
          </span>
        ) : null}

        {/* Normalised to 16px regardless of the glyph passed in. */}
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center transition-colors duration-200 [&>svg]:h-4 [&>svg]:w-4 ${
            isActive ? "text-terra" : "text-on-ink-faint group-hover:text-terra"
          }`}
        >
          {icon}
        </span>

        <span className="truncate font-mono text-[11px] uppercase tracking-[0.14em]">
          {title}
        </span>
      </div>
    </Link>
  );
};

export default SidebarItem;
