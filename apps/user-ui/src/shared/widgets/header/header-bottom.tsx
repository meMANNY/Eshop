'use client';

import { navItems, shopCategories } from '@/configs/constants';
import { AlignLeft, ChevronDown, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/shared/components/ui';
import AccountActions from './account-actions';

const HeaderBottom = () => {
  const [showDepartments, setShowDepartments] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const departmentsRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Both panels close on navigation and on Escape, and the departments menu also
  // closes on an outside click — none of which the original did.
  useEffect(() => {
    setShowDepartments(false);
    setShowNav(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDepartments(false);
        setShowNav(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (
        departmentsRef.current &&
        !departmentsRef.current.contains(e.target as Node)
      ) {
        setShowDepartments(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  return (
    <>
      {/*
        Going `fixed` takes the bar out of flow, so without this the page yanked
        upward by the bar's own height the moment you scrolled past 100px. The
        spacer holds that space open.
      */}
      {isSticky ? <div aria-hidden="true" className="h-[60px]" /> : null}
      <div
      className={
        isSticky
          ? 'fixed left-0 top-0 z-[100] w-full border-b border-rule bg-surface/95 shadow-card backdrop-blur transition-shadow'
          : 'relative w-full'
      }
    >
      <Container className="flex items-center gap-4 py-2">
        {/* Departments */}
        <div className="relative shrink-0" ref={departmentsRef}>
          <button
            onClick={() => setShowDepartments((s) => !s)}
            aria-expanded={showDepartments}
            aria-haspopup="true"
            className="flex h-11 items-center gap-2 rounded-lg bg-coral px-4 text-sm font-medium text-[#2b0f0a] transition-colors hover:bg-coral-dim"
          >
            <AlignLeft size={18} aria-hidden="true" />
            <span className="hidden sm:inline">All departments</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform ${showDepartments ? 'rotate-180' : ''}`}
            />
          </button>

          {/*
            This used to open an empty 260×400 grey rectangle — a prominent
            control whose panel had no contents at all. The categories were
            already sitting in configs/constants as `shopCategories`.
          */}
          {showDepartments ? (
            <div className="scroll-slim absolute left-0 top-[52px] z-50 max-h-[420px] w-[280px] overflow-y-auto rounded-card border border-rule bg-surface py-2 shadow-pop">
              {shopCategories.map((category) => (
                <Link
                  key={category.value}
                  href={`/products?category=${encodeURIComponent(category.value)}`}
                  className="block px-4 py-2.5 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-coral-ink"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Primary nav — a row on desktop, a sheet on phones. */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item: NavItem, index: number) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm transition-colors ${
                  isActive
                    ? 'font-medium text-coral-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setShowNav((s) => !s)}
          aria-expanded={showNav}
          aria-label="Browse menu"
          className="ml-auto rounded-lg border border-rule p-2 text-ink-muted md:hidden"
        >
          {showNav ? <X size={18} /> : <AlignLeft size={18} />}
        </button>

        {/*
          The account cluster now rides along only while the bar is stuck to the
          top — same component as the top bar rather than a second copy of it.
        */}
        {isSticky ? (
          <div className="ml-auto hidden md:block">
            <AccountActions compact />
          </div>
        ) : null}
      </Container>

      {showNav ? (
        <Container className="border-t border-rule py-2 md:hidden">
          <nav className="flex flex-col">
            {navItems.map((item: NavItem, index: number) => (
              <Link
                key={index}
                href={item.href}
                className="py-2.5 text-sm text-ink-muted transition-colors hover:text-coral-ink"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </Container>
      ) : null}
      </div>
    </>
  );
};

export default HeaderBottom;
