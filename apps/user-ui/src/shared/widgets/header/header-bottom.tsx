'use client';

import { navItems, shopCategories } from '@/configs/constants';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/shared/components/ui';
import AccountActions from './account-actions';

/*
  The departments bar, and the sheet the whole navigation collapses into on a
  phone. The mobile menu is a full-bleed ink takeover rather than a dropdown: on
  a cream page, inverting the entire screen is an unmistakable "you are in the
  menu now", and it costs no extra chrome to say it.
*/

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

  // The full-screen menu takes over the viewport, so the page behind it must not
  // keep scrolling underneath.
  useEffect(() => {
    if (!showNav) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showNav]);

  return (
    <>
      {/*
        Going `fixed` takes the bar out of flow, so without this the page yanked
        upward by the bar's own height the moment you scrolled past 100px. The
        spacer holds that space open.
      */}
      {isSticky ? <div aria-hidden="true" className="h-[57px]" /> : null}
      <div
        className={
          isSticky
            ? 'fixed left-0 top-0 z-[100] w-full border-b border-ink-line bg-paper/95 backdrop-blur'
            : 'relative w-full border-y border-line'
        }
      >
        <Container className="flex items-center gap-4 py-2.5">
          {/* The wordmark only rides along once the masthead has scrolled away. */}
          {isSticky ? (
            <Link href="/" className="group flex shrink-0 items-baseline gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-terra-2 transition-transform group-hover:scale-125"
                aria-hidden="true"
              />
              <span className="font-display text-base font-medium tracking-tight text-ink">
                Eshop
              </span>
            </Link>
          ) : null}

          {/* Departments */}
          <div className="relative shrink-0" ref={departmentsRef}>
            <button
              onClick={() => setShowDepartments((s) => !s)}
              aria-expanded={showDepartments}
              aria-haspopup="true"
              className="btn-ghost btn-mono !py-2"
            >
              <span aria-hidden="true">≡</span>
              <span className="hidden sm:inline">departments</span>
              <span
                aria-hidden="true"
                className={`transition-transform ${showDepartments ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>

            {/*
              This used to open an empty 260×400 grey rectangle — a prominent
              control whose panel had no contents at all. The categories were
              already sitting in configs/constants as `shopCategories`.
            */}
            {showDepartments ? (
              <div className="scroll-slim absolute left-0 top-[46px] z-50 max-h-[420px] w-[300px] overflow-y-auto border border-ink-line bg-paper py-1 shadow-pop">
                {shopCategories.map((category, i) => (
                  <Link
                    key={category.value}
                    href={`/products?category=${encodeURIComponent(category.value)}`}
                    className="flex items-baseline gap-2.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 transition-colors hover:bg-surface hover:text-terra-2"
                  >
                    <span className="text-[9px] text-terra-2" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {category.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <button
            onClick={() => setShowNav(true)}
            aria-expanded={showNav}
            aria-label="Browse menu"
            className="ml-auto flex h-9 w-9 flex-col items-center justify-center gap-[5px] border border-ink-line text-ink lg:hidden"
          >
            <span className="block h-px w-4 bg-current" aria-hidden="true" />
            <span className="block h-px w-4 bg-current" aria-hidden="true" />
          </button>

          {/*
            The account cluster rides along only while the bar is stuck to the
            top — same component as the masthead rather than a second copy of it.
          */}
          {isSticky ? (
            <div className="ml-auto hidden lg:block">
              <AccountActions compact />
            </div>
          ) : null}
        </Container>
      </div>

      {/* The ink takeover. */}
      {showNav ? (
        <div className="fixed inset-0 z-[200] flex flex-col bg-ink text-on-ink lg:hidden">
          <div className="flex items-center justify-between border-b border-ink-border px-4 py-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra">
              ~/menu
            </span>
            <button
              onClick={() => setShowNav(false)}
              aria-label="Close menu"
              className="font-mono text-sm uppercase tracking-[0.14em] text-on-ink-muted transition-colors hover:text-on-ink"
            >
              esc ×
            </button>
          </div>

          <nav className="flex flex-col gap-6 px-4 pt-12">
            {navItems.map((item: NavItem, index: number) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setShowNav(false)}
                className="flex items-baseline gap-4 font-display text-2xl tracking-tight text-on-ink/70 transition-colors hover:text-on-ink"
              >
                <span className="font-mono text-xs text-terra-2" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
};

export default HeaderBottom;
