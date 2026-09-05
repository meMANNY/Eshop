'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { navItems } from '@/configs/constants';
import { Container } from '@/shared/components/ui';
import HeaderBottom from './header-bottom';
import AccountActions from './account-actions';

/*
  The masthead. Three ruled bands, in the theme's grammar: the wordmark and
  numbered nav, then the search row in the filesystem voice, then the departments
  bar. Each band is separated by a rule rather than by a colour change or a
  shadow, which is what makes the whole thing read as a printed page header
  instead of a floating app chrome.
*/

const Header = () => {
  const [term, setTerm] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  /*
    The search box was an input with no state, no form and no handler — the most
    prominent control on the storefront and it did nothing at all. It is a real
    form now: submitting takes you to the products page with the term, which that
    page reads and filters on.
  */
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header className="w-full">
      <Container className="flex items-center gap-6 py-5">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-terra-2 transition-transform group-hover:scale-125"
            aria-hidden="true"
          />
          <span className="font-display text-lg font-medium tracking-tight text-ink">
            Eshop
          </span>
          {/* The mono suffix is the theme's way of naming what a thing *is*
              without spending a second line of copy on it. */}
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400 lg:inline">
            /marketplace
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 lg:flex">
          {navItems.map((item: NavItem, index: number) => {
            const isActive = pathname === item.href;
            // "Become a Seller" points at the seller app, so it wears the
            // external arrow rather than an index.
            const isExternal = item.href.startsWith('http');
            return (
              <Link
                key={index}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-baseline gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-400 hover:text-ink'
                }`}
              >
                {isExternal ? null : (
                  <span className="text-[9px] text-terra-2" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <span>{item.title}</span>
                {isExternal ? (
                  <span
                    className="text-[10px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                ) : null}
                {isActive ? (
                  <span
                    className="absolute -bottom-1.5 left-0 h-px w-full bg-terra-2"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto shrink-0 lg:ml-0">
          <AccountActions />
        </div>
      </Container>

      {/*
        The search row, ruled off above and below. The mono `~/search` prefix cell
        is not decoration: it tells you the shape of the thing you are about to
        type into, the same way the sys-strip labels a page.
      */}
      <div className="border-t border-ink-line">
        <Container className="py-3">
          <form onSubmit={onSearch} role="search">
            <div className="flex items-stretch border border-ink-line bg-paper">
              <span
                className="hidden shrink-0 items-center border-r border-ink-line bg-surface px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400 sm:flex"
                aria-hidden="true"
              >
                ~/search
              </span>
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                aria-label="Search products"
                placeholder="Search products, brands and shops…"
                className="w-full bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:font-mono placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.1em] placeholder:text-ink-400"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid w-12 shrink-0 place-items-center bg-ink font-mono text-sm text-paper transition-colors hover:bg-terra hover:text-white"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </Container>
      </div>

      <HeaderBottom />
    </header>
  );
};

export default Header;
