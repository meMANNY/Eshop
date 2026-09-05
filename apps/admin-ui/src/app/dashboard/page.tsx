"use client";

import { useQueries } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import DeviceUsagePie from "@/shared/components/charts/device-usage-pie";
import GeoMap from "@/shared/components/charts/geo-map";
import RecentOrdersTable from "@/shared/components/charts/recent-orders";
import SalesChart from "@/shared/components/charts/sales-chart";
import { PageShell, PageTitle, StatTile, money } from "@/shared/components/ui";

/*
  The tiles read the counts off the `meta` block the list endpoints already
  return, so a `limit=1` request costs one row instead of a full page. The
  dashboard used to open with four charts of placeholder data and no live figure
  anywhere on it.
*/
const countQuery = (key: string, url: string, pick: (data: any) => number) => ({
  queryKey: [key],
  queryFn: async () => {
    const res = await axiosInstance.get(url);
    return pick(res.data);
  },
  staleTime: 1000 * 60 * 5,
});

export default function Dashboard() {
  const [users, sellers, products, orders] = useQueries({
    queries: [
      countQuery(
        "count-users",
        "/admin/api/get-all-users?page=1&limit=1",
        (d) => d?.meta?.totalUsers ?? 0
      ),
      countQuery(
        "count-sellers",
        "/admin/api/get-all-sellers?page=1&limit=1",
        (d) => d?.meta?.totalSellers ?? 0
      ),
      countQuery(
        "count-products",
        "/admin/api/get-all-products?page=1&limit=1",
        (d) => d?.meta?.totalProducts ?? 0
      ),
      {
        queryKey: ["admin-orders"],
        queryFn: async () => {
          const res = await axiosInstance.get("/order/api/get-admin-orders");
          return res.data.orders as any[];
        },
        staleTime: 1000 * 60 * 6,
      },
    ],
  });

  const orderList = orders.data ?? [];
  const today = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const gross = orderList.reduce((sum, o: any) => sum + (o.total ?? 0), 0);

  return (
    <PageShell
      sys={[
        { key: "~/dashboard", value: `${orderList.length} orders` },
        { value: `${products.data ?? 0} products`, hideOnMobile: true },
        { value: today, trailing: true },
      ]}
    >
      <PageTitle
        kicker="/overview"
        title="Everything moving through the marketplace"
        meta="right now"
      />

      <div className="mb-8 grid grid-cols-2 gap-px border border-ink-border bg-ink-border lg:grid-cols-4">
        <StatTile
          label="Buyers"
          index={1}
          value={users.data ?? 0}
          loading={users.isLoading}
          note="Registered accounts"
        />
        <StatTile
          label="Sellers"
          index={2}
          value={sellers.data ?? 0}
          loading={sellers.isLoading}
          note="Onboarded shops"
        />
        <StatTile
          label="Products"
          index={3}
          value={products.data ?? 0}
          loading={products.isLoading}
          note="Live listings"
        />
        <StatTile
          label="Gross volume"
          index={4}
          value={money(gross)}
          loading={orders.isLoading}
          note={`${orderList.length} order${orderList.length === 1 ? "" : "s"}`}
        />
      </div>

      {/*
        `lg:col-span-2` rather than `col-span-2`: at the single-column breakpoint a
        bare `col-span-2` creates a phantom second column and pushes the page
        sideways.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
