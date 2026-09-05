"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Crumbs,
  EmptyState,
  Figure,
  PageShell,
  PageTitle,
  SearchField,
  StatusPill,
  deliveryTone,
  money,
  paymentTone,
  shortDate,
  shortId,
} from "@/shared/components/ui";
import { Eye, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function Page() {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-admin-orders");
      return res.data.orders;
    },
    staleTime: 1000 * 60 * 6,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }: any) => (
          <Figure className="font-medium text-on-ink">
            {shortId(row.original.id)}
          </Figure>
        ),
      },
      {
        accessorKey: "shop.name",
        header: "Shop",
        cell: ({ row }: any) =>
          row.original.shop?.name ?? (
            <span className="text-on-ink-faint">Unknown shop</span>
          ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-raised text-xs font-semibold text-on-ink-muted"
              aria-hidden="true"
            >
              {row.original.user?.name?.[0]?.toUpperCase() ?? "G"}
            </span>
            <span className="truncate">{row.original.user?.name ?? "Guest"}</span>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="font-medium text-on-ink">
            {money(row.original.total)}
          </Figure>
        ),
      },
      {
        accessorKey: "status",
        header: "Payment",
        cell: ({ row }: any) => (
          <StatusPill tone={paymentTone(row.original.status)}>
            {row.original.status ?? "Unknown"}
          </StatusPill>
        ),
      },
      {
        accessorKey: "deliveryStatus",
        header: "Delivery",
        cell: ({ row }: any) => (
          <StatusPill tone={deliveryTone(row.original.deliveryStatus)}>
            {row.original.deliveryStatus ?? "Unknown"}
          </StatusPill>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Placed",
        cell: ({ row }: any) => (
          <Figure className="text-on-ink-muted">
            {shortDate(row.original.createdAt)}
          </Figure>
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-on-ink-muted transition-colors hover:text-terra"
          >
            <Eye size={16} aria-hidden="true" />
            View
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const shown = table.getRowModel().rows.length;

  return (
    <PageShell>
      <Crumbs trail={["Orders"]} />
      <PageTitle
        title="Orders"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{shown}</Figure>
              {shown === orders.length
                ? ` order${orders.length === 1 ? "" : "s"} across all shops`
                : ` of ${orders.length} matching your search`}
            </>
          )
        }
      />

      <SearchField
        label="Search orders"
        placeholder="Search by order id, shop, buyer or status…"
        value={globalFilter}
        onChange={setGlobalFilter}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={shown === 0}
        empty={
          globalFilter ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="No orders match that search"
              hint="Try a shorter term, or the last six characters of an order id."
            />
          ) : (
            <EmptyState
              icon={<Inbox size={28} />}
              title="No orders yet"
              hint="Orders appear here as soon as buyers start checking out."
            />
          )
        }
      />
    </PageShell>
  );
}
