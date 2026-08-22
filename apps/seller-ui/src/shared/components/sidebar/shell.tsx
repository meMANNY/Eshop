"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarBarWrapper from "./sidebar";

/**
 * The app shell. Below `md` the rail becomes a drawer rather than eating the
 * screen or vanishing — `sidebar.styles.tsx` had a `Wrapper` and an `Overlay`
 * written for exactly this, but nothing ever rendered them, so the rail simply
 * sat at 280px on a phone.
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
      <aside className="scroll-none sticky top-0 hidden h-screen w-[260px] shrink-0 overflow-y-auto border-r border-rule bg-panel px-4 py-5 md:block">
        <SidebarBarWrapper />
      </aside>

      {/* Drawer, below md. */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
          />
          <aside className="scroll-none absolute inset-y-0 left-0 w-[276px] overflow-y-auto border-r border-rule bg-panel px-4 py-5">
            <SidebarBarWrapper />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only bar. On md and up the rail already carries the shop name. */}
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-rule bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="rounded-lg border border-rule bg-raised p-2 text-[var(--text)]"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="font-display text-sm font-bold text-white">
            Eshop Seller
          </span>
        </div>

        {/*
          `min-w-0` is what lets wide tables and charts scroll inside their own
          container instead of stretching this flex item and pushing the page
          sideways.
        */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
