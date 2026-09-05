"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { useDeferredValue, useMemo, useState } from "react";
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
  Pagination,
  SearchField,
  Select,
  StatusPill,
  downloadCsv,
  shortDate,
} from "@/shared/components/ui";
import { Download, SearchX, ShieldBan, ShieldCheck, Users } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AllUsersPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const deferredFilter = useDeferredValue(globalFilter);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    // `page` belongs in the key: without it every page of results was cached
    // under one entry, so paging showed the first page's rows again.
    queryKey: ["all-users", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-users?page=${page}&limit=${limit}`
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const users = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const filteredUsers = useMemo(() => {
    const filter = deferredFilter.toLowerCase();
    return users.filter((u: any) => {
      const matchesText =
        u.name?.toLowerCase().includes(filter) ||
        u.email?.toLowerCase().includes(filter);
      const matchesRole =
        roleFilter === "all" || u.role?.toLowerCase() === roleFilter;
      return matchesText && matchesRole;
    });
  }, [users, deferredFilter, roleFilter]);

  const closeModal = () => setIsModalOpen(false);

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axiosInstance.put(`/admin/api/ban-user/${userId}`);
    },
    onSuccess: () => {
      toast.success("User banned");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      closeModal();
    },
    onError: () => toast.error("Couldn't ban that user. Try again."),
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axiosInstance.put(`/admin/api/unban-user/${userId}`);
    },
    onSuccess: () => {
      toast.success("User unbanned");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      closeModal();
    },
    onError: () => toast.error("Couldn't unban that user. Try again."),
  });

  const handleExportCSV = () => {
    downloadCsv(
      `users_page_${page}.csv`,
      ["Name", "Email", "Role", "Joined", "Banned"],
      filteredUsers.map((u: any) => [
        u.name,
        u.email,
        u.role,
        new Date(u.createdAt).toLocaleDateString(),
        u.isBanned ? "Yes" : "No",
      ])
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "person",
        header: "Person",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-raised text-xs font-semibold text-on-ink-muted"
              aria-hidden="true"
            >
              {row.original.name?.[0]?.toUpperCase() ?? "?"}
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
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => (
          <StatusPill tone={row.original.role === "admin" ? "warn" : "neutral"}>
            {row.original.role}
          </StatusPill>
        ),
      },
      {
        accessorKey: "isBanned",
        header: "Access",
        cell: ({ row }: any) => (
          <StatusPill tone={row.original.isBanned ? "neg" : "pos"}>
            {row.original.isBanned ? "Banned" : "Active"}
          </StatusPill>
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
      {
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }: any) => {
          const user = row.original;
          return (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                user.isBanned
                  ? "text-on-ink-muted hover:text-pos"
                  : "text-on-ink-muted hover:text-neg"
              }`}
            >
              {user.isBanned ? (
                <ShieldCheck size={16} aria-hidden="true" />
              ) : (
                <ShieldBan size={16} aria-hidden="true" />
              )}
              {user.isBanned ? "Unban" : "Ban"}
            </button>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isBanned = Boolean(selectedUser?.isBanned);
  const pending = banMutation.isPending || unbanMutation.isPending;

  return (
    <PageShell>
      <Crumbs trail={["Users"]} />
      <PageTitle
        title="Users"
        meta={
          isLoading ? (
            "Loading…"
          ) : (
            <>
              <Figure>{filteredUsers.length}</Figure> account
              {filteredUsers.length === 1 ? "" : "s"} on this page
            </>
          )
        }
        actions={
          <>
            <Select
              label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </Select>
            <Button
              variant="ghost"
              onClick={handleExportCSV}
              disabled={!filteredUsers.length}
            >
              <Download size={16} aria-hidden="true" />
              Export CSV
            </Button>
          </>
        }
      />

      <SearchField
        label="Search users"
        placeholder="Search by name or email…"
        value={globalFilter}
        onChange={setGlobalFilter}
      />

      <DataTable
        table={table}
        columnCount={columns.length}
        isLoading={isLoading}
        isEmpty={filteredUsers.length === 0}
        empty={
          globalFilter || roleFilter !== "all" ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="No users match those filters"
              hint="Clear the role filter or shorten your search to widen the results."
            />
          ) : (
            <EmptyState
              icon={<Users size={28} />}
              title="No users yet"
              hint="Accounts appear here as soon as people register on the storefront."
            />
          )
        }
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        tone={isBanned ? "pos" : "neg"}
        title={isBanned ? "Unban this user?" : "Ban this user?"}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={isBanned ? "primary" : "danger"}
              disabled={pending}
              onClick={() =>
                isBanned
                  ? unbanMutation.mutate(selectedUser.id)
                  : banMutation.mutate(selectedUser.id)
              }
            >
              {pending
                ? "Working…"
                : isBanned
                ? "Unban user"
                : "Ban user"}
            </Button>
          </>
        }
      >
        {selectedUser ? (
          <>
            <span className="font-medium text-on-ink">
              {selectedUser.name}
            </span>{" "}
            <span className="text-on-ink-faint">({selectedUser.email})</span>
            <p className="mt-2">
              {isBanned
                ? "They get access back immediately and can sign in again."
                : "They lose access immediately. You can undo this from the same button."}
            </p>
          </>
        ) : null}
      </Modal>
    </PageShell>
  );
}
