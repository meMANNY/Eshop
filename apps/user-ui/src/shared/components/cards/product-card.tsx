"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import ProductDetailsCard from "./product-details.card";
import { useStore } from "@/store";
import useUser from "@/hooks/useUser";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import { Price, Rating, StatusPill } from "../ui";

/** Renders instantly, never hotlink-blocked, no network needed. */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f1f3f5"/><path d="M104 176l28-34 22 26 18-20 24 28z" fill="#d7dce2"/><circle cx="118" cy="120" r="14" fill="#d7dce2"/></svg>`
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

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-card border border-rule bg-surface shadow-card transition-shadow duration-300 hover:shadow-lift">
      <div className="relative">
        <Link
          href={`/product/${product?.slug}`}
          className="block aspect-square overflow-hidden bg-sunken"
        >
          <img
            src={image}
            alt={product?.title ?? "Product"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        {/*
          The offer badge and the shop-name link were both `top-2 left-2`, so on
          an event product they were drawn one on top of the other. Offer sits
          top-left, stock warning top-right, shop name along the bottom.
        */}
        {isEvent ? (
          <span className="absolute left-2 top-2">
            <StatusPill tone="coral">Offer</StatusPill>
          </span>
        ) : null}

        {lowStock ? (
          <span className="absolute right-2 top-2">
            <StatusPill tone="warn">Low stock</StatusPill>
          </span>
        ) : null}

        {product?.Shop?.name ? (
          <Link
            href={`/shop/${product?.Shop?.slug}`}
            className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-surface/95 px-2.5 py-1 text-xs font-medium text-ink-muted shadow-card backdrop-blur transition-colors hover:text-coral-ink"
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
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <IconButton
            label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            onClick={toggleWishlist}
            active={isWishlisted}
          >
            <Heart size={17} className={isWishlisted ? "fill-current" : ""} />
          </IconButton>

          <IconButton label="Quick view" onClick={() => setOpen(true)}>
            <Eye size={17} />
          </IconButton>

          <IconButton
            label={isInCart ? "Already in your cart" : "Add to cart"}
            disabled={isInCart}
            onClick={() =>
              !isInCart &&
              addToCart({ ...product, quantity: 1 }, user, location, deviceInfo)
            }
          >
            <ShoppingBag size={17} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <Link href={`/product/${product?.slug}`} className="group/title">
          <h3 className="clamp-2 text-sm font-medium leading-snug text-ink transition-colors group-hover/title:text-coral-ink">
            {product?.title}
          </h3>
        </Link>

        <Rating value={product?.ratings ?? 0} />

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Price value={product?.sale_price} compareAt={product?.regular_price} />
          {product?.regular_price > product?.sale_price ? (
            <StatusPill tone="pos">
              −
              {Math.round(
                (100 * (product.regular_price - product.sale_price)) /
                  product.regular_price
              )}
              %
            </StatusPill>
          ) : null}
        </div>

        {product?.totalSales > 0 ? (
          <p className="text-xs text-ink-faint">
            <span className="figure">{product.totalSales}</span> sold
          </p>
        ) : null}

        {isEvent && timeLeft ? (
          <p className="text-xs font-medium text-coral-ink">{timeLeft}</p>
        ) : null}
      </div>

      {open ? <ProductDetailsCard data={product} setOpen={setOpen} /> : null}
    </div>
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
      className={`grid h-9 w-9 place-items-center rounded-full bg-surface shadow-card ring-1 ring-rule transition-colors hover:ring-coral disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "text-coral-ink" : "text-ink-muted hover:text-coral-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default ProductCard;
