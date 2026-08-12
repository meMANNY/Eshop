"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/shared/components/Loader";
import {
  Button,
  ButtonLink,
  Card,
  Container,
  Crumbs,
  EmptyState,
  Figure,
  PageHeading,
  StatusPill,
  money,
} from "@/shared/components/ui";

export default function Cart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [discountedProductId, setDiscountedProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [error, setError] = useState("");
  const [storedCouponCode, setStoredCouponCode] = useState("");

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const removeFromCart = useStore((state: any) => state.removeFromCart);
  const cart = useStore((state: any) => state.cart);

  const couponCodeApply = async () => {
    setError("");
    if (!couponCode.trim()) {
      setError("Enter a coupon code first.");
      return;
    }
    try {
      const res = await axiosInstance.post("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });
      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setError(res.data.message || "That code doesn't apply to anything in your cart.");
      }
    } catch (err: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      setError(err?.response?.data?.message ?? "Couldn't check that code. Try again.");
    }
  };

  const createPaymentSession = async () => {
    if (addresses?.length === 0) {
      toast.error("Add a delivery address before checking out.");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/order/api/create-payment-session", {
        cart,
        selectedAddressId,
        coupon: {
          code: storedCouponCode,
          discountAmount,
          discountPercent,
          discountedProductId,
        },
      });
      router.push(`/checkout?sessionId=${res.data.sessionId}`);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const setQuantity = (id: string, delta: number) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, (item.quantity ?? 1) + delta) }
          : item
      ),
    }));
  };

  const subTotal = cart.reduce(
    (total: number, item: any) => total + (item.quantity ?? 1) * item.sale_price,
    0
  );
  // Subtotal is what the goods cost; the total is what you pay after the coupon.
  // Both used to render `subTotal - discountAmount`, so a cart with a discount
  // showed a subtotal, a deduction, and a total that didn't follow from them.
  const total = subTotal - discountAmount;

  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      setSelectedAddressId((defaultAddress ?? addresses[0]).id);
    }
  }, [addresses, selectedAddressId]);

  return (
    <main className="pb-16">
      <Container className="pt-8">
        <Crumbs trail={[{ label: "Cart" }]} />
        <div className="mt-4">
          <PageHeading
            title="Your cart"
            meta={
              cart.length ? (
                <>
                  <Figure>{cart.length}</Figure>{" "}
                  {cart.length === 1 ? "item" : "items"} · subtotal{" "}
                  <Figure className="text-ink">{money(subTotal)}</Figure>
                </>
              ) : undefined
            }
          />
        </div>

        {cart.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ShoppingCart size={28} />}
              title="Your cart is empty"
              hint="Add a few products and they'll show up here, ready to check out."
              action={<ButtonLink href="/products">Browse products</ButtonLink>}
            />
          </Card>
        ) : (
          <div className="flex flex-col items-start gap-6 lg:flex-row">
            {/* Line items */}
            <Card className="w-full overflow-hidden lg:w-[68%]">
              <ul className="divide-y divide-rule">
                {cart.map((item: any) => {
                  const discounted = item.id === discountedProductId;
                  const unit = discounted
                    ? (item.sale_price * (100 - discountPercent)) / 100
                    : item.sale_price;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap sm:p-5"
                    >
                      <Image
                        src={item?.images?.[0]?.url || "/placeholder.png"}
                        alt=""
                        width={88}
                        height={88}
                        unoptimized
                        className="h-20 w-20 shrink-0 rounded-lg border border-rule object-cover sm:h-[88px] sm:w-[88px]"
                      />

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item?.slug}`}
                          className="clamp-2 font-medium text-ink transition-colors hover:text-coral-ink"
                        >
                          {item?.title}
                        </Link>

                        {item?.selectedOptions ? (
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                            {item.selectedOptions.color ? (
                              <span className="flex items-center gap-1.5">
                                Colour
                                <span
                                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-rule"
                                  style={{ backgroundColor: item.selectedOptions.color }}
                                />
                              </span>
                            ) : null}
                            {item.selectedOptions.size ? (
                              <span>Size {item.selectedOptions.size}</span>
                            ) : null}
                          </div>
                        ) : null}

                        {discounted ? (
                          <span className="mt-2 inline-block">
                            <StatusPill tone="pos">
                              Coupon applied · −{discountPercent}%
                            </StatusPill>
                          </span>
                        ) : null}

                        {/* Quantity stepper sits with the item on narrow screens
                            rather than in a column that can't fit. */}
                        <div className="mt-3 flex w-[124px] items-center justify-between rounded-full border border-rule p-1">
                          <button
                            aria-label={`Decrease quantity of ${item?.title}`}
                            onClick={() => setQuantity(item.id, -1)}
                            disabled={(item.quantity ?? 1) <= 1}
                            className="grid h-7 w-7 place-items-center rounded-full text-ink-muted transition-colors hover:bg-coral-soft hover:text-coral-ink disabled:opacity-40"
                          >
                            <Minus size={14} />
                          </button>
                          <Figure className="text-sm font-medium text-ink">
                            {item?.quantity ?? 1}
                          </Figure>
                          <button
                            aria-label={`Increase quantity of ${item?.title}`}
                            onClick={() => setQuantity(item.id, 1)}
                            className="grid h-7 w-7 place-items-center rounded-full text-ink-muted transition-colors hover:bg-coral-soft hover:text-coral-ink"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {/* Line total, not unit price — what this row adds to the
                            bill is the number you're checking. */}
                        <Figure className="text-base font-semibold text-ink">
                          {money(unit * (item.quantity ?? 1))}
                        </Figure>
                        {(item.quantity ?? 1) > 1 || discounted ? (
                          <span className="figure text-xs text-ink-faint">
                            {money(unit)} each
                          </span>
                        ) : null}
                        <button
                          onClick={() => removeFromCart(item.id, user, location, deviceInfo)}
                          aria-label={`Remove ${item?.title} from cart`}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-ink-faint transition-colors hover:text-neg"
                        >
                          <X size={14} /> Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Order summary */}
            <Card className="w-full p-5 lg:sticky lg:top-24 lg:w-[32%]">
              <h2 className="font-jost text-lg font-semibold text-ink">
                Order summary
              </h2>

              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="Subtotal" value={money(subTotal)} />
                {discountAmount > 0 ? (
                  <Row
                    label={`Discount (${discountPercent}%)`}
                    value={`−${money(discountAmount)}`}
                    tone="pos"
                  />
                ) : null}
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
                <span className="font-jost text-lg font-semibold text-ink">Total</span>
                <Figure className="text-xl font-semibold text-ink">
                  {money(total)}
                </Figure>
              </div>

              <div className="mt-5 border-t border-rule pt-5">
                <label
                  htmlFor="coupon"
                  className="mb-1.5 block text-label font-semibold uppercase text-ink-muted"
                >
                  Coupon code
                </label>
                <div className="flex">
                  <input
                    id="coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter a code"
                    className="w-full rounded-l-lg border border-rule px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-coral placeholder:text-ink-faint"
                  />
                  <button
                    onClick={couponCodeApply}
                    className="rounded-r-lg bg-coral px-4 text-sm font-medium text-[#2b0f0a] transition-colors hover:bg-coral-dim"
                  >
                    Apply
                  </button>
                </div>
                {error ? (
                  <p role="alert" className="pt-2 text-sm text-neg">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 border-t border-rule pt-5">
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-label font-semibold uppercase text-ink-muted"
                >
                  Deliver to
                </label>
                {addresses?.length ? (
                  <select
                    id="address"
                    className="w-full rounded-lg border border-rule px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-coral"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((address: any) => (
                      <option key={address.id} value={address.id}>
                        {address?.label} — {address?.city}, {address?.country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg bg-coral-soft px-3 py-2.5 text-sm text-ink-muted">
                    You need an address before you can order.{" "}
                    <Link
                      href="/profile"
                      className="font-medium text-coral-ink hover:underline"
                    >
                      Add one
                    </Link>
                  </div>
                )}
              </div>

              {/*
                A "Payment method" select used to sit here offering online payment
                or cash on delivery. Its value was never held in state and never
                sent with the order, so whichever option you picked, checkout went
                to Stripe. Removed until it's wired.
              */}

              <Button
                variant="primary"
                onClick={createPaymentSession}
                disabled={loading || !addresses?.length}
                className="mt-6 w-full"
              >
                {loading ? <Loader size={18} color="text-[#2b0f0a]" /> : null}
                {loading ? "Redirecting…" : "Proceed to checkout"}
              </Button>
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd>
        <span className={`figure ${tone === "pos" ? "text-pos" : "text-ink"}`}>
          {value}
        </span>
      </dd>
    </div>
  );
}
