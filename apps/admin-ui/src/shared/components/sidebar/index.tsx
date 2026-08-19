"use client";

import useAdmin from "@/hooks/useAdmin";
import useSidebar from "@/hooks/useSidebar";
import Logo from "@/app/assests/svgs/logo";
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
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
      >
        <Logo className="h-[18px] w-[18px] text-coral" />
        <span className="leading-none">
          <span className="block font-display text-base font-bold tracking-[-0.01em] text-white">
            Zshop
          </span>
          <span className="mt-0.5 block text-label font-semibold uppercase text-[var(--faint)]">
            Ops console
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
        Identity sits at the foot of the rail, next to the control that ends the
        session — you check who you are signed in as at the moment you consider
        signing out, not while you are reading a table.
      */}
      <div className="mt-auto border-t border-rule pt-3">
        {admin ? (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-coral-soft text-sm font-semibold text-coral"
              aria-hidden="true"
            >
              {admin.name?.[0]?.toUpperCase() ?? "A"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--text)]">
                {admin.name}
              </span>
              <span className="block truncate text-xs text-[var(--faint)]">
                {admin.email}
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
          className="mt-1 flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm text-[var(--muted)] transition-colors hover:bg-neg/10 hover:text-neg"
        >
          <LogOut size={18} className="shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
