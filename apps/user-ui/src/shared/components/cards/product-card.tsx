"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import ProductDetailsCard from "./product-details.card";
import { useStore } from "@/store";
import useUser from "@/hooks/useUser";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import { Chip, Price, Rating, StatusPill } from "../ui";

/** Renders instantly, never hotlink-blocked, no network needed. */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#F2EDE0"/><path d="M104 176l28-34 22 26 18-20 24 28z" fill="#D8D2C2"/><circle cx="118" cy="120" r="14" fill="#D8D2C2"/></svg>`
  );

function formatRemaining(endingDate: string): string {
  const diff = new Date(endingDate).getTime() - Date.now();
  if (diff <= 0) return "Offer ended";

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

const ProductCard = ({ product, isEvent }: { product: any; isEvent?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const addToWishlist = useStore((state) => state.addToWishlist);
  const removeFromWishlist = useStore((state) => state.removeFromWishlist);
  const addToCart = useStore((state) => state.addToCart);
  const wishlist = useStore((state) => state.wishlist);
  const cart = useStore((state) => state.cart);

  const isWishlisted = wishlist.some((item: any) => item.id === product.id);
  const isInCart = cart.some((item: any) => item.id === product.id);

  useEffect(() => {
    if (!isEvent || !product?.ending_date) return;

    /*
      Two bugs lived here. The cleanup was `return clearInterval(interval)`, which
      calls it immediately and returns undefined instead of returning a cleanup
      function — so the interval was killed on the first render and the countdown
      never ticked. And the first tick only fired after a full minute, so even
      without that the label was blank for 60 seconds. It's set once up front and
      then on a timer.
    */
    const tick = () => setTimeLeft(formatRemaining(product.ending_date));
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [isEvent, product?.ending_date]);

  const toggleWishlist = useCallback(() => {
    if (isWishlisted) removeFromWishlist(product.id, user, location, deviceInfo);
    else addToWishlist({ ...product, quantity: 1 }, user, location, deviceInfo);
  }, [isWishlisted, product, user, location, deviceInfo, addToWishlist, removeFromWishlist]);

  // `images` itself can be undefined — the optional chain was on the wrong link.
  const image = product?.images?.[0]?.url || PLACEHOLDER;
  const lowStock = product?.stock <= 5;
  const discount =
    product?.regular_price > product?.sale_price
      ? Math.round(
          (100 * (product.regular_price - product.sale_price)) /
            product.regular_price
        )
      : 0;

  /*
    The plate tag, top-left. On an event it says `offer`; otherwise it names the
    category in the same lowercase mono voice the rest of the theme uses for
    metadata, so every card carries a filing label rather than only the ones that
    happen to be on promotion.
  */
  const plate = isEvent
    ? "offer"
    : String(product?.category ?? "").split(/[\s,/]+/)[0].toLowerCase();

  return (
    <article className="card-hover group relative flex h-full flex-col overflow-hidden border border-line bg-paper">
      <div className="relative border-b border-line">
        <Link
          href={`/product/${product?.slug}`}
          className="block aspect-square overflow-hidden bg-surface"
        >
          <img
            src={image}
            alt={product?.title ?? "Product"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </Link>

        {/*
          The offer badge and the shop-name link were both `top-2 left-2`, so on
          an event product they were drawn one on top of the other. The plate sits
          top-left, stock warning top-right, shop name along the bottom.
        */}
        {plate ? (
          <span className="absolute left-3 top-3 border border-line bg-paper/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500 backdrop-blur-sm">
            {plate}
          </span>
        ) : null}

        {lowStock ? (
          <span className="absolute right-3 top-3">
            <StatusPill tone="warn">Low stock</StatusPill>
          </span>
        ) : null}

        {/*
          `/shop/[id]` looks the shop up by ObjectID, and `shops` has no `slug`
          column — so `Shop.slug` was always undefined and every one of these
          links went to `/shop/undefined`, which reached Prisma as an ObjectID
          and threw P2023. The id must also be present before the link renders.
        */}
        {product?.Shop?.name && product?.Shop?.id ? (
          <Link
            href={`/shop/${product.Shop.id}`}
            className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate border border-line bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 backdrop-blur transition-colors hover:text-terra-2"
          >
            {product.Shop.name}
          </Link>
        ) : null}

        {/*
          These were bare <Heart>/<Eye>/<ShoppingBag> SVGs with onClick handlers —
          not focusable, not labelled, and not reachable by keyboard at all. They
          are buttons now, and they stay visible on touch screens, where the
          hover-only reveal made them unreachable entirely.
        */}
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <IconButton
            label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            onClick={toggleWishlist}
            active={isWishlisted}
          >
            <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
          </IconButton>

          <IconButton label="Quick view" onClick={() => setOpen(true)}>
            <Eye size={16} />
          </IconButton>

          <IconButton
            label={isInCart ? "Already in your cart" : "Add to cart"}
            disabled={isInCart}
            onClick={() =>
              !isInCart &&
              addToCart({ ...product, quantity: 1 }, user, location, deviceInfo)
            }
          >
            <ShoppingBag size={16} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/product/${product?.slug}`}>
          <h3 className="clamp-2 font-display text-base font-medium leading-snug tracking-tight text-ink transition-colors group-hover:text-terra lg:text-lg">
            {product?.title}
          </h3>
        </Link>

        <div className="mt-2.5">
          <Rating value={product?.ratings ?? 0} />
        </div>

        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-4">
          <Price value={product?.sale_price} compareAt={product?.regular_price} />
          {discount ? (
            <Chip className="border-terra-2/40 text-terra-2">−{discount}%</Chip>
          ) : null}
        </div>

        {product?.totalSales > 0 || (isEvent && timeLeft) ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
            {product?.totalSales > 0 ? (
              <span className="text-ink-400">
                <span className="figure">{product.totalSales}</span> sold
              </span>
            ) : null}
            {isEvent && timeLeft ? (
              <span className="text-terra-2">{timeLeft}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {open ? <ProductDetailsCard data={product} setOpen={setOpen} /> : null}
    </article>
  );
};

function IconButton({
  label,
  children,
  onClick,
  active,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`grid h-9 w-9 place-items-center border bg-paper transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-terra-2 text-terra-2"
          : "border-line text-ink-500 hover:border-ink-line hover:text-terra-2"
      }`}
    >
      {children}
    </button>
  );
}

export default ProductCard;
