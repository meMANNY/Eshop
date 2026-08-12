"use client";

import { useQueries } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import GeoMap from "@/shared/components/charts/geo-map";
import RecentOrdersTable from "@/shared/components/charts/recent-orders";
import SalesChart from "@/shared/components/charts/sales-chart";
import DeviceUsagePie from "@/shared/components/charts/device-usage-pie";
import { PageShell, PageTitle, StatTile, money } from "@/shared/components/ui";

/*
  The marketplace keeps a tenth of every order, so what the seller earns is nine
  tenths of the gross. Same constant as the Payments page.
*/
const COMMISSION = 0.1;

export default function Dashboard() {
  const [orders, products] = useQueries({
    queries: [
      {
        queryKey: ["seller-orders"],
        queryFn: async () => {
          const res = await axiosInstance.get("/order/api/get-seller-orders");
          return res.data.orders as any[];
        },
        staleTime: 1000 * 60 * 6,
      },
      {
        queryKey: ["shop-products"],
        queryFn: async () => {
          const res = await axiosInstance.get("/product/api/get-shop-products");
          return (res?.data?.products ?? []) as any[];
        },
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  const orderList = orders.data ?? [];
  const productList = products.data ?? [];

  const gross = orderList.reduce((sum, o: any) => sum + (o.total ?? 0), 0);
  const awaiting = orderList.filter(
    (o: any) => o.deliveryStatus && o.deliveryStatus !== "Delivered"
  ).length;
  const live = productList.filter((p: any) => !p.isDeleted).length;

  return (
    <PageShell>
      <PageTitle
        title="Overview"
        meta="What's happening in your shop right now."
      />

      {/*
        Four live figures the seller actually acts on, in place of a page that
        opened with four charts of placeholder data and no real number on it.
      */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Your earnings"
          value={money(gross * (1 - COMMISSION))}
          loading={orders.isLoading}
          note={`From ${orderList.length} order${orderList.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Orders"
          value={orderList.length}
          loading={orders.isLoading}
          note="All time"
        />
        <StatTile
          label="To fulfil"
          value={awaiting}
          loading={orders.isLoading}
          note="Not yet delivered"
        />
        <StatTile
          label="Live products"
          value={live}
          loading={products.isLoading}
          note={
            productList.length - live > 0
              ? `${productList.length - live} scheduled for deletion`
              : "On the storefront"
          }
        />
      </div>

      {/*
        `lg:col-span-2` rather than `col-span-2`: at the single-column breakpoint a
        bare `col-span-2` creates a phantom second column and pushes the page
        sideways.
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <DeviceUsagePie />
        <RecentOrdersTable />
        <div className="lg:col-span-2">
          <GeoMap />
        </div>
      </div>
    </PageShell>
  );
}
