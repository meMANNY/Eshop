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
  downloadCsv,
  shortDate,
} from "@/shared/components/ui";
import { shopOf } from "@/utils/shop";
import { Download, PackageSearch, SearchX, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

export default function ProductList() {
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredFilter = useDeferredValue(globalFilter);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["all-products", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-products?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev: any) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const products = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const filteredProducts = useMemo(() => {
    const filter = deferredFilter.toLowerCase();
    return products.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(filter) ||
        p.category?.toLowerCase().includes(filter) ||
        shopOf(p)?.name?.toLowerCase().includes(filter)
    );
  }, [products, deferredFilter]);

  const handleExportCSV = () => {
    downloadCsv(
      `products_page_${page}.csv`,
      ["Title", "Category", "Price", "Stock", "Rating", "Shop", "Created"],
      filteredProducts.map((p: any) => [
        p.title,
        p.category ?? "",
        p.sale_price,
        p.stock,
        p.ratings ?? 5,
        shopOf(p)?.name ?? "",
        new Date(p.createdAt).toLocaleDateString(),
      ])
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "product",
        header: "Product",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <Image
              src={row.original.images?.[0]?.url || "/placeholder.png"}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-md border border-rule object-cover"
            />
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="max-w-[280px] truncate font-medium text-[var(--text)] transition-colors hover:text-coral"
              title={row.original.title}
            >
              {row.original.title}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: any) => (
          <span className="text-[var(--muted)]">{row.original.category}</span>
        ),
      },
      {
        id: "shop",
        header: "Shop",
        cell: ({ row }: any) =>
          shopOf(row.original)?.name ?? (
            <span className="text-[var(--faint)]">—</span>
          ),
      },
      {
        accessorKey: "sale_price",
        header: "Price",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="text-white">
            ${Number(row.original.sale_price ?? 0).toFixed(2)}
          </Figure>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        meta: { align: "right" },
        /*
          Stock is the one number on this page that is an alert, not a fact — a
          pill with the word "Low" says so without relying on the colour alone.
        */
        cell: ({ row }: any) =>
          row.original.stock < 10 ? (
            <StatusPill tone="warn">
              Low · <Figure>{row.original.stock}</Figure>
            </StatusPill>
          ) : (
            <Figure className="text-[var(--muted)]">{row.original.stock}</Figure>
          ),
      },
      {
        accessorKey: "ratings",
        header: "Rating",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <span className="inline-flex items-center gap-1.5">
            <Star size={13} className="fill-warn text-warn" aria-hidden="true" />
            <Figure className="text-[var(--muted)]">
              {(row.original.ratings ?? 5).toFixed(1)}
            </Figure>
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Added",
        cell: ({ row }: any) => (
          <Figure className="text-[var(--muted)]">
            {shortDate(row.original.createdAt)}
          </Figure>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageShell>
      <Crumbs trail={["Products"]} />
      <PageTitle
        title="Products"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{filteredProducts.length}</Figure> product
              {filteredProducts.length === 1 ? "" : "s"} on this page
            </>
          )
        }
        actions={
          <Button
            variant="ghost"
            onClick={handleExportCSV}
            disabled={!filteredProducts.length}
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      <SearchField
        label="Search products"
        placeholder="Search by title, category or shop…"
        value={globalFilter}
        onChange={setGlobalFilter}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={filteredProducts.length === 0}
        empty={
          globalFilter ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="No products match that search"
              hint="Search covers the title, the category and the shop name on this page only."
            />
          ) : (
            <EmptyState
              icon={<PackageSearch size={28} />}
              title="No products yet"
              hint="Listings created by sellers show up here. Items with a promo window are listed under Events instead."
            />
          )
        }
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </PageShell>
  );
}
