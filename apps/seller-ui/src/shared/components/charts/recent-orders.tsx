"use client";

import React, { useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import axiosInstance from "@/utils/axiosInstance";
import { DataTable } from "../ui/data-table";
import {
  EmptyState,
  Figure,
  StatusPill,
  money,
  paymentTone,
  shortId,
} from "../ui";
import { Inbox } from "lucide-react";

/**
 * Reads the seller's real orders rather than the seven hardcoded rows it used to
 * show — the dashboard's job is to tell you what is happening in your shop, and a
 * table of invented names does the opposite.
 */
export default function RecentOrdersTable() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-seller-orders");
      return res.data.orders as any[];
    },
    staleTime: 1000 * 60 * 6,
  });

  // The panel is a preview; the Orders page is where the full list lives.
  const recent = useMemo(() => orders.slice(0, 6), [orders]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="transition-colors hover:text-coral"
          >
            <Figure className="font-medium text-white">
              {shortId(row.original.id)}
            </Figure>
          </Link>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => row.original.user?.name ?? "Guest",
      },
      {
        accessorKey: "total",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-white">{money(row.original.total)}</Figure>
        ),
      },
      {
        accessorKey: "status",
        header: "Payment",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <StatusPill tone={paymentTone(row.original.status)}>
            {row.original.status ?? "Unknown"}
          </StatusPill>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: recent,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="overflow-hidden rounded-panel border border-rule bg-panel shadow-panel">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Recent orders</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Your six most recent
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-sm text-[var(--muted)] transition-colors hover:text-coral"
        >
          View all
        </Link>
      </header>
      {/* Reuses the ledger table so this preview and the Orders page render rows
          the same way, rather than two hand-built tables. */}
      <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none">
        <DataTable
          table={table}
          columnCount={columns.length}
          isLoading={isLoading}
          isEmpty={recent.length === 0}
          empty={
            <EmptyState
              icon={<Inbox size={26} />}
              title="No orders yet"
              hint="Your first sale will show up here."
            />
          }
        />
      </div>
    </section>
  );
}
