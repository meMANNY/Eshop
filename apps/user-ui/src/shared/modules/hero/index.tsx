"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ButtonLink,
  Container,
  Frame,
  Kicker,
  Serif,
  SysStrip,
} from "@/shared/components/ui";

type HeroProduct = {
  id: string;
  title?: string;
  slug?: string;
  sale_price?: number;
  regular_price?: number;
  images?: { url: string }[];
};

const SHORTCUTS = [
  { label: "products", href: "/products" },
  { label: "shops", href: "/shops" },
  { label: "offers", href: "/offers" },
];

/**
 * The hero used to sit beside an empty square with a shopping-bag glyph in it —
 * a placeholder where a storefront's most valuable space should be. It shows real
 * stock now: the caller passes the products it has already fetched for the grid
 * below, and three of them fill the figure.
 *
 * The dark panel is gone. In the editorial theme the opening beat is the type
 * itself on bare paper — a split header, one serif accent word, and a framed
 * figure carrying registration marks — rather than a contrasting slab. The ink
 * surface still exists in this page, but it belongs to the spotlight band and the
 * footer, where it means "a different kind of section" instead of "the top".
 */
const Hero = ({
  products = [],
  hasOffers = false,
}: {
  products?: HeroProduct[];
  hasOffers?: boolean;
}) => {
  const showcase = products.filter((p) => p.images?.[0]?.url).slice(0, 3);
  const [lead, ...rest] = showcase;

  const today = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="relative w-full overflow-hidden">
      <Container className="py-10 lg:py-14">
        <SysStrip
          className="mb-12"
          items={[
            { key: "~/eshop", value: "marketplace" },
            { value: hasOffers ? "status: offers live" : "status: open" },
            { value: today, trailing: true },
          ]}
        />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="hero-reveal" style={{ "--reveal-d": 0 } as React.CSSProperties}>
              <Kicker>Independent sellers · curated stock</Kicker>
            </div>

            <h1
              className="hero-reveal mt-6 font-display text-[clamp(2.6rem,5.4vw,5.2rem)] font-medium leading-[0.94] tracking-[-0.035em] text-ink"
              style={{ "--reveal-d": 1 } as React.CSSProperties}
            >
              Shop the things you
              <br />
              love, from the <Serif>people</Serif>
              <br />
              who <span className="hero-highlight">make them.</span>
            </h1>

            {/* The mono "why" row: three claims, no punctuation, no sentence —
                it reads as a specification rather than as marketing copy. */}
            <p
              className="hero-reveal mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400"
              style={{ "--reveal-d": 2 } as React.CSSProperties}
            >
              why — independent <span className="text-terra-2">+</span> hand-picked{" "}
              <span className="text-terra-2">+</span> direct
            </p>

            <p
              className="hero-reveal mt-5 max-w-xl text-base leading-[1.55] text-ink-500 lg:text-lg"
              style={{ "--reveal-d": 3 } as React.CSSProperties}
            >
              Thousands of products from independent sellers — each shop run by
              someone who picked every item on its shelves.
            </p>

            <div
              className="hero-reveal mt-9 flex flex-wrap items-center gap-3"
              style={{ "--reveal-d": 4 } as React.CSSProperties}
            >
              <ButtonLink href="/products" variant="primary" arrow="→">
                Start shopping
              </ButtonLink>
              <ButtonLink href="/shops" variant="ghost" arrow="↘">
                Browse shops
              </ButtonLink>
              {hasOffers ? (
                <Link
                  href="/offers"
                  className="inline-flex items-center gap-2 border border-terra-2/40 bg-terra-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-terra-2 transition-colors hover:border-terra-2"
                >
                  {/* The ping is the one piece of ambient motion on the page, and
                      it is load-bearing: it says the offers are running *now*. */}
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping bg-terra opacity-75" />
                    <span className="relative inline-flex h-2 w-2 bg-terra" />
                  </span>
                  offers running
                </Link>
              ) : null}
            </div>

            <p
              className="hero-reveal mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400"
              style={{ "--reveal-d": 5 } as React.CSSProperties}
            >
              {SHORTCUTS.map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="link-underline transition-colors hover:text-ink"
                >
                  {shortcut.label} ↗
                </Link>
              ))}
            </p>
          </div>

          {/* Real stock, framed. Falls away entirely rather than showing an empty
              frame when there is nothing to show yet. */}
          {lead ? (
            <div
              className="hero-reveal relative lg:col-span-5 lg:pt-10"
              style={{ "--reveal-d": 3 } as React.CSSProperties}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-8 h-56 w-56 rounded-full bg-glow-terra opacity-25 blur-[80px]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-glow-yellow opacity-25 blur-[80px]"
              />

              <Frame
                className="relative"
                frameClassName="aspect-[3/4]"
                caption={{ left: "fig.01 / new arrivals", right: "live" }}
              >
                <div className="flex h-full flex-col">
                  <Link
                    href={`/product/${lead.slug}`}
                    className="group relative block flex-1 overflow-hidden"
                  >
                    <Image
                      src={lead.images![0].url}
                      alt={lead.title ?? ""}
                      fill
                      unoptimized
                      priority
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </Link>

                  {rest.length ? (
                    <div className="grid shrink-0 grid-cols-2 border-t border-ink-line">
                      {rest.map((product, i) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          className={`group relative aspect-square overflow-hidden ${
                            i > 0 ? "border-l border-ink-line" : ""
                          }`}
                        >
                          <Image
                            src={product.images![0].url}
                            alt={product.title ?? ""}
                            fill
                            unoptimized
                            sizes="210px"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Frame>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
};

export default Hero;
