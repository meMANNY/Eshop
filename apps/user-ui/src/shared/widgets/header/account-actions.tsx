'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, User } from 'lucide-react';
import useUser from '@/hooks/useUser';
import { useStore } from '@/store';

/**
 * Account + wishlist + cart. This block existed twice — once in the top bar and
 * once inside the sticky bar — as two hand-maintained copies. They had already
 * drifted: the top-bar copy wrote `h=[50px]` instead of `h-[50px]`, so its avatar
 * circle had no height at all and collapsed.
 */
export default function AccountActions({ compact = false }: { compact?: boolean }) {
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  const href = !isLoading && user ? '/profile' : '/login';

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <Link
        href={href}
        className="group flex items-center gap-2.5"
        aria-label={user ? `Your account, ${user.name}` : 'Sign in'}
      >
        {/* Square, like every other frame in this theme. The one round shape in
            the system belongs to buttons. */}
        <span className="grid h-9 w-9 shrink-0 place-items-center border border-ink-line text-ink-500 transition-colors group-hover:bg-ink group-hover:text-paper">
          <User size={16} />
        </span>
        {!compact ? (
          <span className="hidden leading-tight sm:block">
            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-400">
              {user ? 'Hello' : 'Welcome'}
            </span>
            <span className="block max-w-[140px] truncate font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink">
              {isLoading ? '…' : (user?.name ?? 'Sign in')}
            </span>
          </span>
        ) : null}
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        <CountLink
          href="/wishlist"
          label="Wishlist"
          count={wishlist?.length ?? 0}
          icon={<Heart size={19} />}
        />
        <CountLink
          href="/cart"
          label="Cart"
          count={cart?.length ?? 0}
          icon={<ShoppingBag size={19} />}
        />
      </div>
    </div>
  );
}

function CountLink({
  href,
  label,
  count,
  icon,
}: {
  href: string;
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative p-1 text-ink-500 transition-colors hover:text-terra-2"
      aria-label={count > 0 ? `${label}, ${count} items` : `${label}, empty`}
    >
      {icon}
      {/*
        The badge only exists when there is something to count. Both bars used to
        render it unconditionally, so an empty cart wore a red "0" bubble —
        drawing the eye to nothing.
      */}
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center bg-terra-2 px-1 text-[10px] font-semibold text-paper ring-2 ring-paper">
          <span className="figure">{count > 99 ? '99+' : count}</span>
        </span>
      ) : null}
    </Link>
  );
}
