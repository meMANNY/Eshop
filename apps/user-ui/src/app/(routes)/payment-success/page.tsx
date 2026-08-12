"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import axiosInstance from "@/utils/axiosInstance";
import { useStore } from "@/store";

import {
  CheckCircle2,
  Truck,
  ShoppingBag,
  Clipboard,
  ClipboardCheck,
} from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(
    () => searchParams.get("sessionId"),
    [searchParams]
  );
  const router = useRouter();
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
  }, [sessionId]);

  const onCopy = async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center px-4 py-12 bg-gradient-to-b from-green-50 to-white">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl bg-surface border border-rule shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-surface/15 rounded-full p-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-tight">
                  {orderStatus === "creating"
                    ? "Payment Successful"
                    : orderStatus === "success"
                    ? "Order Confirmed 🎉"
                    : "Still confirming your order"}
                </h1>
                <p className="text-white/90 text-sm">
                  {orderStatus === "creating"
                    ? "Finalizing your order..."
                    : orderStatus === "success"
                    ? "Thank you! Your order has been placed."
                    : "Your payment went through. Confirmation is taking longer than usual — your order will appear in Profile › My Orders shortly."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <li className="flex items-start gap-3 rounded-xl border border-rule p-3">
                <div className="mt-0.5">
                  <Truck className="w-5 h-5 text-pos" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    Track your shipment
                  </p>
                  <p className="text-xs text-ink-muted">
                    See status, ETA, and courier updates.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-rule p-3">
                <div className="mt-0.5">
                  <ShoppingBag className="w-5 h-5 text-pos" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    Continue shopping
                  </p>
                  <p className="text-xs text-ink-muted">
                    Check new arrivals and offers.
                  </p>
                </div>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/profile?active=My+Orders")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/60"
              >
                <Truck className="w-4 h-4" /> Track Order
              </button>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/50"
              >
                <ShoppingBag className="w-4 h-4" /> Continue Shopping
              </button>
            </div>

            <div className="my-6 h-px bg-gray-100" />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-ink-muted">
                <span className="block text-ink-faint">Payment Session ID</span>
                <span className="font-mono text-ink-muted break-all select-all">
                  {sessionId ?? "—"}
                </span>
              </div>
              {sessionId && (
                <button
                  onClick={onCopy}
                  className="inline-flex items-center gap-2 rounded-lg border border-rule px-3 py-2 text-xs font-medium text-ink-muted hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50"
                >
                  {copied ? (
                    <>
                      <ClipboardCheck className="w-4 h-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="sr-only" aria-live="polite">
              {copied ? "Session ID copied to clipboard" : ""}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-ink-faint text-center mt-3">
          You can find your invoice and order details in{" "}
          <span className="font-medium text-ink-muted">Profile › My Orders</span>
          .
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}