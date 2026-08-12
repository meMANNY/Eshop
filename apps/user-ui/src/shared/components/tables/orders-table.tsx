"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Package } from "lucide-react";
import Link from "next/link";

const deliveryTone: Record<string, string> = {
  Delivered: "bg-pos/10 text-pos ring-emerald-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const OrdersTable = () => {
  // Shares the profile page's query key, so mounting this tab reuses the
  // already-fetched orders instead of firing a second request.
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-user-orders");
      return res.data.orders;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-coral-ink" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="We couldn't load your orders"
        description="Something went wrong on our side. Refresh the page to try again."
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Once you place an order it will show up here with its delivery status."
      />
    );
  }

  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-rule">
            {["Order", "Shop", "Items", "Total", "Delivery", "Date", ""].map(
              (heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-ink-muted"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order: any) => (
            <tr key={order.id} className="transition-colors hover:bg-slate-50">
              <td className="py-4 pr-4 font-mono text-sm font-medium text-ink">
                #{order.id.slice(-6).toUpperCase()}
              </td>
              <td className="py-4 pr-4 text-sm text-ink-muted">
                {order.shop?.name ?? "—"}
              </td>
              <td className="py-4 pr-4 text-sm text-ink-muted">
                {order.items?.length ?? 0}
              </td>
              <td className="py-4 pr-4 text-sm font-semibold text-ink">
                ${Number(order.total).toFixed(2)}
              </td>
              <td className="py-4 pr-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    deliveryTone[order.deliveryStatus] ??
                    "bg-coral/10 text-coral-ink ring-coral/20"
                  }`}
                >
                  {order.deliveryStatus}
                </span>
              </td>
              <td className="py-4 pr-4 text-sm text-ink-muted">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-4 text-right">
                <Link
                  href={`/order/${order.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-coral-ink transition-colors hover:text-coral-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                >
                  View
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral-ink">
      <Package size={24} />
    </span>
    <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
  </div>
);

export default OrdersTable;
