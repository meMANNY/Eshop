"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
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
  money,
  paymentTone,
  shortDate,
  shortId,
} from "@/shared/components/ui";
import { Eye, SearchX, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/*
  The marketplace takes a tenth of every order. Naming the split once here keeps
  the table, the totals row and the summary tiles from drifting apart the way
  three separate `* 0.1` expressions eventually would.
*/
const COMMISSION = 0.1;
const sellerShare = (total: number) => total * (1 - COMMISSION);
const houseCut = (total: number) => total * COMMISSION;

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
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => row.original.user?.name ?? "Guest",
      },
      {
        accessorKey: "total",
        header: "Gross",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-on-ink">{money(row.original.total)}</Figure>
        ),
      },
      {
        id: "sellerShare",
        header: "Seller payout",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-on-ink-muted">
            {money(sellerShare(row.original.total))}
          </Figure>
        ),
      },
      {
        id: "houseCut",
        header: `House cut · ${COMMISSION * 100}%`,
        meta: { align: "right" },
        /* The one figure this page exists to show, in the marketplace's colour. */
        cell: ({ row }: any) => (
          <Figure className="font-medium text-terra">
            {money(houseCut(row.original.total))}
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

  // Totals follow the filter, so a search narrows the sums with the rows.
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
              <Figure>{rows.length}</Figure> settled order
              {rows.length === 1 ? "" : "s"} · house cut{" "}
              <Figure className="text-terra">{money(houseCut(gross))}</Figure>
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
              hint="Every completed checkout is recorded here with its split."
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
                <Figure className="font-medium text-on-ink">{money(gross)}</Figure>
              </td>
              <td className="px-4 py-3 text-right">
                <Figure className="text-on-ink-muted">
                  {money(sellerShare(gross))}
                </Figure>
              </td>
              <td className="px-4 py-3 text-right">
                <Figure className="font-semibold text-terra">
                  {money(houseCut(gross))}
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
