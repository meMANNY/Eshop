"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "./index";

/**
 * The app shell. Below `md` the rail becomes a drawer rather than disappearing —
 * a console with no route list on a narrow screen is a console you can only use
 * one page of.
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navigating is the end of the drawer's job; leaving it open would cover the
  // page you just asked for.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes it, matching every other dismissible layer on the web.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Persistent rail, md and up. */}
      <aside className="ink-section scroll-none sticky top-0 hidden h-screen w-[248px] shrink-0 overflow-y-auto border-r border-ink-border px-4 py-5 md:block">
        <SidebarWrapper />
      </aside>

      {/* Drawer, below md. */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/80 backdrop-blur-sm"
          />
          <aside className="scroll-none absolute inset-y-0 left-0 w-[268px] overflow-y-auto border-r border-ink-border bg-ink px-4 py-5">
            <SidebarWrapper />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only bar. On md and up the rail already carries the wordmark. */}
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-ink-border bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] border border-ink-border text-on-ink"
          >
            <span className="block h-px w-4 bg-current" aria-hidden="true" />
            <span className="block h-px w-4 bg-current" aria-hidden="true" />
          </button>
          <span className="flex items-baseline gap-2">
            <span className="font-display text-base font-medium tracking-tight text-on-ink">
              Eshop
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-on-ink-faint">
              /ops
            </span>
          </span>
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
