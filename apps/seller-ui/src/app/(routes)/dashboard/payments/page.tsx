"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, SearchX, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Crumbs,
  EmptyState,
  Figure,
  PageShell,
  PageTitle,
  SearchField,
  StatusPill,
  money,
  paymentTone,
  shortDate,
  shortId,
} from "@/shared/components/ui";

/*
  The marketplace keeps a tenth of every order. Admin-ui shows the same split
  from the house's side; here the seller's payout is the figure that carries the
  emphasis and the platform fee is the aside, because that is the number the
  person reading this page is actually looking for.
*/
const COMMISSION = 0.1;
const payout = (total: number) => total * (1 - COMMISSION);
const platformFee = (total: number) => total * COMMISSION;

export default function Page() {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-seller-orders");
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
        header: "Order total",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-on-ink-muted">
            {money(row.original.total)}
          </Figure>
        ),
      },
      {
        id: "fee",
        header: `Platform fee · ${COMMISSION * 100}%`,
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-on-ink-faint">
            −{money(platformFee(row.original.total))}
          </Figure>
        ),
      },
      {
        id: "payout",
        header: "Your payout",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="font-medium text-terra">
            {money(payout(row.original.total))}
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
        accessorKey: "createdAt",
        header: "Date",
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

  const rows = table.getRowModel().rows;
  // Totals follow the filter, so searching narrows the sums with the rows.
  const gross = rows.reduce((sum, r: any) => sum + (r.original.total ?? 0), 0);

  return (
    <PageShell>
      <Crumbs trail={["Payments"]} />
      <PageTitle
        title="Payments"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{rows.length}</Figure> order
              {rows.length === 1 ? "" : "s"} · your payout{" "}
              <Figure className="text-terra">{money(payout(gross))}</Figure>
            </>
          )
        }
      />

      <SearchField
        label="Search payments"
        placeholder="Search by order id, buyer or payment status…"
        value={globalFilter}
        onChange={setGlobalFilter}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        empty={
          globalFilter ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="No payments match that search"
              hint="Try a shorter term, or the last six characters of an order id."
            />
          ) : (
            <EmptyState
              icon={<Wallet size={28} />}
              title="No payments yet"
              hint="Once buyers start checking out, every order and what you earn from it shows up here."
            />
          )
        }
        footer={
          rows.length ? (
            <tr className="text-sm">
              <th
                scope="row"
                colSpan={2}
                className="px-4 py-3 text-left text-label font-semibold uppercase text-on-ink-muted"
              >
                Total
              </th>
              <td className="px-4 py-3 text-right">
                <Figure className="text-on-ink-muted">{money(gross)}</Figure>
              </td>
              <td className="px-4 py-3 text-right">
                <Figure className="text-on-ink-faint">
                  −{money(platformFee(gross))}
                </Figure>
              </td>
              <td className="px-4 py-3 text-right">
                <Figure className="font-semibold text-terra">
                  {money(payout(gross))}
                </Figure>
              </td>
              <td colSpan={3} />
            </tr>
          ) : null
        }
      />
    </PageShell>
  );
}
