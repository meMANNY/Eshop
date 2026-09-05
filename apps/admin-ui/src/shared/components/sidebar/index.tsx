"use client";

import useAdmin from "@/hooks/useAdmin";
import useSidebar from "@/hooks/useSidebar";
import axiosInstance from "@/utils/axiosInstance";
import {
  BellPlus,
  BellRing,
  CreditCard,
  FileClock,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PackageSearch,
  PencilRuler,
  Settings,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import SidebarItem from "./sidebar.items";
import SidebarMenu from "./sidebar.menu";

/*
  The nav is data, not markup. It was twelve near-identical JSX blocks, each
  repeating its own route string three times — once for the href, once for the
  active test and once for the icon colour — which is exactly the shape a typo
  hides in.
*/
const NAV: { group: string; items: { title: string; href: string; icon: React.ReactNode }[] }[] = [
  {
    group: "Main menu",
    items: [
      { title: "Orders", href: "/dashboard/orders", icon: <ListOrdered /> },
      { title: "Payments", href: "/dashboard/payments", icon: <CreditCard /> },
      { title: "Products", href: "/dashboard/products", icon: <PackageSearch /> },
      { title: "Events", href: "/dashboard/events", icon: <BellPlus /> },
      { title: "Users", href: "/dashboard/users", icon: <Users /> },
      { title: "Sellers", href: "/dashboard/sellers", icon: <Store /> },
    ],
  },
  {
    group: "Controllers",
    items: [
      { title: "Loggers", href: "/dashboard/loggers", icon: <FileClock /> },
      { title: "Management", href: "/dashboard/management", icon: <Settings /> },
      { title: "Notifications", href: "/dashboard/notifications", icon: <BellRing /> },
    ],
  },
  {
    group: "Customization",
    items: [
      {
        title: "All customization",
        href: "/dashboard/customization",
        icon: <PencilRuler />,
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

export default function SidebarWrapper() {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  /*
    Was a GET to a route that did not exist, so this always landed in the catch
    and told the admin logout had failed — while the session cookie stayed
    valid. `role` picks which cookie namespace to expire; this browser may hold
    a user and seller session for the same host too.
  */
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/logout", { role: "admin" });
      toast.success("Logged out");
    } catch {
      toast.error("We couldn't reach the server — signing you out here.");
    } finally {
      // Leaving the cached admin in memory is what let the back button walk
      // straight back into the dashboard.
      queryClient.clear();
      router.push("/");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Wordmark — says which console you are in before it says who you are. */}
      <Link href="/dashboard" className="group flex items-start gap-2.5 px-3 py-2">
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terra-2 transition-transform group-hover:scale-125"
          aria-hidden="true"
        />
        <span className="min-w-0 leading-none">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-base font-medium tracking-tight text-on-ink">
              Eshop
            </span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-on-ink-faint">
              /ops
            </span>
          </span>
          <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-faint">
            operations console
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
        Identity sits at the foot of the rail, next to the control that ends the
        session — you check who you are signed in as at the moment you consider
        signing out, not while you are reading a table.
      */}
      <div className="mt-auto border-t border-ink-border pt-3">
        {admin ? (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center border border-ink-border bg-ink-soft font-display text-sm font-medium text-on-ink-muted"
              aria-hidden="true"
            >
              {admin.name?.[0]?.toUpperCase() ?? "A"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-on-ink">
                {admin.name}
              </span>
              <span className="block truncate font-mono text-[10px] tracking-[0.08em] text-on-ink-faint">
                {admin.email}
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
}
