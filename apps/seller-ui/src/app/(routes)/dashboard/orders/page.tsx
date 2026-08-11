"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  useReactTable,
} from "@tanstack/react-table";

import { ChevronRight, Inbox, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// Fulfillment is a real ordered pipeline, which is why this page is organized
// around it: the rail below reads left to right in the order work actually
// happens, and each row shows how far along it is in the same language.
const STAGES = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export default function Page() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [stage, setStage] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get("/order/api/get-seller-orders");
      return res.data.orders;
    },
    staleTime: 1000 * 60 * 6,
  });

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      counts[order.deliveryStatus] = (counts[order.deliveryStatus] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  const visibleOrders = useMemo(
    () =>
      stage ? orders.filter((o: any) => o.deliveryStatus === stage) : orders,
    [orders, stage]
  );

  const columns = useMemo(
    () => [
      {
        id: "id",
        // Sellers read the short form off the table and paste it back into
        // search, so both it and the full id have to match.
        accessorFn: (row: any) =>
          `${row.id} ${row.id.slice(-6).toUpperCase()}`,
        header: "Order",
        cell: ({ row }: any) => (
          <span className="font-mono text-sm font-medium text-white">
            #{row.original.id.slice(-6).toUpperCase()}
          </span>
        ),
      },
      {
        id: "buyer",
        // Searching a buyer by email is as natural as by name, so both feed
        // the filter even though only the name is shown at full size.
        accessorFn: (row: any) =>
          `${row.user?.name ?? "Guest"} ${row.user?.email ?? ""}`,
        header: "Buyer",
        cell: ({ row }: any) => <Buyer user={row.original.user} />,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }: any) => (
          <span className="font-semibold text-white">
            ${Number(row.original.total ?? 0).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Payment",
        cell: ({ row }: any) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              row.original.status === "Paid"
                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                : row.original.status === "Pending"
                ? "bg-amber-500/10 text-amber-400 ring-amber-500/30"
                : "bg-white/[0.04] text-slate-300 ring-slate-700"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "deliveryStatus",
        header: "Delivery",
        cell: ({ row }: any) => (
          <StageMeter status={row.original.deliveryStatus} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => (
          <span className="text-sm text-slate-400">
            {new Date(row.original.createdAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-[#ff8a7d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
          >
            Open
            <ChevronRight size={14} />
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: visibleOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="w-full min-h-screen p-8">
      {/* HEADER */}
      <div className="mb-1 flex items-center gap-3">
        {/* Coral marker — echoes the sidebar's "you are here" accent. */}
        <span
          aria-hidden="true"
          className="h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]"
        />
        <h2 className="text-2xl font-semibold text-white">Orders</h2>
      </div>

      <div className="mt-1 flex items-center text-sm">
        <Link
          href="/dashboard"
          className="text-slate-400 transition-colors hover:text-[#ff8a7d]"
        >
          Dashboard
        </Link>
        <ChevronRight size={16} className="mx-1 text-slate-600" />
        <span className="text-slate-200">Orders</span>
      </div>

      {/* FULFILLMENT RAIL — the page's spine, and the table's filter. */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <StageChip
          label="All orders"
          count={orders.length}
          active={stage === null}
          onClick={() => setStage(null)}
        />
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-800" />
        {STAGES.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            {i > 0 && (
              <ChevronRight
                size={14}
                className="text-slate-700"
                aria-hidden="true"
              />
            )}
            <StageChip
              label={name}
              count={stageCounts[name] ?? 0}
              active={stage === name}
              onClick={() => setStage(stage === name ? null : name)}
            />
          </div>
        ))}
      </div>

      {/* PANEL */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-[#141922] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
          <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-white/[0.03] px-3 py-2 transition-colors focus-within:border-[#ff6f61] focus-within:ring-2 focus-within:ring-[#ff6f61]/25">
            <Search size={16} className="shrink-0 text-slate-500" />
            <input
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by order ID, buyer name, or email"
              aria-label="Search orders"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
          <p className="text-sm text-slate-400" aria-live="polite">
            <span className="font-semibold text-white">{rows.length}</span>{" "}
            {rows.length === 1 ? "order" : "orders"}
            {stage && <span className="text-slate-500"> in {stage}</span>}
          </p>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <EmptyState
            Icon={Inbox}
            title="No orders yet"
            description="When a customer buys from your shop, their order lands here and you can move it through fulfillment."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            Icon={SearchX}
            title="Nothing matches those filters"
            description={
              globalFilter && stage
                ? `No orders in ${stage} match that search.`
                : globalFilter
                ? "No orders match that search."
                : `No orders are sitting in ${stage} right now.`
            }
            action={
              <button
                type="button"
                onClick={() => {
                  setStage(null);
                  setGlobalFilter("");
                }}
                className="mt-5 rounded-lg bg-[#ff6f61] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-800">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-800/60 transition-colors last:border-b-0 hover:bg-white/[0.03]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-5 py-4 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const StageChip = ({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61] ${
      active
        ? "border-[#ff6f61] bg-[#ff6f61]/15 text-[#ff8a7d]"
        : "border-slate-700 bg-white/[0.03] text-slate-300 hover:border-slate-600 hover:text-white"
    }`}
  >
    {label}
    <span
      className={`rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
        active ? "bg-[#ff6f61] text-white" : "bg-white/[0.06] text-slate-400"
      }`}
    >
      {count}
    </span>
  </button>
);

const StageMeter = ({ status }: { status: string }) => {
  const activeIndex = STAGES.indexOf(status);
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`text-sm font-medium ${
          status === "Delivered" ? "text-emerald-400" : "text-slate-200"
        }`}
      >
        {status}
      </span>
      <span
        className="flex gap-1"
        role="img"
        aria-label={
          activeIndex >= 0
            ? `Stage ${activeIndex + 1} of ${STAGES.length}`
            : "Stage unknown"
        }
      >
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`h-1 w-4 rounded-full ${
              i <= activeIndex ? "bg-[#ff6f61]" : "bg-slate-700"
            }`}
          />
        ))}
      </span>
    </div>
  );
};

const Buyer = ({ user }: { user: any }) => (
  <div className="flex items-center gap-3">
    {user?.avatar?.url ? (
      <img
        src={user.avatar.url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-slate-700 object-cover"
      />
    ) : (
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-white/[0.04] text-sm font-semibold text-slate-400"
      >
        {(user?.name ?? "G").charAt(0).toUpperCase()}
      </span>
    )}
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-100">
        {user?.name ?? "Guest"}
      </p>
      {user?.email && (
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      )}
    </div>
  </div>
);

const EmptyState = ({
  Icon,
  title,
  description,
  action,
}: {
  Icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
      <Icon size={24} />
    </span>
    <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
    {action}
  </div>
);

const TableSkeleton = () => (
  <div className="divide-y divide-slate-800/60">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-800 motion-reduce:animate-none" />
        <div className="h-3 w-full max-w-xs animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
        <div className="ml-auto h-3 w-20 shrink-0 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
      </div>
    ))}
  </div>
);
