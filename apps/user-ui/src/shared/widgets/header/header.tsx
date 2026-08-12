'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Container } from '@/shared/components/ui';
import HeaderBottom from './header-bottom';
import AccountActions from './account-actions';

const Header = () => {
  const [term, setTerm] = useState('');
  const router = useRouter();

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
    <header className="w-full bg-surface">
      <Container className="flex items-center gap-4 py-4 lg:gap-8">
        <Link href="/" className="shrink-0">
          <span className="font-jost text-2xl font-bold tracking-[-0.02em] text-ink lg:text-3xl">
            Zshop
          </span>
        </Link>

        {/* On phones the field moves to its own row below, so it isn't squeezed
            between the wordmark and the cart. */}
        <form
          onSubmit={onSearch}
          role="search"
          className="hidden flex-1 md:block"
        >
          <div className="flex items-stretch overflow-hidden rounded-lg border-2 border-coral">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Search products"
              placeholder="Search for products, brands and shops…"
              className="w-full bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              aria-label="Search"
              className="grid w-14 shrink-0 place-items-center bg-coral text-[#2b0f0a] transition-colors hover:bg-coral-dim"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        <div className="ml-auto shrink-0 md:ml-0">
          <AccountActions />
        </div>
      </Container>

      {/* Phone-width search row. */}
      <Container className="pb-4 md:hidden">
        <form onSubmit={onSearch} role="search">
          <div className="flex items-stretch overflow-hidden rounded-lg border-2 border-coral">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Search products"
              placeholder="Search products…"
              className="w-full bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              aria-label="Search"
              className="grid w-12 shrink-0 place-items-center bg-coral text-[#2b0f0a]"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      </Container>

      <div className="border-b border-rule" />
      <HeaderBottom />
    </header>
  );
};

export default Header;
