"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardHead,
  Container,
  Figure,
  SysStrip,
} from "@/shared/components/ui";

type Coupon = null | {
  discountAmount?: number | string;
  discountPercent?: number | string;
  discountProductId?: string;
  code?: string;
};

export default function CheckoutForm({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}: {
  clientSecret: string;
  cartItems: any[];
  coupon: Coupon;
  sessionId: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  const subtotal = useMemo(
    () =>
      (cartItems || []).reduce(
        (sum: number, item: any) =>
          sum + num(item?.quantity) * num(item?.sale_price),
        0
      ),
    [cartItems]
  );

  const discount = useMemo(() => {
    if (!coupon) return 0;
    const amount = num(coupon.discountAmount);
    if (amount > 0) return amount;

    const percent = num(coupon.discountPercent);
    if (percent > 0 && coupon?.discountProductId) {
      const target = (cartItems || []).find(
        (i: any) => i?.id === coupon.discountProductId
      );
      if (!target) return 0;
      const base = num(target?.sale_price) * num(target?.quantity);
      return (base * percent) / 100;
    }
    return 0;
  }, [coupon, cartItems]);

  const total = useMemo(
    () => Math.max(0, subtotal - discount),
    [subtotal, discount]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    if (!stripe || !elements) {
      setLoading(false);
      return;
    }
    const res = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
      },
    });
    if (res.error) {
      setStatus("failed");
      setErrorMsg(res.error.message || "Something went wrong in payment!");
    } else {
      setStatus("success");
    }
    setLoading(false);
  };

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto w-full max-w-xl">
        <SysStrip
          className="mb-10"
          items={[
            { key: "~/checkout", value: "secure payment" },
            { value: "stripe", trailing: true },
          ]}
        />

        <h1 className="mb-8 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink lg:text-4xl">
          Confirm and pay
        </h1>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHead title="Order summary" note={`~/session · ${cartItems?.length ?? 0} items`} />

            <div className="p-5">
              {/* The ledger: a dotted leader between each line and its figure,
                  which is what a receipt actually looks like in print. */}
              <ul>
                {(cartItems || []).map((item: any, i: number) => {
                  const line = num(item?.quantity) * num(item?.sale_price);
                  return (
                    <li
                      key={i}
                      className="flex items-baseline gap-3 border-b border-line py-3 first:pt-0"
                    >
                      <span className="w-8 shrink-0 font-mono text-[10px] font-semibold tracking-[0.14em] text-terra-2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-500">
                        {item?.title || "Item"}
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                          ×{num(item?.quantity)}
                        </span>
                      </span>
                      <Figure className="shrink-0 text-sm text-ink">
                        {fmt.format(line)}
                      </Figure>
                    </li>
                  );
                })}
              </ul>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between">
                  <dt className="text-ink-500">Subtotal</dt>
                  <dd>
                    <Figure className="text-ink">{fmt.format(subtotal)}</Figure>
                  </dd>
                </div>
                {discount > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="text-ink-500">
                      Discount
                      {coupon?.code ? (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-terra-2">
                          {coupon.code}
                        </span>
                      ) : null}
                    </dt>
                    <dd>
                      <Figure className="text-pos">−{fmt.format(discount)}</Figure>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-ink-line pt-4">
                <span className="font-display text-lg font-medium tracking-tight text-ink">
                  Total
                </span>
                <Figure className="text-xl font-semibold text-ink">
                  {fmt.format(total)}
                </Figure>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHead title="Payment" note="~/card" />
            <div className="p-5">
              <PaymentElement />
            </div>
          </Card>

          <Button
            type="submit"
            variant="primary"
            mono
            arrow="→"
            disabled={!stripe || loading}
            className="mt-6 w-full !justify-between"
          >
            {loading ? "Processing…" : `Pay ${fmt.format(total)}`}
          </Button>

          {errorMsg ? (
            <p
              role="alert"
              className="mt-4 border border-neg/40 bg-neg/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neg"
            >
              {errorMsg}
            </p>
          ) : null}

          {status === "success" ? (
            <p className="mt-4 border border-pos/40 bg-pos/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-pos">
              payment successful
            </p>
          ) : null}
          {status === "failed" && !errorMsg ? (
            <p className="mt-4 border border-neg/40 bg-neg/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neg">
              payment failed — please try again
            </p>
          ) : null}
        </form>
      </div>
    </Container>
  );
}
