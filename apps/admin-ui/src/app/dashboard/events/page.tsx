"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Button,
  Crumbs,
  EmptyState,
  Figure,
  PageShell,
  PageTitle,
  Pagination,
  SearchField,
  StatusPill,
  type Tone,
  downloadCsv,
  shortDate,
} from "@/shared/components/ui";
import { shopOf } from "@/utils/shop";
import { CalendarClock, Download, SearchX, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

/**
 * An event is a product with a promo window, so the only thing worth knowing
 * about it that a product row can't tell you is where "now" sits inside that
 * window. That, not the price, is what this page is for.
 */
function windowState(start?: string, end?: string): { label: string; tone: Tone } {
  const now = Date.now();
  const from = start ? new Date(start).getTime() : null;
  const to = end ? new Date(end).getTime() : null;

  if (from && now < from) return { label: "Scheduled", tone: "neutral" };
  if (to && now > to) return { label: "Ended", tone: "neg" };
  return { label: "Live", tone: "pos" };
}

export default function EventList() {
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredFilter = useDeferredValue(globalFilter);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["all-events", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-events?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev: any) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const events = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const filteredEvents = useMemo(() => {
    const filter = deferredFilter.toLowerCase();
    return events.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(filter) ||
        p.category?.toLowerCase().includes(filter) ||
        shopOf(p)?.name?.toLowerCase().includes(filter)
    );
  }, [events, deferredFilter]);

  const liveCount = useMemo(
    () =>
      filteredEvents.filter(
        (e: any) => windowState(e.starting_date, e.ending_date).label === "Live"
      ).length,
    [filteredEvents]
  );

  const handleExportCSV = () => {
    downloadCsv(
      `events_page_${page}.csv`,
      ["Title", "Category", "Price", "Stock", "Shop", "Starts", "Ends", "State"],
      filteredEvents.map((p: any) => [
        p.title,
        p.category ?? "",
        p.sale_price,
        p.stock,
        shopOf(p)?.name ?? "",
        p.starting_date ? new Date(p.starting_date).toLocaleDateString() : "",
        p.ending_date ? new Date(p.ending_date).toLocaleDateString() : "",
        windowState(p.starting_date, p.ending_date).label,
      ])
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "event",
        header: "Event",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <Image
              src={row.original.images?.[0]?.url || "/placeholder.png"}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 border border-ink-border object-cover"
            />
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="max-w-[260px] truncate font-medium text-on-ink transition-colors hover:text-terra"
              title={row.original.title}
            >
              {row.original.title}
            </Link>
          </div>
        ),
      },
      {
        id: "state",
        header: "State",
        cell: ({ row }: any) => {
          const state = windowState(
            row.original.starting_date,
            row.original.ending_date
          );
          return <StatusPill tone={state.tone}>{state.label}</StatusPill>;
        },
      },
      {
        id: "window",
        header: "Promo window",
        cell: ({ row }: any) => (
          <Figure className="text-on-ink-muted">
            {shortDate(row.original.starting_date)} →{" "}
            {shortDate(row.original.ending_date)}
          </Figure>
        ),
      },
      {
        id: "shop",
        header: "Shop",
        cell: ({ row }: any) =>
          shopOf(row.original)?.name ?? (
            <span className="text-on-ink-faint">—</span>
          ),
      },
      {
        accessorKey: "sale_price",
        header: "Price",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-on-ink">
            ${Number(row.original.sale_price ?? 0).toFixed(2)}
          </Figure>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        meta: { align: "right" },
        cell: ({ row }: any) =>
          row.original.stock < 10 ? (
            <StatusPill tone="warn">
              Low · <Figure>{row.original.stock}</Figure>
            </StatusPill>
          ) : (
            <Figure className="text-on-ink-muted">{row.original.stock}</Figure>
          ),
      },
      {
        accessorKey: "ratings",
        header: "Rating",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <span className="inline-flex items-center gap-1.5">
            <Star size={13} className="fill-warn text-warn" aria-hidden="true" />
            <Figure className="text-on-ink-muted">
              {(row.original.ratings ?? 5).toFixed(1)}
            </Figure>
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredEvents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageShell>
      <Crumbs trail={["Events"]} />
      <PageTitle
        title="Events"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{filteredEvents.length}</Figure> event
              {filteredEvents.length === 1 ? "" : "s"} on this page ·{" "}
              <Figure className="text-pos">{liveCount}</Figure> running now
            </>
          )
        }
        actions={
          <Button
            variant="ghost"
            onClick={handleExportCSV}
            disabled={!filteredEvents.length}
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      <SearchField
        label="Search events"
        placeholder="Search by title, category or shop…"
        value={globalFilter}
        onChange={setGlobalFilter}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={filteredEvents.length === 0}
        empty={
          globalFilter ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="No events match that search"
              hint="Search covers the title, the category and the shop name on this page only."
            />
          ) : (
            <EmptyState
              icon={<CalendarClock size={28} />}
              title="No events yet"
              hint="A product becomes an event when a seller gives it a start and end date. Products without one are listed under Products."
            />
          )
        }
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </PageShell>
  );
}
