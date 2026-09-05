'use client';

import useSeller from "@/hooks/useSeller";
import useSidebar from "@/hooks/useSidebar";
import { useQueryClient } from "@tanstack/react-query";
import {
  BellPlus,
  BellRing,
  CalendarPlus,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SquarePlus,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";

/*
  The nav is data, not markup. It was five groups of hand-repeated JSX, each
  restating its route twice — once for the href and once for the active test —
  which is exactly the shape a typo hides in.
*/
const NAV: {
  group: string;
  items: { title: string; href: string; icon: React.ReactNode }[];
}[] = [
  {
    group: "Main menu",
    items: [
      { title: "Orders", href: "/dashboard/orders", icon: <ListOrdered /> },
      { title: "Payments", href: "/dashboard/payments", icon: <CreditCard /> },
    ],
  },
  {
    group: "Products",
    items: [
      { title: "Create product", href: "/dashboard/create-product", icon: <SquarePlus /> },
      { title: "All products", href: "/dashboard/all-products", icon: <PackageSearch /> },
    ],
  },
  {
    group: "Events",
    items: [
      { title: "Create event", href: "/dashboard/create-event", icon: <CalendarPlus /> },
      { title: "All events", href: "/dashboard/all-events", icon: <BellPlus /> },
    ],
  },
  {
    group: "Controllers",
    items: [
      { title: "Inbox", href: "/dashboard/inbox", icon: <Mail /> },
      { title: "Settings", href: "/dashboard/settings", icon: <Settings /> },
      { title: "Notifications", href: "/dashboard/notifications", icon: <BellRing /> },
    ],
  },
  {
    group: "Extras",
    items: [
      {
        title: "Discount codes",
        href: "/dashboard/discount-codes",
        icon: <TicketPercent />,
      },
    ],
  },
];

/*
  Position of each route in the flattened rail, so the numerals run 01…11 down the
  whole sidebar rather than restarting per group. Derived from NAV rather than
  written out, which is the same reason NAV itself is data.
*/
const FLAT_INDEX: Record<string, number> = Object.fromEntries(
  NAV.flatMap((section) => section.items).map((item, i) => [item.href, i + 2])
);

const SidebarBarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  /*
    Logout was a SidebarItem pointing at /login, so it navigated away while
    leaving the cached seller in memory — going back put you straight into the
    dashboard again. Clearing the cache fixed that half.

    The other half was the session itself: `seller-access-token` is httpOnly, so
    only the server can expire it, and until now nothing did — "logging out" left
    a cookie good for another 15 minutes, with a refresh token good for a week.
    `/api/logout` exists now, and `role` picks which of the three cookie
    namespaces to clear.
  */
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/logout", { role: "seller" });
    } catch {
      toast.error("We couldn't reach the server — signing you out here.");
    } finally {
      queryClient.clear();
      router.push("/login");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Shop identity — the seller's own shop, not the product's name. */}
      <Link href="/" className="group flex items-start gap-2.5 px-3 py-2">
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terra-2 transition-transform group-hover:scale-125"
          aria-hidden="true"
        />
        <span className="min-w-0 leading-none">
          <span className="flex items-baseline gap-2">
            <span className="truncate font-display text-base font-medium tracking-tight text-on-ink">
              {seller?.shop?.name ?? "Your shop"}
            </span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-on-ink-faint">
              /seller
            </span>
          </span>
          <span className="mt-1.5 block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-faint">
            {seller?.shop?.address ?? "seller portal"}
          </span>
        </span>
      </Link>

      <nav className="scroll-none mt-8 flex-1 overflow-y-auto pb-4">
        <SidebarMenu title="Overview">
          <SidebarItem
            title="Dashboard"
            icon={<LayoutDashboard />}
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
            index={1}
          />
        </SidebarMenu>

        {NAV.map((section) => (
          <SidebarMenu key={section.group} title={section.group}>
            {section.items.map((item) => (
              <SidebarItem
                key={item.href}
                title={item.title}
                icon={item.icon}
                isActive={activeSidebar === item.href}
                href={item.href}
                index={FLAT_INDEX[item.href]}
              />
            ))}
          </SidebarMenu>
        ))}
      </nav>

      {/*
        Identity sits at the foot of the rail next to the control that ends the
        session — you check which account you are in at the moment you consider
        leaving it, not while reading a table.
      */}
      <div className="mt-auto border-t border-ink-border pt-3">
        {seller ? (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden border border-ink-border bg-ink-soft font-display text-sm font-medium text-on-ink-muted"
              aria-hidden="true"
            >
              {/* `shops.avatar` is an `images[]` relation — indexing is required.
                  Reading `.url` off the array gave undefined every time, so this
                  always fell through to the initial. */}
              {seller.shop?.avatar?.[0]?.url ? (
                <img
                  src={seller.shop.avatar[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (seller.name?.[0]?.toUpperCase() ?? "S")
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-on-ink">
                {seller.name}
              </span>
              <span className="block truncate font-mono text-[10px] tracking-[0.08em] text-on-ink-faint">
                {seller.email}
              </span>
            </span>
          </div>
        ) : (
          <div className="px-3 py-2">
            <div className="h-8 w-full animate-pulse bg-ink-raised motion-reduce:animate-none" />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-on-ink-muted transition-colors hover:text-neg"
        >
          <LogOut size={16} className="shrink-0" />
          Log out
          <span aria-hidden="true" className="ml-auto">
            ↗
          </span>
        </button>
      </div>
    </div>
  );
};

export default SidebarBarWrapper;
