"use client";

import axiosInstance from "@/utils/axiosInstance";
import { ArrowLeft, Loader2, PackageX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const statuses = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export default function Page() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/order/api/get-order-details/${orderId}`
        );
        setOrder(res.data.order);
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
        <Loader2 className="h-6 w-6 animate-spin text-coral-ink" />
      </div>
    );

  if (!order)
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-canvas px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral-ink">
          <PackageX size={24} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-ink">
          We couldn&apos;t find that order
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
          It may have been removed, or the link is no longer valid.
        </p>
        <Link
          href="/profile?active=My+Orders"
          className="mt-6 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-[#2b0f0a] transition-colors hover:bg-coral-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
        >
          Back to my orders
        </Link>
      </div>
    );

  const activeIndex = statuses.indexOf(order.deliveryStatus);
  const progressWidth =
    activeIndex > 0 ? (activeIndex / (statuses.length - 1)) * 100 : 0;

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
              Order{" "}
              <span className="font-mono text-coral-ink">
                #{order.id.slice(-6).toUpperCase()}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/" className="transition-colors hover:text-coral-ink">
              Home
            </Link>
            <span className="text-ink-faint">/</span>
            <Link
              href="/profile?active=My+Orders"
              className="transition-colors hover:text-coral-ink"
            >
              My orders
            </Link>
            <span className="text-ink-faint">/</span>
            <span className="text-ink">
              #{order.id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        <Link
          href="/profile?active=My+Orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-coral-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
        >
          <ArrowLeft size={16} />
          Back to my orders
        </Link>

        {/* DELIVERY PROGRESS */}
        <Card>
          <h2 className="mb-8 text-lg font-semibold text-ink">
            Delivery Progress
          </h2>

          <div className="mb-4 flex justify-between gap-2 text-xs font-medium">
            {statuses.map((status, i) => (
              <span
                key={status}
                className={`flex-1 text-center first:text-left last:text-right ${
                  i <= activeIndex
                    ? "font-semibold text-coral-ink"
                    : "text-ink-faint"
                }`}
              >
                {status}
              </span>
            ))}
          </div>

          <div className="relative flex items-center justify-between">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-slate-200"
            />
            <div
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-coral shadow-[0_0_10px_rgba(255,111,97,0.4)] transition-all duration-500 ease-in-out motion-reduce:transition-none"
              style={{ width: `${progressWidth}%` }}
            />

            {statuses.map((status, i) => {
              const reached = i <= activeIndex;
              const current = i === activeIndex;
              return (
                <div
                  key={status}
                  className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-500 motion-reduce:transition-none ${
                    current
                      ? "scale-110 bg-coral shadow-lg shadow-[#ff6f61]/40"
                      : reached
                      ? "bg-coral"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      reached ? "bg-surface" : "bg-slate-400"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* ORDER SUMMARY */}
        <Card className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Order Summary
          </h2>
          <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            <SummaryRow label="Payment status">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                  order.status === "Paid"
                    ? "bg-pos/10 text-pos ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}
              >
                {order.status}
              </span>
            </SummaryRow>

            <SummaryRow label="Total paid">
              <span className="text-base font-semibold text-ink">
                ${Number(order.total).toFixed(2)}
              </span>
            </SummaryRow>

            {order.discountAmount > 0 && (
              <SummaryRow label="Discount applied">
                <span className="font-medium text-pos">
                  -${Number(order.discountAmount).toFixed(2)}
                  {order.couponCode?.discountType === "percentage"
                    ? ` (${order.couponCode.discountValue}%)`
                    : order.couponCode
                    ? ` ($${order.couponCode.discountValue} off)`
                    : ""}
                </span>
              </SummaryRow>
            )}

            {order.couponCode && (
              <SummaryRow label="Coupon">
                <span className="rounded bg-coral/10 px-2 py-0.5 font-mono text-sm text-coral-ink">
                  {order.couponCode.public_name}
                </span>
              </SummaryRow>
            )}

            <SummaryRow label="Date">
              <span className="text-ink">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </SummaryRow>
          </dl>
        </Card>

        {/* SHIPPING ADDRESS */}
        {order.shippingAddress && (
          <Card className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-ink">
              Shipping Address
            </h2>
            <address className="space-y-1 text-sm not-italic text-ink-muted">
              <p className="font-medium text-ink">
                {order.shippingAddress.name}
              </p>
              <p>
                {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </address>
          </Card>
        )}

        {/* ORDER ITEMS */}
        <Card className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Order Items
            <span className="ml-2 text-sm font-normal text-ink-faint">
              ({order.items?.length ?? 0})
            </span>
          </h2>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div
                key={item.id ?? item.productId}
                className="flex items-center gap-5 rounded-lg border border-rule p-4 transition-colors hover:border-rule hover:bg-slate-50"
              >
                <img
                  src={
                    item.product?.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format&fit=crop&q=80"
                  }
                  alt={item.product?.title || "Product image"}
                  className="h-16 w-16 shrink-0 rounded-md border border-rule object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {item?.product?.title || "Unnamed Product"}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Quantity:{" "}
                    <span className="text-ink-muted">{item?.quantity}</span>
                  </p>
                  {item?.selectedOptions &&
                    Object.keys(item.selectedOptions).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(item.selectedOptions).map(
                          ([key, value]: [string, any]) =>
                            value && (
                              <span
                                key={key}
                                className="inline-flex items-center rounded-full border border-rule bg-slate-50 px-2 py-0.5 text-xs text-ink-muted"
                              >
                                <span className="capitalize text-ink-faint">
                                  {key}:
                                </span>
                                <span className="ml-1">{value}</span>
                              </span>
                            )
                        )}
                      </div>
                    )}
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  ${Number(item?.price ?? 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-card border border-rule bg-surface p-6 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SummaryRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-rule py-3 last:border-b-0">
    <dt className="text-sm text-ink-muted">{label}</dt>
    <dd className="text-sm">{children}</dd>
  </div>
);
