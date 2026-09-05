"use client";

import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  Card,
  Container,
  Crumbs,
  EmptyState,
  Figure,
  PageHeading,
  SysStrip,
  money,
} from "@/shared/components/ui";

export default function Wishlist() {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      wishlist: state.wishlist.map((item) =>
        item.id === id && (item.quantity ?? 1) > 1
          ? { ...item, quantity: (item.quantity ?? 1) - 1 }
          : item
      ),
    }));
  };
  const increaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      wishlist: state.wishlist.map((item) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromWishlist(id, user, location, deviceInfo);
  };

  return (
    <div className="pb-16">
      {/* This page laid itself out with a bare `md:w-[80%] w-[95%]` wrapper, so
          its gutter did not agree with any other page in the app. */}
      <Container className="pt-8">
        <Crumbs trail={[{ label: "Wishlist" }]} />

        <div className="mt-6">
          <PageHeading kicker="/wishlist · saved for later" title="Wishlist" />
        </div>

        {wishlist.length ? (
          <SysStrip
            className="mb-10"
            items={[
              {
                key: "~/wishlist",
                value: `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"}`,
              },
              { value: "saved", trailing: true },
            ]}
          />
        ) : null}

        {wishlist.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Heart size={28} />}
              title="Your wishlist is empty"
              hint="Save the products you love and they'll show up here."
              action={
                <ButtonLink href="/products" variant="primary" arrow="→">
                  Browse products
                </ButtonLink>
              }
            />
          </Card>
        ) : (
          /*
            Was a five-column <table>. A wishlist row is one product with two
            controls, not a record with five fields — as a table it could not wrap
            on a phone and scrolled sideways instead. It is a ruled list now, the
            same ledger shape the cart uses.
          */
          <ul className="border-t border-ink-line">
            {wishlist?.map((item: any) => (
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
                    {item.title}
                  </Link>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-stretch border border-line">
                      <button
                        aria-label={`Decrease quantity of ${item.title}`}
                        onClick={() => decreaseQuantity(item?.id)}
                        disabled={(item.quantity ?? 1) <= 1}
                        className="grid h-9 w-9 place-items-center border-r border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
                      >
                        <span aria-hidden="true">−</span>
                      </button>
                      <Figure className="grid w-11 place-items-center text-sm text-ink">
                        {item?.quantity ?? 1}
                      </Figure>
                      <button
                        aria-label={`Increase quantity of ${item.title}`}
                        onClick={() => increaseQuantity(item?.id)}
                        className="grid h-9 w-9 place-items-center border-l border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink"
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      mono
                      arrow="→"
                      onClick={() => addToCart(item, user, location, deviceInfo)}
                    >
                      Add to cart
                    </Button>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Figure className="text-base font-semibold text-ink">
                    {money(item.sale_price * (item.quantity ?? 1))}
                  </Figure>
                  {(item.quantity ?? 1) > 1 ? (
                    <span className="figure text-xs text-ink-300">
                      {money(item.sale_price)} each
                    </span>
                  ) : null}
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.title} from wishlist`}
                    className="link-underline mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-neg"
                  >
                    remove ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
