"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ChangePassword from "@/shared/components/changePassword";
import ShippingAddressSection from "../../../shared/components/shippingAddress";

import {
  BadgeCheck,
  Bell,
  CheckCircle,
  CircleDot,
  ExternalLink,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Package,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import OrdersTable from "@/shared/components/tables/orders-table";

import Link from "next/link";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import StatCard from "@/shared/components/cards/stat.card";
import QuickActionCard from "@/shared/components/cards/quick-action.card";
import useRequireAuth from "@/hooks/useRequiredAuth";
import {
  Container,
  Crumbs,
  PageHeading,
  SysStrip,
} from "@/shared/components/ui";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-paper">
          <Loader2 className="h-6 w-6 animate-spin text-terra-2" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useRequireAuth();

  const searchParams = useSearchParams();
  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);

  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/get-user-orders`);
      return res.data.orders;
    },
  });
  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (order: any) =>
      order?.deliveryStatus !== "Delivered" &&
      order?.deliveryStatus !== "Cancelled"
  ).length;
  const completedOrders = orders.filter(
    (order: any) => order?.deliveryStatus === "Delivered"
  ).length;

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("active", activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  /*
    The session cookies are httpOnly, so only the server can end a session —
    this used to GET a `/api/logout` route that did not exist, and because the
    redirect sat inside `.then()`, the 404 meant the button neither logged you
    out nor navigated you anywhere.

    The redirect now happens whichever way the request goes. A logout button
    that leaves you stranded on the page because the network hiccuped is worse
    than one that signs you out optimistically.
  */
  const logOutHandler = async () => {
    try {
      await axiosInstance.post("/api/logout", { role: "user" });
    } catch {
      toast.error("We couldn't reach the server — signing you out here.");
    } finally {
      queryClient.clear();
      router.push("/login");
    }
  };

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/get-user-notifications");
      return res.data.notifications;
    },
  });

  return (
    <div className="pb-16">
      {/* This page laid itself out with a bare `w-[90%] lg:w-[80%]` wrapper, so
          its gutter did not agree with any other page in the app. */}
      <Container className="pt-8">
        <Crumbs trail={[{ label: "My account" }]} />

        <div className="mt-6">
          <PageHeading
            kicker="/profile · your account"
            title={`Welcome back, ${isLoading ? "…" : user?.name || "there"}`}
          />
        </div>

        <SysStrip
          className="mb-10"
          items={[
            { key: "~/profile", value: `${totalOrders} orders` },
            { value: `${processingOrders} in progress`, hideOnMobile: true },
            { value: activeTab.toLowerCase(), trailing: true },
          ]}
        />

        {/* ORDER STATS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <StatCard title="Total Orders" count={totalOrders} Icon={ShoppingCart} />
          <StatCard
            title="Processing Orders"
            count={processingOrders}
            Icon={Truck}
          />
          <StatCard
            title="Completed Orders"
            count={completedOrders}
            Icon={CheckCircle}
          />
        </div>

        <div className="mt-10 flex w-full flex-col gap-6 lg:flex-row">
          {/* LEFT NAV */}
          <aside className="h-max w-full shrink-0 border border-line bg-paper p-4 lg:w-[230px]">
            <nav className="space-y-1">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === "Profile"}
                onClick={() => setActiveTab("Profile")}
              />
              <NavItem
                label="My Orders"
                Icon={Package}
                active={activeTab === "My Orders"}
                onClick={() => setActiveTab("My Orders")}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => router.replace("/inbox")}
              />
              <NavItem
                label="Notifications"
                Icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
              />
              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => setActiveTab("Shipping Address")}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => setActiveTab("Change Password")}
              />

              <div className="!mt-3 border-t border-line pt-3">
                <NavItem
                  label="Logout"
                  Icon={LogOut}
                  danger
                  onClick={logOutHandler}
                />
              </div>
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <section className="min-w-0 flex-1 border border-line bg-paper p-6">
            <h2 className="mb-6 border-b border-ink-line pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-terra-2">
              {activeTab}
            </h2>

            {activeTab === "Profile" ? (
              isLoading ? (
                <ProfileSkeleton />
              ) : user ? (
                <div className="space-y-6">
                  {/* IDENTITY */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-terra/30 ring-offset-2">
                      <Image
                        src={
                          // `users.avatar` is an `images?` relation — a single row
                          // object, not a URL. Unlike the shop avatars it is not an
                          // array, but it is still truthy, so the fallback below was
                          // unreachable and next/image received an object.
                          user?.avatar?.url ||
                          "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                        }
                        alt="Profile photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-terra hover:text-terra-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Change photo
                    </button>
                  </div>

                  {/* DETAILS */}
                  <dl className="divide-y divide-line border-t border-line">
                    <DetailRow label="Name" value={user?.name} />
                    <DetailRow label="Email" value={user?.email} />
                    <DetailRow
                      label="Joined"
                      value={
                        user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              undefined,
                              { day: "numeric", month: "long", year: "numeric" }
                            )
                          : "—"
                      }
                    />
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-ink-500">Earned points</dt>
                      <dd>
                        <span className="rounded-full bg-terra/10 px-2.5 py-1 text-sm font-semibold text-terra-2">
                          {user?.points || 0}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <PanelMessage
                  Icon={User}
                  title="We couldn't load your profile"
                  description="Refresh the page, or sign in again to continue."
                />
              )
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddressSection />
            ) : activeTab === "My Orders" ? (
              <OrdersTable />
            ) : (
              activeTab === "Change Password" ? (
                <ChangePassword />
              ) :
              activeTab === "Notifications" ? (
                <div className="space-y-4">
                  {notificationsLoading && (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-terra-2" />
                    </div>
                  )}

                  {!notificationsLoading && notifications?.length === 0 && (
                    <PanelMessage
                      Icon={Bell}
                      title="No notifications yet"
                      description="Updates about your orders and rewards will show up here."
                    />
                  )}

                  {!notificationsLoading &&
                    notifications &&
                    [...notifications]
                      .sort((a, b) =>
                        a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1
                      )
                      .map((not, idx) => (
                        <div
                          key={not.id}
                          style={{ animationDelay: `${idx * 80}ms` }}
                          className={`group animate-reveal-up border p-5 opacity-0 transition-all duration-300 ease-out hover:border-terra/40 hover: motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transition-none ${
                            !not.isRead
                              ? "border-terra/30 bg-terra/5"
                              : "border-line bg-paper"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* LEFT SIDE */}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-ink">
                                  {not.title}
                                </h3>

                                {!not.isRead && (
                                  <span className="rounded-full bg-terra px-2 py-0.5 text-[10px] font-medium tracking-wide text-paper">
                                    NEW
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-ink-500">
                                {not.message}
                              </p>

                              {/* Creator */}
                              <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                                <User className="h-3 w-3" /> Created by:{" "}
                                {not.creatorId}
                              </p>

                              {/* Dates */}
                              <div className="mt-1 flex flex-wrap gap-4 text-xs text-ink-400">
                                <span>
                                  Created:&nbsp;
                                  <span className="text-ink-500">
                                    {new Date(not.createdAt).toLocaleString()}
                                  </span>
                                </span>

                                <span>
                                  Updated:&nbsp;
                                  <span className="text-ink-500">
                                    {new Date(not.updatedAt).toLocaleString()}
                                  </span>
                                </span>
                              </div>

                              {/* Redirect link */}
                              {not.redirect_link && (
                                <Link
                                  href={not.redirect_link}
                                  className="mt-2 flex items-center gap-1 text-xs font-medium text-terra-2 hover:underline"
                                >
                                  View details
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>

                            {/* ACTION BUTTON */}
                            {!not.isRead ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await axiosInstance.post(
                                    "/seller/api/mark-notification-as-read",
                                    { notificationId: not.id, role: "user" }
                                  );

                                  queryClient.invalidateQueries({
                                    queryKey: ["notifications"],
                                  });
                                  toast.success("Notification marked as read");
                                }}
                                className="flex shrink-0 items-center gap-1 text-sm font-medium text-terra-2 transition-colors hover:text-terra focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as read
                              </button>
                            ) : (
                              <CircleDot
                                className="h-4 w-4 shrink-0 text-ink-400"
                                aria-label="Read"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                </div>
              ) : (
                <PanelMessage
                  Icon={Wrench}
                  title={`${activeTab} isn't ready yet`}
                  description="This section is still being built. Pick another item from the menu in the meantime."
                />
              )
            )}
          </section>

          {/* QUICK PANEL */}
          <div className="w-full shrink-0 space-y-4 lg:w-[270px]">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements."
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage preferences and security."
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support."
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`relative flex w-full items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra ${
      active
        ? "text-ink"
        : danger
        ? "text-ink-400 hover:text-neg"
        : "text-ink-400 hover:text-ink"
    }`}
  >
    {/* A 1px hairline on the leading edge, not a tinted tab. The theme marks
        "here" with a rule the way a printed index does. */}
    <span
      aria-hidden="true"
      className={`absolute -left-4 top-1/2 h-6 w-px -translate-y-1/2 transition-colors ${
        active ? "bg-terra-2" : "bg-transparent"
      }`}
    />
    <Icon className="h-4 w-4 shrink-0" />
    {label}
  </button>
);

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <dt className="text-sm text-ink-500">{label}</dt>
    <dd className="truncate text-sm font-medium text-ink">
      {value || "—"}
    </dd>
  </div>
);

const PanelMessage = ({ Icon, title, description }: any) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terra/10 text-terra-2">
      <Icon size={24} />
    </span>
    <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
  </div>
);

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 animate-pulse rounded-full bg-surface" />
      <div className="h-7 w-32 animate-pulse bg-surface" />
    </div>
    <div className="space-y-4 border-t border-line pt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-surface" />
          <div className="h-4 w-40 animate-pulse rounded bg-surface" />
        </div>
      ))}
    </div>
  </div>
);
