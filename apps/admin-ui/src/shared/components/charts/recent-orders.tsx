"use client";

import React, { useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "../ui/data-table";
import { Figure, StatusPill, paymentTone } from "../ui";

export default function RecentOrdersTable() {
  const data = useMemo(
    () => [
      { id: "ORD-001", customer: "Ahmed", amount: 250, status: "Paid" },
      { id: "ORD-002", customer: "Ali", amount: 180, status: "Pending" },
      { id: "ORD-003", customer: "Mahmoud", amount: 340, status: "Paid" },
      { id: "ORD-004", customer: "Hassan", amount: 90, status: "Failed" },
      { id: "ORD-005", customer: "Abdelaziz", amount: 190, status: "Pending" },
      { id: "ORD-006", customer: "Kareem", amount: 120, status: "Paid" },
    ],
    []
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }: any) => (
          <Figure className="font-medium text-white">{row.original.id}</Figure>
        ),
      },
      { accessorKey: "customer", header: "Buyer" },
      {
        accessorKey: "amount",
        header: "Amount",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-white">
            ${row.original.amount.toFixed(2)}
          </Figure>
        ),
      },
      {
        accessorKey: "status",
        header: "Payment",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <StatusPill tone={paymentTone(row.original.status)}>
            {row.original.status}
          </StatusPill>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="overflow-hidden rounded-panel border border-rule bg-panel shadow-panel">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Recent orders</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            The last six across every shop
          </p>
        </div>
      </header>
      {/* Reuses the ledger table so the dashboard preview and the Orders page
          render rows the same way, rather than two hand-built tables. */}
      <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none">
        <DataTable table={table} columnCount={columns.length} />
      </div>
    </section>
  );
}
