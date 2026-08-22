"use client";

import React, { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, PackageSearch, Pencil, Plus, SearchX, Star, Trash } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeleteConfirmationModal from "@/shared/components/modals/delete.confirmation.modal";
import toast from "react-hot-toast";
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
} from "@/shared/components/ui";

const fetchProducts = async () => {
  const res = await axiosInstance.get("/product/api/get-shop-products");
  return res?.data?.products;
};

/*
  What counts as "low" is the seller's call, set under Settings → General. This
  column used to hardcode 10, so raising the threshold to 25 changed nothing
  here and the setting quietly meant nothing. Same query key as the settings
  form, so the two stay in step and share one fetch.
*/
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const fetchLowStockThreshold = async () => {
  const res = await axiosInstance.get("/seller/api/get-shop-settings");
  const value = Number(res?.data?.settings?.lowStockThreshold);
  return Number.isFinite(value) ? value : DEFAULT_LOW_STOCK_THRESHOLD;
};

const ProductList = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const { data: lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD } = useQuery({
    queryKey: ["settings", "general", "lowStockThreshold"],
    queryFn: fetchLowStockThreshold,
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await axiosInstance.delete(`/product/api/delete-product/${productId}`);
    },
    onSuccess: () => {
      toast.success("Product scheduled for deletion");
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Couldn't delete that product");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (productId: string) => {
      await axiosInstance.put(`/product/api/restore-product/${productId}`);
    },
    onSuccess: () => {
      toast.success("Product restored");
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Couldn't restore that product");
    },
  });

  const columns = useMemo(
    () => [
      {
        id: "product",
        header: "Product",
        cell: ({ row }: any) => {
          const src = row.original.images?.[0]?.url;
          return (
            <div className="flex items-center gap-3">
              {src ? (
                <Image
                  src={src}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-md border border-rule object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-md border border-rule bg-raised" />
              )}
              <Link
                href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                className="max-w-[260px] truncate font-medium text-[var(--text)] transition-colors hover:text-coral"
                title={row.original.title}
              >
                {row.original.title}
              </Link>
            </div>
          );
        },
      },
      {
        id: "state",
        header: "State",
        /*
          Deleting is a soft delete the seller can undo, but nothing in this table
          said which rows were already scheduled for removal — the only hint was
          the modal offering "restore" once you clicked through.
        */
        cell: ({ row }: any) =>
          row.original.isDeleted ? (
            <StatusPill tone="neg">Scheduled for deletion</StatusPill>
          ) : (
            <StatusPill tone="pos">Live</StatusPill>
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
        accessorKey: "sale_price",
        header: "Price",
        meta: { align: "right" },
        cell: ({ row }: any) => {
          const { sale_price, regular_price } = row.original;
          return (
            <span className="inline-flex items-baseline gap-2">
              {regular_price > sale_price ? (
                <Figure className="text-xs text-[var(--faint)] line-through">
                  {money(regular_price)}
                </Figure>
              ) : null}
              <Figure className="font-medium text-white">{money(sale_price)}</Figure>
            </span>
          );
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        meta: { align: "right" },
        // Low stock is an alert, not a fact — the word carries it, not the colour.
        // "or fewer" is what the setting promises, hence `<=` rather than `<`.
        cell: ({ row }: any) =>
          row.original.stock <= lowStockThreshold ? (
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
        id: "actions",
        header: "",
        meta: { align: "right" },
        /*
          The analytics button that used to sit here set `selectedProduct` and
          then did nothing — the panel it opened was commented out. A control that
          looks live and isn't costs more than a missing one.
        */
        cell: ({ row }: any) => (
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-[var(--muted)] transition-colors hover:text-coral"
              title="View on the storefront"
            >
              <Eye size={16} />
            </Link>
            <Link
              href={`/dashboard/edit-product/${row.original.id}`}
              className="text-[var(--muted)] transition-colors hover:text-coral"
              title="Edit product"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSelectedProduct(row.original);
                setShowDeleteModal(true);
              }}
              className="text-[var(--muted)] transition-colors hover:text-neg"
              title={row.original.isDeleted ? "Restore product" : "Delete product"}
            >
              <Trash size={16} />
            </button>
          </div>
        ),
      },
    ],
    [lowStockThreshold]
  );

  const table = useReactTable({
    data: products,
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
      <Crumbs trail={["All products"]} />
      <PageTitle
        title="All products"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{shown}</Figure>
              {shown === products.length
                ? ` product${products.length === 1 ? "" : "s"} in your shop`
                : ` of ${products.length} matching your search`}
            </>
          )
        }
        actions={
          <Link
            href="/dashboard/create-product"
            className="inline-flex items-center gap-2 rounded-lg bg-coral px-3.5 py-2 text-sm font-medium text-[#1a0d0b] transition-colors hover:bg-coral-dim"
          >
            <Plus size={16} aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <SearchField
        label="Search products"
        placeholder="Search by title, category or price…"
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
              title="No products match that search"
              hint="Try a shorter term — search covers the title, category and price."
            />
          ) : (
            <EmptyState
              icon={<PackageSearch size={28} />}
              title="Your shop has no products yet"
              hint="Add your first listing and it will show up on the storefront straight away."
              action={
                <Link
                  href="/dashboard/create-product"
                  className="inline-flex items-center gap-2 rounded-lg bg-coral px-3.5 py-2 text-sm font-medium text-[#1a0d0b] transition-colors hover:bg-coral-dim"
                >
                  <Plus size={16} aria-hidden="true" />
                  Add product
                </Link>
              }
            />
          )
        }
      />

      {showDeleteModal && (
        <DeleteConfirmationModal
          product={selectedProduct}
          isLoading={deleteMutation.isPending || restoreMutation.isPending}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteMutation.mutate((selectedProduct as any)?.id)}
          onRestore={() => restoreMutation.mutate((selectedProduct as any)?.id)}
        />
      )}
    </PageShell>
  );
};

export default ProductList;
