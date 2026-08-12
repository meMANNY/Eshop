"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Container, Price } from "@/shared/components/ui";

type HeroProduct = {
  id: string;
  title?: string;
  slug?: string;
  sale_price?: number;
  regular_price?: number;
  images?: { url: string }[];
};

/**
 * The hero used to sit beside an empty square with a shopping-bag glyph in it —
 * a placeholder where a storefront's most valuable space should be. It shows real
 * stock now: the caller passes the products it has already fetched for the grid
 * below, and three of them fan out here.
 *
 * The dark panel stays. It gives the storefront one confident opening beat
 * against the light canvas the rest of the page uses, and it's the same near-black
 * the seller and admin consoles are built on.
 */
const Hero = ({
  products = [],
  hasOffers = false,
}: {
  products?: HeroProduct[];
  hasOffers?: boolean;
}) => {
  const showcase = products.filter((p) => p.images?.[0]?.url).slice(0, 3);

  return (
    <section className="relative w-full overflow-hidden bg-[#0f131a]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-coral/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-coral/10 blur-3xl"
      />

      <Container className="relative flex flex-col items-center gap-12 py-16 md:flex-row md:py-24">
        <div className="flex-1 text-center md:text-left">
          {/* Only claims a sale when there is actually an offer running. */}
          {hasOffers ? (
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-sm font-medium text-[#ff8a7d] transition-colors hover:border-coral/60"
            >
              <ShoppingBag size={15} aria-hidden="true" /> Offers running now
            </Link>
          ) : null}

          <h1 className="mt-6 font-jost text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-white md:text-6xl">
            Shop the things you
            <br />
            love, from people
            <br />
            who <span className="text-coral">make them</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-slate-400 md:mx-0">
            Thousands of products from independent sellers — each shop run by
            someone who picked every item on its shelves.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-coral px-6 py-3 font-medium text-[#2b0f0a] transition-colors hover:bg-coral-dim"
            >
              Start shopping <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/shops"
              className="rounded-lg border border-slate-700 bg-white/[0.04] px-6 py-3 font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Browse shops
            </Link>
          </div>
        </div>

        {/* Real stock, fanned. Falls away entirely rather than showing an empty
            frame when there is nothing to show yet. */}
        {showcase.length > 0 ? (
          <div className="flex-1">
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
              {showcase.map((product, i) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className={`group relative block overflow-hidden rounded-2xl border border-slate-800 bg-[#141922] transition-transform duration-300 hover:-translate-y-1 ${
                    i === 0 ? "col-span-2" : ""
                  }`}
                >
                  <div
                    className={`relative w-full ${i === 0 ? "aspect-[16/10]" : "aspect-square"}`}
                  >
                    <Image
                      src={product.images![0].url}
                      alt={product.title ?? ""}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 240px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                    <span className="truncate text-sm text-slate-300">
                      {product.title}
                    </span>
                    <span className="shrink-0 [&_.figure]:text-white">
                      <Price
                        value={product.sale_price}
                        compareAt={product.regular_price}
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
};

export default Hero;
