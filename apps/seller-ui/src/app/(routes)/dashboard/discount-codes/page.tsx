"use client";

import { Check, Copy, Plus, TicketPercent, Trash } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import axiosInstance from "@/utils/axiosInstance";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { AxiosError } from "axios";
import DeleteDiscountCodeModal from "@/shared/components/modals/delete.discount-codes";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Button,
  Crumbs,
  EmptyState,
  Field,
  Figure,
  Modal,
  PageShell,
  PageTitle,
  SelectField,
  StatusPill,
} from "@/shared/components/ui";

/* The server caps a shop at eight codes; naming it once keeps the counter, the
   disabled state and the guard in agreement. */
const MAX_CODES = 8;

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.discount_codes || [];
    },
  });

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      public_name: "",
      discountType: "percentage",
      discountValue: "",
      discountCode: "",
    },
  });

  const atLimit = discountCodes.length >= MAX_CODES;

  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data) => {
      await axiosInstance.post("/product/api/create-discount-code", data);
    },
    onSuccess: () => {
      toast.success("Discount code created");
      queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
      reset();
      setShowModal(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Couldn't create that discount code"
      );
    },
  });

  const deleteDiscountCodeMutation = useMutation({
    mutationFn: async (discountId) => {
      await axiosInstance.delete(
        `/product/api/delete-discount-code/${discountId}`
      );
    },
    onSuccess: () => {
      toast.success("Discount code deleted");
      queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
      setShowDeleteModal(false);
      setSelectedDiscount(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Couldn't delete that discount code"
      );
    },
  });

  const onSubmit = (data: any) => {
    // The limit is already visible in the header and disables the button, so this
    // is the backstop rather than the only place the seller finds out.
    if (atLimit) {
      toast.error(`You can have at most ${MAX_CODES} codes at a time`);
      return;
    }
    createDiscountCodeMutation.mutate(data);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "public_name",
        header: "Title",
        cell: ({ row }: any) => (
          <span className="font-medium text-[var(--text)]">
            {row.original.public_name}
          </span>
        ),
      },
      {
        accessorKey: "discountType",
        header: "Type",
        cell: ({ row }: any) => (
          <StatusPill>
            {row.original.discountType === "percentage" ? "Percentage" : "Flat"}
          </StatusPill>
        ),
      },
      {
        accessorKey: "discountValue",
        header: "Value",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <Figure className="font-medium text-white">
            {row.original.discountType === "percentage"
              ? `${row.original.discountValue}%`
              : `$${Number(row.original.discountValue).toFixed(2)}`}
          </Figure>
        ),
      },
      {
        accessorKey: "discountCode",
        header: "Code",
        /*
          A discount code exists to be handed to someone, so the row's job is to
          let you take it away — copying it beats selecting it out of a table cell.
        */
        cell: ({ row }: any) => {
          const code = row.original.discountCode;
          const isCopied = copied === code;
          return (
            <button
              type="button"
              onClick={() => copyCode(code)}
              className="group inline-flex items-center gap-2 rounded border border-rule bg-raised px-2 py-1 transition-colors hover:border-coral/50"
              aria-label={`Copy discount code ${code}`}
            >
              <Figure className="text-coral-bright">{code}</Figure>
              {isCopied ? (
                <Check size={13} className="text-pos" aria-hidden="true" />
              ) : (
                <Copy
                  size={13}
                  className="text-[var(--faint)] group-hover:text-coral"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }: any) => (
          <button
            onClick={() => {
              setSelectedDiscount(row.original);
              setShowDeleteModal(true);
            }}
            aria-label={`Delete ${row.original.public_name}`}
            className="text-[var(--muted)] transition-colors hover:text-neg"
          >
            <Trash size={16} />
          </button>
        ),
      },
    ],
    [copied]
  );

  const table = useReactTable({
    data: discountCodes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const createButton = (
    <Button
      variant="primary"
      onClick={() => setShowModal(true)}
      disabled={atLimit}
      title={atLimit ? `You already have ${MAX_CODES} codes` : undefined}
    >
      <Plus size={16} aria-hidden="true" />
      Create discount
    </Button>
  );

  return (
    <PageShell>
      <Crumbs trail={["Discount codes"]} />
      <PageTitle
        title="Discount codes"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{discountCodes.length}</Figure> of{" "}
              <Figure>{MAX_CODES}</Figure> used
              {atLimit ? " · delete one to add another" : ""}
            </>
          )
        }
        actions={createButton}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={discountCodes.length === 0}
        empty={
          <EmptyState
            icon={<TicketPercent size={28} />}
            title="No discount codes yet"
            hint="Create a code and share it with buyers — they enter it at checkout to get the discount."
            action={createButton}
          />
        }
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        tone="coral"
        title="Create a discount code"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="create-discount"
              disabled={createDiscountCodeMutation.isPending}
            >
              <Plus size={16} aria-hidden="true" />
              {createDiscountCodeMutation.isPending ? "Creating…" : "Create code"}
            </Button>
          </>
        }
      >
        <form
          id="create-discount"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Field
            label="Title"
            required
            hint="Buyers see this name at checkout."
            error={errors.public_name?.message as string}
            {...register("public_name", { required: "Give the code a title" })}
          />

          <Controller
            control={control}
            name="discountType"
            rules={{ required: "Pick a discount type" }}
            render={({ field }) => (
              <SelectField
                label="Type"
                required
                error={errors.discountType?.message as string}
                {...field}
              >
                <option value="percentage">Percentage off</option>
                <option value="flat">Flat amount off</option>
              </SelectField>
            )}
          />

          <Field
            label="Value"
            type="number"
            min={0}
            required
            error={errors.discountValue?.message as string}
            {...register("discountValue", {
              required: "Enter a discount value",
              valueAsNumber: true,
              min: { value: 1, message: "Must be greater than 0" },
            })}
          />

          <Field
            label="Code"
            required
            hint="What the buyer types in. At least 3 characters."
            className="font-mono uppercase"
            error={errors.discountCode?.message as string}
            {...register("discountCode", {
              required: "Enter a code",
              minLength: { value: 3, message: "At least 3 characters" },
            })}
          />

          {createDiscountCodeMutation.isError ? (
            <p role="alert" className="text-sm text-neg">
              {(
                createDiscountCodeMutation.error as AxiosError<{
                  message: string;
                }>
              )?.response?.data?.message ?? "Something went wrong"}
            </p>
          ) : null}
        </form>
      </Modal>

      {showDeleteModal && selectedDiscount ? (
        <DeleteDiscountCodeModal
          discount={selectedDiscount}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteDiscountCodeMutation.mutate(selectedDiscount?.id)}
        />
      ) : null}
    </PageShell>
  );
};

export default Page;
