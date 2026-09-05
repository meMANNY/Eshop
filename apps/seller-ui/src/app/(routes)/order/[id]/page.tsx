"use client";

import axiosInstance from "@/utils/axiosInstance";
import { ArrowLeft, ChevronRight, Loader2, PackageX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const fetchOrder = async () => {
    try {
      const res = await axiosInstance.get(
        `/order/api/get-order-details/${orderId}`
      );
      setOrder(res.data.order);
    } catch (err) {
      console.error("failed to fetch order details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await axiosInstance.put(`/order/api/update-status/${order.id}`, {
        deliveryStatus: newStatus,
      });
      setOrder((prev: any) => ({ ...prev, deliveryStatus: newStatus }));
    } catch (err) {
      console.error("failed to update the status");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-[#ff6f61]" />
      </div>
    );

  if (!order)
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
          <PackageX size={24} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-on-ink">
          Order not found
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-on-ink-muted">
          This order may have been removed, or it doesn&apos;t belong to your
          shop.
        </p>
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="mt-6 bg-[#ff6f61] px-4 py-2 text-sm font-medium text-on-ink shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d]"
        >
          Back to orders
        </button>
      </div>
    );

  const activeIndex = statuses.indexOf(order.deliveryStatus);
  const progressWidth =
    activeIndex > 0 ? (activeIndex / (statuses.length - 1)) * 100 : 0;

  return (
    // This route sits outside `(routes)/dashboard`, so it never inherits that
    // layout's `bg-black` — the page has to carry its own dark canvas.
    <div className="min-h-screen w-full bg-black p-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-1 flex items-center gap-3">
          {/* Coral marker — echoes the sidebar's "you are here" accent. */}
          <span
            aria-hidden="true"
            className="h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]"
          />
          <h2 className="text-2xl font-semibold text-on-ink">
            Order{" "}
            <span className="font-mono text-[#ff8a7d]">
              #{order.id.slice(-6).toUpperCase()}
            </span>
          </h2>
        </div>

        <div className="mt-1 flex items-center text-sm">
          <Link
            href="/dashboard"
            className="text-on-ink-muted transition-colors hover:text-[#ff8a7d]"
          >
            Dashboard
          </Link>
          <ChevronRight size={16} className="mx-1 text-on-ink-faint" />
          <Link
            href="/dashboard/orders"
            className="text-on-ink-muted transition-colors hover:text-[#ff8a7d]"
          >
            Orders
          </Link>
          <ChevronRight size={16} className="mx-1 text-on-ink-faint" />
          <span className="text-on-ink">
            #{order.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => router.push("/dashboard/orders")}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-on-ink-muted transition-colors hover:text-[#ff8a7d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
        >
          <ArrowLeft size={16} />
          Back to all orders
        </button>

        {/* DELIVERY PROGRESS + STATUS CONTROL */}
        <Card className="mt-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-on-ink">
              Delivery Progress
            </h3>
            <div className="flex items-center gap-3">
              <label
                htmlFor="delivery-status"
                className="text-sm font-medium text-on-ink-muted"
              >
                Update status
              </label>
              <div className="relative">
                <select
                  id="delivery-status"
                  value={order.deliveryStatus}
                  onChange={handleStatusChange}
                  disabled={updating}
                  className="border border-ink-border bg-white/[0.04] px-3 py-1.5 text-sm text-on-ink outline-none transition-colors hover:border-ink-border focus:border-[#ff6f61] focus:ring-2 focus:ring-[#ff6f61]/30 disabled:opacity-50"
                >
                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                      disabled={statuses.indexOf(status) < activeIndex}
                      className="bg-ink-soft text-on-ink"
                    >
                      {status}
                    </option>
                  ))}
                </select>
                {updating && (
                  <Loader2 className="absolute -right-6 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#ff6f61]" />
                )}
              </div>
            </div>
          </div>

          <ProgressTracker activeIndex={activeIndex} width={progressWidth} />
        </Card>

        {/* ORDER SUMMARY */}
        <Card className="mt-6">
          <h3 className="mb-4 text-lg font-semibold text-on-ink">
            Order Summary
          </h3>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <SummaryRow label="Payment Status">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  order.status === "Paid"
                    ? "border-pos/40 bg-pos/10 text-pos"
                    : "border-warn/40 bg-warn/10 text-warn"
                }`}
              >
                {order.status}
              </span>
            </SummaryRow>

            <SummaryRow label="Total Paid">
              <span className="text-base font-semibold text-on-ink">
                ${Number(order.total).toFixed(2)}
              </span>
            </SummaryRow>

            {order.discountAmount > 0 && (
              <SummaryRow label="Discount">
                <span className="font-medium text-pos">
                  -${Number(order.discountAmount).toFixed(2)}
                </span>
              </SummaryRow>
            )}

            {order.couponCode && (
              <SummaryRow label="Coupon">
                <span className="inline-block rounded border border-ink-border bg-white/[0.03] px-2 py-0.5 font-mono text-sm text-[#ff8a7d]">
                  {order.couponCode.public_name}
                </span>
              </SummaryRow>
            )}

            <SummaryRow label="Date">
              <span className="text-on-ink">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </SummaryRow>
          </dl>
        </Card>

        {/* SHIPPING ADDRESS */}
        {order.shippingAddress && (
          <Card className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-on-ink">
              Shipping Address
            </h3>
            <address className="space-y-1 text-sm not-italic text-on-ink-muted">
              <p className="font-medium text-on-ink">
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
          <h3 className="mb-4 text-lg font-semibold text-on-ink">
            Order Items
            <span className="ml-2 text-sm font-normal text-on-ink-faint">
              ({order.items?.length ?? 0})
            </span>
          </h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <OrderItem key={item.id ?? item.productId} item={item} />
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
    className={` border border-ink-border bg-ink-soft p-6  ${className}`}
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
  <div className="flex items-center justify-between gap-4 border-b border-ink-border pb-3 sm:border-b-0 sm:pb-0">
    <dt className="text-sm text-on-ink-muted">{label}</dt>
    <dd className="text-sm">{children}</dd>
  </div>
);

const ProgressTracker = ({
  activeIndex,
  width,
}: {
  activeIndex: number;
  width: number;
}) => (
  <div>
    <div className="mb-4 flex justify-between gap-2 text-xs font-medium">
      {statuses.map((status, i) => (
        <span
          key={status}
          className={`flex-1 text-center first:text-left last:text-right ${
            i <= activeIndex
              ? "font-semibold text-[#ff8a7d]"
              : "text-on-ink-faint"
          }`}
        >
          {status}
        </span>
      ))}
    </div>

    <div className="relative flex items-center justify-between">
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ink-raised"
      />
      <div
        aria-hidden="true"
        className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.5)] transition-all duration-500 ease-in-out motion-reduce:transition-none"
        style={{ width: `${width}%` }}
      />

      {statuses.map((status, i) => {
        const reached = i <= activeIndex;
        const current = i === activeIndex;
        return (
          <div
            key={status}
            className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-500 motion-reduce:transition-none ${
              current
                ? "scale-110 bg-[#ff6f61]  shadow-[#ff6f61]/50"
                : reached
                ? "bg-[#ff6f61]"
                : "bg-ink-raised"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                reached ? "bg-white" : "bg-on-ink-faint"
              }`}
            />
          </div>
        );
      })}
    </div>
  </div>
);

const OrderItem = ({ item }: { item: any }) => (
  <div className="flex items-center gap-5 border border-ink-border bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
    <img
      src={
        item.product?.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format&fit=crop&q=80"
      }
      alt={item.product?.title || "Product image"}
      className="h-16 w-16 shrink-0 border border-ink-border object-cover"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate font-medium text-on-ink">
        {item?.product?.title || "Unnamed Product"}
      </p>
      <p className="mt-0.5 text-sm text-on-ink-muted">
        Quantity: <span className="text-on-ink-muted">{item?.quantity}</span>
      </p>
      {item?.selectedOptions &&
        Object.keys(item.selectedOptions).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(item.selectedOptions).map(
              ([key, value]: [string, any]) =>
                value && (
                  <span
                    key={key}
                    className="inline-flex items-center rounded-full border border-ink-border bg-white/[0.04] px-2 py-0.5 text-xs text-on-ink-muted"
                  >
                    <span className="capitalize text-on-ink-faint">{key}:</span>
                    <span className="ml-1">{value}</span>
                  </span>
                )
            )}
          </div>
        )}
    </div>
    <p className="shrink-0 text-sm font-semibold text-on-ink">
      ${Number(item?.price ?? 0).toFixed(2)}
    </p>
  </div>
);
