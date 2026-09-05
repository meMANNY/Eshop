"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { useDeferredValue, useMemo, useState } from "react";
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
  downloadCsv,
  shortDate,
} from "@/shared/components/ui";
import { Download, SearchX, Store } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const deferredFilter = useDeferredValue(globalFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["all-sellers", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-sellers?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const sellers = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const filteredSellers = useMemo(() => {
    const filter = deferredFilter.toLowerCase();
    return sellers.filter(
      (s: any) =>
        s.name?.toLowerCase().includes(filter) ||
        s.email?.toLowerCase().includes(filter) ||
        s.shop?.name?.toLowerCase().includes(filter)
    );
  }, [sellers, deferredFilter]);

  const withoutShop = useMemo(
    () => filteredSellers.filter((s: any) => !s.shop).length,
    [filteredSellers]
  );

  const handleExportCSV = () => {
    downloadCsv(
      `sellers_page_${page}.csv`,
      ["Name", "Email", "Shop", "Address", "Joined"],
      filteredSellers.map((s: any) => [
        s.name,
        s.email,
        s.shop?.name ?? "",
        s.shop?.address ?? "",
        new Date(s.createdAt).toLocaleDateString(),
      ])
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "seller",
        header: "Seller",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-raised text-xs font-semibold text-on-ink-muted"
              aria-hidden="true"
            >
              {/* `shops.avatar` is an `images[]` relation — indexing is required.
                  Reading `.url` off the array gave undefined every time, so this
                  always fell through to the initial. */}
              {row.original.shop?.avatar?.[0]?.url ? (
                <img
                  src={row.original.shop.avatar[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                row.original.name?.[0]?.toUpperCase() ?? "?"
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-on-ink">
                {row.original.name}
              </span>
              <span className="block truncate text-xs text-on-ink-faint">
                {row.original.email}
              </span>
            </span>
          </div>
        ),
      },
      {
        id: "shop",
        header: "Shop",
        cell: ({ row }: any) =>
          row.original.shop ? (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/shop/${row.original.shop.id}`}
              className="text-on-ink transition-colors hover:text-terra"
            >
              {row.original.shop.name}
            </Link>
          ) : (
            /*
              A seller with no shop hasn't finished onboarding — worth calling out
              plainly rather than printing a dash that reads like missing data.
            */
            <span className="text-on-ink-faint">Not set up yet</span>
          ),
      },
      {
        id: "address",
        header: "Address",
        cell: ({ row }: any) => (
          <span
            className="block max-w-[280px] truncate text-on-ink-muted"
            title={row.original.shop?.address ?? undefined}
          >
            {row.original.shop?.address ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) => (
          <Figure className="text-on-ink-muted">
            {shortDate(row.original.createdAt)}
          </Figure>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredSellers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageShell>
      <Crumbs trail={["Sellers"]} />
      <PageTitle
        title="Sellers"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{filteredSellers.length}</Figure> seller
              {filteredSellers.length === 1 ? "" : "s"} on this page
              {withoutShop > 0 ? (
                <>
                  {" · "}
                  <Figure className="text-warn">{withoutShop}</Figure> without a
                  shop
                </>
              ) : null}
            </>
          )
        }
        actions={
          <Button
            variant="ghost"
            onClick={handleExportCSV}
            disabled={!filteredSellers.length}
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      <SearchField
        label="Search sellers"
        placeholder="Search by name, email or shop…"
        value={globalFilter}
        onChange={setGlobalFilter}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={filteredSellers.length === 0}
        empty={
          globalFilter ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="No sellers match that search"
              hint="Search covers the seller's name, email and shop name on this page only."
            />
          ) : (
            <EmptyState
              icon={<Store size={28} />}
              title="No sellers yet"
              hint="Sellers appear here once they register and verify their account."
            />
          )
        }
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </PageShell>
  );
}
