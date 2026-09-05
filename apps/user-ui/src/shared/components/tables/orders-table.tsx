"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";
import Link from "next/link";
import {
  Figure,
  StatusPill,
  deliveryTone,
  money,
  shortDate,
  shortId,
} from "@/shared/components/ui";

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
        <Loader2 className="h-6 w-6 animate-spin text-terra-2" />
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
          <tr className="border-b-2 border-b-ink-line">
            {["Order", "Shop", "Items", "Total", "Delivery", "Date", ""].map(
              (heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="pb-3 pr-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order: any) => (
            <tr key={order.id} className="transition-colors hover:bg-surface">
              <td className="py-4 pr-4">
                <Figure className="text-sm font-medium text-ink">
                  {shortId(order.id)}
                </Figure>
              </td>
              <td className="py-4 pr-4 text-sm text-ink-500">
                {order.shop?.name ?? "—"}
              </td>
              <td className="py-4 pr-4">
                <Figure className="text-sm text-ink-500">
                  {order.items?.length ?? 0}
                </Figure>
              </td>
              <td className="py-4 pr-4">
                <Figure className="text-sm font-semibold text-ink">
                  {money(Number(order.total))}
                </Figure>
              </td>
              <td className="py-4 pr-4">
                <StatusPill tone={deliveryTone(order.deliveryStatus)}>
                  {order.deliveryStatus}
                </StatusPill>
              </td>
              <td className="py-4 pr-4 text-sm text-ink-500">
                {shortDate(order.createdAt)}
              </td>
              <td className="py-4 text-right">
                <Link
                  href={`/order/${order.id}`}
                  className="link-underline inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-terra-2"
                >
                  view <span aria-hidden="true">→</span>
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
    <span className="text-ink-300">
      <Package size={26} />
    </span>
    <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-ink">
      {title}
    </h3>
    <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
  </div>
);

export default OrdersTable;
