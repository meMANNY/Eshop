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
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/shared/components/Loader";
import {
  Button,
  ButtonLink,
  Card,
  CardHead,
  Chip,
  Container,
  Crumbs,
  EmptyState,
  Figure,
  Label,
  PageHeading,
  Select,
  StatusPill,
  SysStrip,
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
    <div className="pb-16">
      <Container className="pt-8">
        <Crumbs trail={[{ label: "Cart" }]} />

        <div className="mt-6">
          <PageHeading kicker="/cart · your basket" title="Your cart" />
        </div>

        {cart.length ? (
          <SysStrip
            className="mb-10"
            items={[
              { key: "~/cart", value: `${cart.length} ${cart.length === 1 ? "item" : "items"}` },
              { value: `subtotal ${money(subTotal)}` },
              { value: `total ${money(total)}`, trailing: true },
            ]}
          />
        ) : null}

        {cart.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ShoppingCart size={28} />}
              title="Your cart is empty"
              hint="Add a few products and they'll show up here, ready to check out."
              action={
                <ButtonLink href="/products" variant="primary" arrow="→">
                  Browse products
                </ButtonLink>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            {/* Line items, as a ruled ledger rather than a stack of cards. */}
            <div className="w-full lg:w-[66%]">
              <ul className="border-t border-ink-line">
                {cart.map((item: any) => {
                  const discounted = item.id === discountedProductId;
                  const unit = discounted
                    ? (item.sale_price * (100 - discountPercent)) / 100
                    : item.sale_price;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start gap-5 border-b border-line py-6 sm:flex-nowrap"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-line bg-surface">
                        <Image
                          src={item?.images?.[0]?.url || "/placeholder.png"}
                          alt=""
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item?.slug}`}
                          className="clamp-2 font-display text-base font-medium tracking-tight text-ink transition-colors hover:text-terra"
                        >
                          {item?.title}
                        </Link>

                        {item?.selectedOptions ? (
                          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                            {item.selectedOptions.color ? (
                              <span className="flex items-center gap-1.5">
                                colour
                                <span
                                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-line"
                                  style={{ backgroundColor: item.selectedOptions.color }}
                                />
                              </span>
                            ) : null}
                            {item.selectedOptions.size ? (
                              <span>size {item.selectedOptions.size}</span>
                            ) : null}
                          </div>
                        ) : null}

                        {discounted ? (
                          <span className="mt-2.5 inline-block">
                            <StatusPill tone="pos">
                              coupon · −{discountPercent}%
                            </StatusPill>
                          </span>
                        ) : null}

                        {/* Quantity stepper sits with the item on narrow screens
                            rather than in a column that can't fit. */}
                        <div className="mt-4 flex w-fit items-stretch border border-line">
                          <button
                            aria-label={`Decrease quantity of ${item?.title}`}
                            onClick={() => setQuantity(item.id, -1)}
                            disabled={(item.quantity ?? 1) <= 1}
                            className="grid h-9 w-9 place-items-center border-r border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
                          >
                            <span aria-hidden="true">−</span>
                          </button>
                          <Figure className="grid w-11 place-items-center text-sm text-ink">
                            {item?.quantity ?? 1}
                          </Figure>
                          <button
                            aria-label={`Increase quantity of ${item?.title}`}
                            onClick={() => setQuantity(item.id, 1)}
                            className="grid h-9 w-9 place-items-center border-l border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink"
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {/* Line total, not unit price — what this row adds to the
                            bill is the number you're checking. */}
                        <Figure className="text-base font-semibold text-ink">
                          {money(unit * (item.quantity ?? 1))}
                        </Figure>
                        {(item.quantity ?? 1) > 1 || discounted ? (
                          <span className="figure text-xs text-ink-300">
                            {money(unit)} each
                          </span>
                        ) : null}
                        <button
                          onClick={() => removeFromCart(item.id, user, location, deviceInfo)}
                          aria-label={`Remove ${item?.title} from cart`}
                          className="link-underline mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-neg"
                        >
                          remove ×
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Order summary */}
            <Card className="w-full lg:sticky lg:top-24 lg:w-[34%]">
              <CardHead
                title="Order summary"
                note={`~/cart · ${cart.length} ${cart.length === 1 ? "item" : "items"}`}
              />

              <div className="p-5">
                <dl className="space-y-3 text-sm">
                  <Row label="Subtotal" value={money(subTotal)} />
                  {discountAmount > 0 ? (
                    <Row
                      label={`Discount (${discountPercent}%)`}
                      value={`−${money(discountAmount)}`}
                      tone="pos"
                    />
                  ) : null}
                </dl>

                <div className="mt-4 flex items-baseline justify-between border-t border-ink-line pt-4">
                  <span className="font-display text-lg font-medium tracking-tight text-ink">
                    Total
                  </span>
                  <Figure className="text-xl font-semibold text-ink">
                    {money(total)}
                  </Figure>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <Label htmlFor="coupon">Coupon code</Label>
                  <div className="flex items-stretch border border-line">
                    <input
                      id="coupon"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter a code"
                      className="w-full bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:font-mono placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.1em] placeholder:text-ink-400 focus:bg-paper"
                    />
                    <button
                      onClick={couponCodeApply}
                      className="shrink-0 border-l border-line bg-ink px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-terra hover:text-white"
                    >
                      apply →
                    </button>
                  </div>
                  {error ? (
                    <p
                      role="alert"
                      className="pt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neg"
                    >
                      {error}
                    </p>
                  ) : null}
                  {storedCouponCode ? (
                    <span className="mt-2.5 inline-block">
                      <Chip className="border-terra-2/40 text-terra-2">
                        {storedCouponCode}
                      </Chip>
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  <Label htmlFor="address">Deliver to</Label>
                  {addresses?.length ? (
                    <Select
                      id="address"
                      label="Delivery address"
                      className="w-full"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    >
                      {addresses.map((address: any) => (
                        <option key={address.id} value={address.id}>
                          {address?.label} — {address?.city}, {address?.country}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <div className="border border-terra-2/40 bg-terra-soft px-3 py-2.5 text-sm text-ink-500">
                      You need an address before you can order.{" "}
                      <Link href="/profile" className="link-underline text-terra-2">
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
                  mono
                  arrow="→"
                  onClick={createPaymentSession}
                  disabled={loading || !addresses?.length}
                  className="mt-6 w-full !justify-between"
                >
                  {loading ? <Loader size={16} color="text-paper" /> : null}
                  {loading ? "Redirecting…" : "Continue to payment"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Container>
    </div>
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
    /* A dotted leader between the label and the figure — the ledger device from
       the auth slip, which is what a receipt line actually looks like in print. */
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-ink-200"
      />
      <dd className="shrink-0">
        <span className={`figure ${tone === "pos" ? "text-pos" : "text-ink"}`}>
          {value}
        </span>
      </dd>
    </div>
  );
}
