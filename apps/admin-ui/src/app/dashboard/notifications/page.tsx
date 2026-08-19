"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import {
  Bar,
  Button,
  Crumbs,
  EmptyState,
  Figure,
  PageShell,
  PageTitle,
  Panel,
  StatusPill,
  shortId,
} from "@/shared/components/ui";

type Notification = {
  id: string;
  title: string;
  message: string;
  creatorId: string;
  redirect_link?: string | null;
  isRead: boolean;
  createdAt: string;
};

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.348],
  ["month", 12],
];

/*
  A notification is read as "how long ago", not as a calendar date — an absolute
  stamp makes you do the subtraction yourself. The exact time stays available in
  the `title`, so nothing is actually lost.
*/
function timeAgo(value: string) {
  let delta = (Date.now() - new Date(value).getTime()) / 1000;
  for (const [unit, span] of STEPS) {
    if (Math.abs(delta) < span) return RELATIVE.format(-Math.round(delta), unit);
    delta /= span;
  }
  return RELATIVE.format(-Math.round(delta), "year");
}

export default function Page() {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    isError,
  } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/get-all-notifications");
      return res.data.notifications ?? [];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      // `role` picks the cookie namespace to authenticate against — this browser
      // may also hold a user or seller session for the same API host.
      await axiosInstance.post("/seller/api/mark-notification-as-read", {
        notificationId,
        role: "admin",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Marked as read");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Couldn't mark that as read"
      );
    },
  });

  // Unread first; the server already returns newest-first, and a stable sort
  // keeps that order inside each group.
  const sorted = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort(
      (a, b) => Number(a.isRead) - Number(b.isRead)
    );
  }, [notifications]);

  const unread = sorted.filter((n) => !n.isRead).length;

  return (
    <PageShell>
      <Crumbs trail={["Notifications"]} />
      <PageTitle
        title="Notifications"
        meta={
          isLoading ? (
            "Loading…"
          ) : unread > 0 ? (
            <>
              <Figure>{unread}</Figure> unread of{" "}
              <Figure>{sorted.length}</Figure>
            </>
          ) : (
            "Nothing outstanding"
          )
        }
      />

      <Panel className="overflow-hidden">
        {isLoading ? (
          <ul className="divide-y divide-rule">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="px-5 py-4">
                <Bar className="h-4 w-48" />
                <Bar className="mt-2.5 h-3.5 w-full max-w-md" />
                <Bar className="mt-2.5 h-3 w-32" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <EmptyState
            icon={<BellRing size={28} />}
            title="Couldn't load notifications"
            hint="Something went wrong reaching the server. Refresh the page to try again."
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<BellRing size={28} />}
            title="No notifications yet"
            hint="Platform-wide activity — orders, sellers joining — lands here as it happens."
          />
        ) : (
          <ul className="divide-y divide-rule">
            {sorted.map((not) => {
              const pending =
                markAsRead.isPending && markAsRead.variables === not.id;

              return (
                <li
                  key={not.id}
                  className={`relative flex items-start justify-between gap-4 px-5 py-4 transition-colors ${
                    not.isRead ? "hover:bg-raised" : "bg-coral-soft"
                  }`}
                >
                  {/* The same coral rail the sidebar puts against the active
                      route — here it marks the rows still wanting attention. */}
                  {!not.isRead ? (
                    <span
                      className="marker absolute inset-y-4 left-0"
                      aria-hidden="true"
                    />
                  ) : null}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2
                        className={`text-[15px] font-semibold ${
                          not.isRead ? "text-[var(--text)]" : "text-white"
                        }`}
                      >
                        {not.title}
                      </h2>
                      {!not.isRead ? (
                        <StatusPill tone="coral">New</StatusPill>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                      {not.message}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--faint)]">
                      <time
                        dateTime={not.createdAt}
                        title={new Date(not.createdAt).toLocaleString()}
                      >
                        {timeAgo(not.createdAt)}
                      </time>
                      <span>
                        From <Figure>{shortId(not.creatorId)}</Figure>
                      </span>
                      {not.redirect_link ? (
                        <Link
                          href={not.redirect_link}
                          className="inline-flex items-center gap-1.5 text-coral transition-colors hover:text-coral-dim"
                        >
                          <ExternalLink size={13} aria-hidden="true" />
                          View details
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {!not.isRead ? (
                    <Button
                      variant="ghost"
                      className="shrink-0"
                      disabled={pending}
                      onClick={() => markAsRead.mutate(not.id)}
                    >
                      <Check size={15} aria-hidden="true" />
                      {pending ? "Marking…" : "Mark as read"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </PageShell>
  );
}
