import Link from "next/link";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  href: string;
}

export default function SidebarItem({ icon, title, isActive, href }: Props) {
  return (
    <Link
      href={href}
      /*
        `aria-current` is what tells a screen reader which route you are on. The
        coral marker and the tint say the same thing to everyone else.
      */
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm transition-colors ${
        isActive
          ? "bg-coral-soft font-medium text-coral"
          : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
      }`}
    >
      {isActive ? (
        /* Anchored to the item's left edge so the rail reads as one column. */
        <span
          className="marker absolute -left-2 top-1/2 h-5 -translate-y-1/2"
          aria-hidden="true"
        />
      ) : null}
      {/* Icons inherit the row's colour, so the active state needs no second rule. */}
      <span className="shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
      <span className="truncate">{title}</span>
    </Link>
  );
}
