"use client";

import axiosInstance from "@/utils/axiosInstance";
import { ArrowLeft, PackageX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  EmptyState,
  Figure,
  PageShell,
  PageTitle,
  Panel,
  PanelHead,
  StatusPill,
  money,
  paymentTone,
  shortDate,
  shortId,
} from "@/shared/components/ui";

const STAGES = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];

export default function Page() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        `/order/api/get-order-details/${orderId}`
      );
      setOrder(res.data.order);
    } catch (err) {
      console.error("failed to fetch order details", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  /*
    This route sits outside /dashboard, so it inherits neither the rail nor its
    canvas — it has to carry its own. That is why the page used to render as dark
    text on the browser's default white.
  */
  return (
    <div className="min-h-screen bg-ink">
      <PageShell>
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-coral"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to orders
        </button>

        {loading ? (
          <OrderSkeleton />
        ) : !order ? (
          <Panel>
            <EmptyState
              icon={<PackageX size={28} />}
              title="Order not found"
              hint="It may have been removed, or the id in the address is wrong."
            />
          </Panel>
        ) : (
          <>
            <PageTitle
              title={`Order ${shortId(order.id)}`}
              meta={
                <>
                  Placed{" "}
                  <Figure>{shortDate(order.createdAt)}</Figure> ·{" "}
                  <Figure className="text-white">{money(order.total)}</Figure>
                </>
              }
              actions={
                <StatusPill tone={paymentTone(order.status)}>
                  {order.status ?? "Unknown"}
                </StatusPill>
              }
            />

            <Panel className="mb-5">
              <PanelHead
                title="Delivery"
                note={order.deliveryStatus ?? "Not started"}
              />
              <div className="px-5 py-6">
                <ProgressTracker current={order.deliveryStatus} />
              </div>
            </Panel>

            <div className="mb-5 grid gap-5 lg:grid-cols-2">
              <Panel>
                <PanelHead title="Summary" />
                <dl className="divide-y divide-rule">
                  <Row label="Payment">
                    <StatusPill tone={paymentTone(order.status)}>
                      {order.status ?? "Unknown"}
                    </StatusPill>
                  </Row>
                  <Row label="Total paid">
                    <Figure className="font-medium text-white">
                      {money(order.total)}
                    </Figure>
                  </Row>
                  {order.discountAmount > 0 ? (
                    <Row label="Discount">
                      <Figure className="text-pos">
                        −{money(order.discountAmount)}
                      </Figure>
                    </Row>
                  ) : null}
                  {order.couponCode ? (
                    <Row label="Coupon">{order.couponCode.public_name}</Row>
                  ) : null}
                  <Row label="Placed">
                    <Figure className="text-[var(--muted)]">
                      {shortDate(order.createdAt)}
                    </Figure>
                  </Row>
                </dl>
              </Panel>

              <Panel>
                <PanelHead title="Shipping address" />
                {order.shippingAddress ? (
                  <div className="space-y-1 p-5 text-sm text-[var(--muted)]">
                    <p className="font-medium text-[var(--text)]">
                      {order.shippingAddress.name}
                    </p>
                    <p>
                      {order.shippingAddress.street}, {order.shippingAddress.city}{" "}
                      {order.shippingAddress.zip}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="p-5 text-sm text-[var(--faint)]">
                    No address recorded for this order.
                  </p>
                )}
              </Panel>
            </div>

            <Panel>
              <PanelHead
                title="Items"
                note={
                  <>
                    <Figure>{order.items?.length ?? 0}</Figure> line
                    {order.items?.length === 1 ? "" : "s"}
                  </>
                }
              />
              <ul className="divide-y divide-rule">
                {(order.items ?? []).map((item: any) => (
                  <li
                    key={item.productId}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <img
                      /*
                        The optional chain was on the wrong link: `images[0]?.url`
                        still throws when `images` itself is undefined.
                      */
                      src={
                        item.product?.images?.[0]?.url ||
                        "/placeholder.png"
                      }
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md border border-rule object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--text)]">
                        {item.product?.title ?? "Unnamed product"}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">
                        Quantity <Figure>{item.quantity}</Figure>
                      </p>
                      {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {Object.entries(item.selectedOptions).map(
                            ([key, value]: [string, any]) =>
                              value ? (
                                <span
                                  key={key}
                                  className="rounded-full bg-raised px-2.5 py-0.5 text-xs text-[var(--muted)]"
                                >
                                  <span className="capitalize">{key}</span>:{" "}
                                  {value}
                                </span>
                              ) : null
                          )}
                        </div>
                      ) : null}
                    </div>
                    <Figure className="shrink-0 font-medium text-white">
                      {money(item.price)}
                    </Figure>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </PageShell>
    </div>
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

function ProgressTracker({ current }: { current?: string }) {
  const index = STAGES.indexOf(current ?? "");
  /*
    An unrecognised status makes `indexOf` return -1, which turned the width into
    a negative percentage — and into NaN once it was divided. Clamping to 0 keeps
    an unknown status showing as "not started" instead of breaking the bar.
  */
  const reached = Math.max(index, 0);
  const percent = (reached / (STAGES.length - 1)) * 100;

  return (
    <div>
      <div className="relative mb-4 h-1 rounded-full bg-raised">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-coral transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between">
          {STAGES.map((stage, i) => (
            <span
              key={stage}
              className={`h-3 w-3 rounded-full ring-4 ring-panel transition-colors ${
                i <= reached ? "bg-coral" : "bg-rule"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <ol className="flex justify-between gap-2">
        {STAGES.map((stage, i) => (
          <li
            key={stage}
            aria-current={i === reached ? "step" : undefined}
            className={`flex-1 text-center text-xs ${
              i <= reached
                ? "font-medium text-[var(--text)]"
                : "text-[var(--faint)]"
            }`}
          >
            {stage}
          </li>
        ))}
      </ol>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading order">
      <Bar className="h-8 w-56" />
      <Bar className="h-28 w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Bar className="h-48 w-full" />
        <Bar className="h-48 w-full" />
      </div>
      <Bar className="h-40 w-full" />
    </div>
  );
}
