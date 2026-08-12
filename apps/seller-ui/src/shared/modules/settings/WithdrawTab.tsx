"use client";

import StripeSLogo from "@/assests/svgs/stripe-logo";
import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import {
  Bar,
  Button,
  EmptyState,
  Figure,
  Panel,
  PanelHead,
  StatusPill,
} from "@/shared/components/ui";

type StripeAccount = {
  email?: string;
  businessName?: string;
  country?: string;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  lastPayout?: string | null;
  dashboardUrl?: string | null;
  connected?: boolean;
};

export default function WithdrawMethodTab() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["stripe-account"],
    queryFn: async (): Promise<StripeAccount | null> => {
      try {
        const res = await axiosInstance.get("/seller/api/get-stripe-account");
        const p = res.data;
        if (!p?.success && p?.connected === false) return null;
        return {
          email: p?.email,
          businessName: p?.businessName,
          country: p?.country,
          payoutsEnabled: !!p?.payoutsEnabled,
          chargesEnabled: !!p?.chargesEnabled,
          lastPayout: p?.lastPayout ?? null,
          dashboardUrl: p?.dashboardUrl ?? null,
          connected: !!p?.connected || !!p?.chargesEnabled,
        };
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: connectStripe, isPending: linking } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post("/api/create-stripe-link");
      if (!res.data?.url) throw new Error("No Stripe link URL returned");
      return res.data.url as string;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  if (isLoading) {
    return (
      <Panel>
        <PanelHead title="Withdraw method" />
        <div className="space-y-3 p-5" role="status" aria-label="Loading payout details">
          <Bar className="h-4 w-48" />
          <Bar className="h-20 w-full" />
        </div>
      </Panel>
    );
  }

  if (isError) {
    return (
      <Panel>
        <PanelHead title="Withdraw method" />
        <EmptyState
          title="Couldn't load your Stripe status"
          hint="The payment service didn't respond. Your payout settings are unchanged."
          action={
            <Button variant="ghost" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      </Panel>
    );
  }

  if (!data || !data.connected) {
    return (
      <Panel>
        <PanelHead title="Withdraw method" />
        <EmptyState
          title="Connect Stripe to get paid"
          hint="Buyers pay through the marketplace and Stripe forwards your share. Nothing can be paid out until this is connected."
          action={
            <Button
              variant="primary"
              onClick={() => connectStripe()}
              disabled={linking}
            >
              {linking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Redirecting…
                </>
              ) : (
                <>
                  Connect Stripe
                  <StripeSLogo />
                </>
              )}
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHead
        title="Withdraw method"
        note="Where your share of each order is sent."
        actions={
          /*
            `router.push` was being used for an external URL, which Next treats as
            a client-side route and cannot navigate to. An anchor is what actually
            opens Stripe — and the account's own dashboard link is used when the
            API returns one, rather than always the generic login page.
          */
          <a
            href={data.dashboardUrl ?? "https://dashboard.stripe.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-rule bg-raised px-3.5 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:border-[#2a3547]"
          >
            Open Stripe
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        }
      />

      <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pos/10">
          <CheckCircle2 className="h-4 w-4 text-pos" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text)]">
            Connected to Stripe
          </p>
          <p className="truncate text-xs text-[var(--faint)]">{data.email ?? "—"}</p>
        </div>
      </div>

      <dl className="divide-y divide-rule">
        <Row label="Business name">{data.businessName ?? "—"}</Row>
        <Row label="Country">{data.country ?? "—"}</Row>
        <Row label="Payouts">
          {/* Yes/No in green was colour doing the work; the pill says the state. */}
          <StatusPill tone={data.payoutsEnabled ? "pos" : "warn"}>
            {data.payoutsEnabled ? "Enabled" : "Not enabled"}
          </StatusPill>
        </Row>
        <Row label="Charges">
          <StatusPill tone={data.chargesEnabled ? "pos" : "warn"}>
            {data.chargesEnabled ? "Enabled" : "Not enabled"}
          </StatusPill>
        </Row>
        <Row label="Last payout">
          {data.lastPayout ? (
            <Figure className="text-[var(--text)]">{data.lastPayout}</Figure>
          ) : (
            <span className="text-[var(--faint)]">No payouts yet</span>
          )}
        </Row>
      </dl>
    </Panel>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-label font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--text)]">{children}</dd>
    </div>
  );
}
