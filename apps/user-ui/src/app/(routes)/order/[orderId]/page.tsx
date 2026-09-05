"use client";

import axiosInstance from "@/utils/axiosInstance";
import { PackageX } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ButtonLink,
  Card,
  CardHead,
  Chip,
  Container,
  Crumbs,
  EmptyState,
  Figure,
  PageHeading,
  StatusPill,
  SysStrip,
  money,
  paymentTone,
  shortDate,
  shortId,
} from "@/shared/components/ui";

const STATUSES = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export default function Page() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/order/api/get-order-details/${orderId}`
        );
        setOrder(res.data.order);
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <Container className="py-20">
        <div className="h-8 w-48 animate-pulse bg-surface" />
        <div className="mt-8 h-40 w-full animate-pulse bg-surface" />
      </Container>
    );

  if (!order)
    return (
      <Container className="py-20">
        <Card>
          <EmptyState
            icon={<PackageX size={28} />}
            title="We couldn't find that order"
            hint="It may have been removed, or the link is no longer valid."
            action={
              <ButtonLink
                href="/profile?active=My+Orders"
                variant="primary"
                arrow="→"
              >
                Back to my orders
              </ButtonLink>
            }
          />
        </Card>
      </Container>
    );

  const activeIndex = STATUSES.indexOf(order.deliveryStatus);

  return (
    <div className="pb-16">
      <Container className="pt-8">
        <Crumbs
          trail={[
            { label: "My orders", href: "/profile?active=My+Orders" },
            { label: shortId(order.id) },
          ]}
        />

        <div className="mt-6">
          <PageHeading
            kicker={`/order · ${order.deliveryStatus?.toLowerCase() ?? "ordered"}`}
            title={`Order ${shortId(order.id)}`}
            actions={
              <ButtonLink
                href="/profile?active=My+Orders"
                variant="ghost"
                mono
                arrow="←"
              >
                all orders
              </ButtonLink>
            }
          />
        </div>

        <SysStrip
          className="mb-12"
          items={[
            { key: "~/order", value: shortId(order.id) },
            { value: shortDate(order.createdAt), hideOnMobile: true },
            { value: `total ${money(Number(order.total))}`, trailing: true },
          ]}
        />

        {/*
          The progress rail was a rounded coral bar with glowing circular dots.
          Here it is a hard rule with square markers that fill as each stage is
          reached — the same vocabulary the rest of the theme uses for "this one,
          not those".
        */}
        <Card>
          <CardHead title="Delivery progress" note={`~/tracking · ${order.deliveryStatus}`} />
          <div className="p-6">
            <ol className="relative flex justify-between gap-2">
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 top-[7px] h-px bg-line"
              />
              <span
                aria-hidden="true"
                className="absolute left-0 top-[7px] h-px bg-terra-2 transition-all duration-500 motion-reduce:transition-none"
                style={{
                  width:
                    activeIndex > 0
                      ? `${(activeIndex / (STATUSES.length - 1)) * 100}%`
                      : "0%",
                }}
              />
              {STATUSES.map((status, i) => {
                const reached = i <= activeIndex;
                return (
                  <li
                    key={status}
                    className="relative z-10 flex flex-1 flex-col items-center gap-3 first:items-start last:items-end"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-[15px] w-[15px] border transition-colors duration-500 motion-reduce:transition-none ${
                        reached
                          ? "border-terra-2 bg-terra-2"
                          : "border-ink-line bg-paper"
                      }`}
                    />
                    <span
                      className={`text-center font-mono text-[9px] uppercase leading-tight tracking-[0.12em] sm:text-[10px] ${
                        reached ? "text-ink" : "text-ink-300"
                      }`}
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Order summary" note="~/summary" />
            <dl className="p-6">
              <SummaryRow label="Payment status">
                <StatusPill tone={paymentTone(order.status)}>
                  {order.status}
                </StatusPill>
              </SummaryRow>

              <SummaryRow label="Total paid">
                <Figure className="text-base font-semibold text-ink">
                  {money(Number(order.total))}
                </Figure>
              </SummaryRow>

              {order.discountAmount > 0 ? (
                <SummaryRow label="Discount applied">
                  <Figure className="text-pos">
                    −{money(Number(order.discountAmount))}
                    {order.couponCode?.discountType === "percentage"
                      ? ` (${order.couponCode.discountValue}%)`
                      : order.couponCode
                      ? ` ($${order.couponCode.discountValue} off)`
                      : ""}
                  </Figure>
                </SummaryRow>
              ) : null}

              {order.couponCode ? (
                <SummaryRow label="Coupon">
                  <Chip className="border-terra-2/40 text-terra-2">
                    {order.couponCode.public_name}
                  </Chip>
                </SummaryRow>
              ) : null}

              <SummaryRow label="Date">
                <span className="text-sm text-ink">
                  {shortDate(order.createdAt)}
                </span>
              </SummaryRow>
            </dl>
          </Card>

          {order.shippingAddress ? (
            <Card>
              <CardHead title="Shipping address" note="~/deliver-to" />
              <address className="space-y-1 p-6 text-sm not-italic leading-[1.6] text-ink-500">
                <p className="font-display text-base font-medium tracking-tight text-ink">
                  {order.shippingAddress.name}
                </p>
                <p>
                  {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                  {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
              </address>
            </Card>
          ) : null}
        </div>

        <Card className="mt-6">
          <CardHead
            title="Order items"
            note={`~/items · ${order.items?.length ?? 0}`}
          />
          <ul className="p-6 pt-0">
            {order.items?.map((item: any) => (
              <li
                key={item.id ?? item.productId}
                className="flex items-start gap-5 border-b border-line py-5 last:border-0"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-surface">
                  {/* Was a hotlinked Unsplash photo standing in for a missing
                      product image — an unrelated stock picture in an order
                      receipt, plus a third-party request per line. */}
                  {item.product?.images?.[0]?.url ? (
                    <Image
                      src={item.product.images[0].url}
                      alt=""
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-mono text-[9px] uppercase tracking-[0.14em] text-ink-300">
                      no image
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-medium tracking-tight text-ink">
                    {item?.product?.title || "Unnamed product"}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                    qty <Figure>{item?.quantity}</Figure>
                  </p>
                  {item?.selectedOptions &&
                  Object.keys(item.selectedOptions).length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {Object.entries(item.selectedOptions).map(
                        ([key, value]: [string, any]) =>
                          value ? (
                            <Chip key={key}>
                              {key}: {value}
                            </Chip>
                          ) : null
                      )}
                    </div>
                  ) : null}
                </div>

                <Figure className="shrink-0 text-sm font-semibold text-ink">
                  {money(Number(item?.price ?? 0))}
                </Figure>
              </li>
            ))}
          </ul>
        </Card>
      </Container>
    </div>
  );
}

const SummaryRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
    <dt className="text-sm text-ink-500">{label}</dt>
    <dd className="text-sm">{children}</dd>
  </div>
);
