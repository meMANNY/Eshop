"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import axiosInstance from "@/utils/axiosInstance";
import { useStore } from "@/store";
import {
  Container,
  Serif,
  SysStrip,
  TileGrid,
} from "@/shared/components/ui";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("sessionId"),
    [searchParams]
  );
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [orderStatus, setOrderStatus] = useState<
    "creating" | "success" | "failed"
  >("creating");

  useEffect(() => {
    useStore.setState({ cart: [] });

    const burst = (
      particleCount: number,
      angle: number,
      spread: number,
      originX: number
    ) =>
      confetti({
        particleCount,
        angle,
        spread,
        origin: { x: originX, y: 0.6 },
        // The confetti wears the theme's own palette rather than its default
        // primaries, which read as a different product landing on the page.
        colors: ["#FF6B35", "#C24A1B", "#FFBF4B", "#1A1A1A"],
      });

    burst(90, 60, 70, 0);
    burst(90, 120, 70, 1);
  }, []);

  // The Stripe webhook is what actually creates the order, and it lands
  // independently of this redirect — so the page waits for the order to appear
  // rather than creating it. Creating it here too would race the webhook over
  // the same redis payment-session and make one of them fail spuriously.
  useEffect(() => {
    if (!sessionId) {
      setOrderStatus("failed");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 14; // ~21s at 1.5s intervals
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const res = await axiosInstance.get(
          `order/api/get-order-by-session/${sessionId}`
        );

        if (cancelled) return;

        if (res.data?.orders?.length > 0) {
          setOrderStatus("success");
          /*
            "Track Order" goes to Profile › My Orders, which reads the cached
            ["user-orders"] list. Nothing marked it stale after a checkout, so
            the tab opened on the pre-purchase list and only caught up on a
            later background refetch — the order was in the database, just not
            on screen.
          */
          queryClient.invalidateQueries({ queryKey: ["user-orders"] });
          return;
        }
      } catch (err: any) {
        // A failed poll isn't fatal — the webhook may simply not have landed
        // yet. Keep retrying until the attempt budget runs out.
        console.warn(
          "Order lookup failed:",
          err.response?.status,
          err.response?.data?.details ?? err.message
        );
      }

      if (cancelled) return;

      if (attempts >= MAX_ATTEMPTS) {
        setOrderStatus("failed");
        return;
      }
      timer = setTimeout(poll, 1500);
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId, queryClient]);

  const onCopy = async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const headline =
    orderStatus === "success"
      ? "confirmed"
      : orderStatus === "failed"
      ? "pending"
      : "paid";

  return (
    <Container className="py-14 lg:py-20">
      <SysStrip
        className="mb-12"
        items={[
          { key: "~/order", value: `status: ${headline}` },
          {
            value:
              orderStatus === "creating"
                ? "waiting for confirmation"
                : orderStatus === "success"
                ? "order placed"
                : "taking longer than usual",
            hideOnMobile: true,
          },
          { value: "payment: accepted", trailing: true },
        ]}
      />

      {/*
        The old page opened with a green gradient banner and a tick in a circle —
        a different design system arriving for one screen at the most important
        moment in the app. The theme's own way of saying this is the word itself,
        set large.
      */}
      <h1 className="marquee-title text-[clamp(4rem,16vw,11rem)]">
        {headline}
        <span className="text-terra-2">.</span>
      </h1>

      <p className="mt-8 max-w-xl text-base leading-[1.55] text-ink-500 lg:text-lg">
        {orderStatus === "creating" ? (
          <>
            Your payment went through. We are waiting for the confirmation to
            land — this usually takes a <Serif>few seconds</Serif>.
          </>
        ) : orderStatus === "success" ? (
          <>
            Thank you. Your order is placed and the sellers have been told to get
            it <Serif>moving</Serif>.
          </>
        ) : (
          <>
            Your payment went through, but confirmation is taking longer than
            usual. The order will appear in your profile shortly — nothing is
            lost, and you have <Serif>not</Serif> been charged twice.
          </>
        )}
      </p>

      <div className="mt-12">
        <TileGrid
          items={[
            { label: "View order", href: "/profile?active=My+Orders" },
            { label: "Keep shopping", href: "/products" },
            { label: "Your profile", href: "/profile" },
          ]}
          className="grid-cols-1 sm:grid-cols-3"
        />
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-ink-line pt-6">
        <div className="min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
            payment session id
          </span>
          <span className="figure mt-1 block select-all break-all text-sm text-ink-500">
            {sessionId ?? "—"}
          </span>
        </div>
        {sessionId ? (
          <button
            onClick={onCopy}
            className="link-underline shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-terra-2"
          >
            {copied ? "copied ✓" : "copy ⧉"}
          </button>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {copied ? "Session ID copied to clipboard" : ""}
      </p>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
        invoice and details live in profile › my orders
      </p>
    </Container>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-20">
          <div className="h-12 w-40 animate-pulse bg-surface" />
        </Container>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
