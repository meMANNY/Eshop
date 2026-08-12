"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { useMemo, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/ui/data-table";
import {
  Button,
  Crumbs,
  EmptyState,
  Figure,
  Modal,
  PageShell,
  PageTitle,
  StatusPill,
  TextField,
  shortDate,
} from "@/shared/components/ui";
import { ShieldPlus, UserCog } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TeamManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["all-admins"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/api/get-all-admins`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const admins = data?.admins ?? [];

  const addAdminMutation = useMutation({
    mutationFn: async (address: string) => {
      await axiosInstance.put(`/admin/api/add-new-admin`, { email: address });
    },
    onSuccess: () => {
      toast.success("Admin access granted");
      queryClient.invalidateQueries({ queryKey: ["all-admins"] });
      setEmail("");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ?? "Couldn't grant admin access. Try again."
      );
    },
  });

  const columns = useMemo(
    () => [
      {
        id: "person",
        header: "Admin",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-coral-soft text-xs font-semibold text-coral"
              aria-hidden="true"
            >
              {row.original.name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-[var(--text)]">
                {row.original.name}
              </span>
              <span className="block truncate text-xs text-[var(--faint)]">
                {row.original.email}
              </span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => (
          <StatusPill tone="warn">{row.original.role}</StatusPill>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Member since",
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
    data: admins,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageShell>
      <Crumbs trail={["Management"]} />
      <PageTitle
        title="Team"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{admins.length}</Figure> account
              {admins.length === 1 ? "" : "s"} can sign in to this console
            </>
          )
        }
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <ShieldPlus size={16} aria-hidden="true" />
            Add admin
          </Button>
        }
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={admins.length === 0}
        empty={
          <EmptyState
            icon={<UserCog size={28} />}
            title="No admins listed"
            hint="Promote an existing storefront account to admin to give it access here."
            action={
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <ShieldPlus size={16} aria-hidden="true" />
                Add admin
              </Button>
            }
          />
        }
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tone="warn"
        title="Add an admin"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={addAdminMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => addAdminMutation.mutate(email)}
              disabled={addAdminMutation.isPending || !email.trim()}
            >
              {addAdminMutation.isPending ? "Working…" : "Grant access"}
            </Button>
          </>
        }
      >
        <p className="mb-4">
          The person must already have a storefront account. Promoting them gives
          full access to every page in this console, including bans and payouts.
        </p>
        <TextField
          label="Account email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Modal>
    </PageShell>
  );
}
