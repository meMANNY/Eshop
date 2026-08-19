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

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
          <Loader2 className="h-6 w-6 animate-spin text-coral-ink" />
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
    <div className="w-full bg-canvas pb-14">
      <div className="mx-auto w-[90%] lg:w-[80%]">
        {/* HEADER */}
        <div className="pb-10">
          <div className="mb-3 flex items-center gap-3 pt-8 md:pt-10">
            {/* Coral marker — the same "you are here" accent used across the app. */}
            <span
              aria-hidden="true"
              className="h-10 w-[4px] rounded-full bg-coral "
            />
            <h1 className="font-jost text-[40px] font-semibold leading-tight text-ink sm:text-[44px]">
              Welcome back,{" "}
              {isLoading ? (
                <span className="inline-block h-8 w-40 animate-pulse rounded-md bg-slate-200 align-middle" />
              ) : (
                <span className="text-coral-ink">{user?.name || "there"}</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href={"/"} className="transition-colors hover:text-coral-ink">
              Home
            </Link>
            <span className="text-ink-faint">/</span>
            <span className="text-ink">My account</span>
          </div>
        </div>

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
          <aside className="h-max w-full shrink-0 rounded-card border border-rule bg-surface p-4 shadow-sm lg:w-[230px]">
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

              <div className="!mt-3 border-t border-rule pt-3">
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
          <section className="min-w-0 flex-1 rounded-card border border-rule bg-surface p-6 shadow-sm">
            <h2 className="mb-5 border-b border-rule pb-3 text-xl font-semibold text-ink">
              {activeTab}
            </h2>

            {activeTab === "Profile" ? (
              isLoading ? (
                <ProfileSkeleton />
              ) : user ? (
                <div className="space-y-6">
                  {/* IDENTITY */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-coral/30 ring-offset-2">
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
                      className="inline-flex items-center gap-1.5 rounded-md border border-rule px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-coral hover:text-coral-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Change photo
                    </button>
                  </div>

                  {/* DETAILS */}
                  <dl className="divide-y divide-slate-100 border-t border-rule">
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
                      <dt className="text-sm text-ink-muted">Earned points</dt>
                      <dd>
                        <span className="rounded-full bg-coral/10 px-2.5 py-1 text-sm font-semibold text-coral-ink">
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
                      <Loader2 className="h-6 w-6 animate-spin text-coral-ink" />
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
                          className={`group animate-fadeSlideUp rounded-xl border p-5 opacity-0 shadow-sm transition-all duration-300 ease-out hover:border-coral/40 hover:shadow-md motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transition-none ${
                            !not.isRead
                              ? "border-coral/30 bg-coral/5"
                              : "border-rule bg-surface"
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
                                  <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#2b0f0a]">
                                    NEW
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-ink-muted">
                                {not.message}
                              </p>

                              {/* Creator */}
                              <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                                <User className="h-3 w-3" /> Created by:{" "}
                                {not.creatorId}
                              </p>

                              {/* Dates */}
                              <div className="mt-1 flex flex-wrap gap-4 text-xs text-ink-faint">
                                <span>
                                  Created:&nbsp;
                                  <span className="text-ink-muted">
                                    {new Date(not.createdAt).toLocaleString()}
                                  </span>
                                </span>

                                <span>
                                  Updated:&nbsp;
                                  <span className="text-ink-muted">
                                    {new Date(not.updatedAt).toLocaleString()}
                                  </span>
                                </span>
                              </div>

                              {/* Redirect link */}
                              {not.redirect_link && (
                                <Link
                                  href={not.redirect_link}
                                  className="mt-2 flex items-center gap-1 text-xs font-medium text-coral-ink hover:underline"
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
                                className="flex shrink-0 items-center gap-1 text-sm font-medium text-coral-ink transition-colors hover:text-coral-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as read
                              </button>
                            ) : (
                              <CircleDot
                                className="h-4 w-4 shrink-0 text-ink-faint"
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
      </div>
    </div>
  );
}

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
      active
        ? "bg-coral/10 text-coral-ink"
        : danger
        ? "text-neg hover:bg-red-50"
        : "text-ink-muted hover:bg-slate-100 hover:text-ink"
    }`}
  >
    {/* Same coral marker as the page headers — here it marks the current section. */}
    <span
      aria-hidden="true"
      className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-coral transition-all duration-300 motion-reduce:transition-none ${
        active
          ? "h-6 opacity-100 "
          : "h-0 opacity-0"
      }`}
    />
    <Icon className="h-4 w-4 shrink-0" />
    {label}
  </button>
);

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <dt className="text-sm text-ink-muted">{label}</dt>
    <dd className="truncate text-sm font-medium text-ink">
      {value || "—"}
    </dd>
  </div>
);

const PanelMessage = ({ Icon, title, description }: any) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral-ink">
      <Icon size={24} />
    </span>
    <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
  </div>
);

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
      <div className="h-7 w-32 animate-pulse rounded-md bg-slate-200" />
    </div>
    <div className="space-y-4 border-t border-rule pt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  </div>
);
