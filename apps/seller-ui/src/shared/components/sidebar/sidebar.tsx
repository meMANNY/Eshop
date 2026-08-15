'use client';

import useSeller from "@/hooks/useSeller";
import useSidebar from "@/hooks/useSidebar";
import Logo from "@/assests/logo";
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
    dashboard again. Clearing the cache is what actually ends the session on this
    side. See the note in the handover: there is no seller logout endpoint yet, so
    the httpOnly cookie still has to be expired server-side.
  */
  const handleLogout = () => {
    queryClient.clear();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Shop identity — the seller's own shop, not the product's name. */}
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
      >
        <Logo className="h-[18px] w-[18px] shrink-0 text-coral" />
        <span className="min-w-0 leading-none">
          <span className="block truncate font-display text-base font-bold tracking-[-0.01em] text-white">
            {seller?.shop?.name ?? "Your shop"}
          </span>
          <span className="mt-1 block truncate text-xs text-[var(--faint)]">
            {seller?.shop?.address ?? "Seller portal"}
          </span>
        </span>
      </Link>

      <nav className="scroll-none mt-6 flex-1 overflow-y-auto pb-4">
        <SidebarMenu title="Overview">
          <SidebarItem
            title="Dashboard"
            icon={<LayoutDashboard />}
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
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
      <div className="mt-auto border-t border-rule pt-3">
        {seller ? (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-coral-soft text-sm font-semibold text-coral"
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
              <span className="block truncate text-sm font-medium text-[var(--text)]">
                {seller.name}
              </span>
              <span className="block truncate text-xs text-[var(--faint)]">
                {seller.email}
              </span>
            </span>
          </div>
        ) : (
          <div className="px-3 py-2">
            <div className="h-8 w-full animate-pulse rounded bg-raised motion-reduce:animate-none" />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] transition-colors hover:bg-neg/10 hover:text-neg"
        >
          <LogOut size={20} className="shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
};

export default SidebarBarWrapper;
