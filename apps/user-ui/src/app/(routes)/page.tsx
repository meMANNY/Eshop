"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { PackageSearch, Store } from "lucide-react";
import Hero from "@/shared/modules/hero";
import axiosInstance from "@/utils/axiosInstance";
import ProductCard from "@/shared/components/cards/product-card";
import ShopCard from "@/shared/components/cards/shop.card";
import {
  ButtonLink,
  CardSkeleton,
  Chip,
  Container,
  EmptyState,
  Frame,
  InkSection,
  Kicker,
  Reveal,
  SectionHeader,
  Serif,
  SysStrip,
} from "@/shared/components/ui";

const GRID =
  "grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:gap-8 2xl:grid-cols-5";

export default function Page() {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/recommendation/api/get-recommendation-products"
      );
      return res.data.recommendations;
    },
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: latestProducts,
    isLoading: isLoadingLatestProducts,
    isError: isErrorLatestProducts,
  } = useQuery({
    queryKey: ["latest-products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/product/api/get-all-products?page=1&limit=10&type=latest"
      );
      return res.data.products;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: shops, isLoading: shopLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/top-shops");
      return res.data.shops;
    },
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: offers,
    isLoading: offersLoading,
    isError: offerError,
  } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/product/api/get-all-events?page=1&limit=10"
      );
      return res.data.events;
    },
    staleTime: 1000 * 60 * 2,
  });

  /*
    The hero shows real stock rather than a placeholder square, so it borrows from
    whichever list arrived first — latest products if we have them, otherwise the
    recommendations.
  */
  const heroProducts = (latestProducts?.length ? latestProducts : products) ?? [];

  return (
    <>
      <Hero products={heroProducts} hasOffers={Boolean(offers?.length)} />

      {/*
        These four sections were four copies of the same grid, the same
        `h-[250px] bg-gray-300` loading block and four differently-worded "none
        yet" lines. One component, one skeleton, one empty state.
      */}
      <Shelf
        index={1}
        kicker="picked · for you"
        title="Things we think you will like"
        subtitle="Based on what you have been looking at."
        isLoading={isLoading}
        isError={isError}
        items={products}
        empty={{
          icon: <PackageSearch size={28} />,
          title: "Nothing to suggest yet",
          hint: "Browse a few products and recommendations will show up here.",
          href: "/products",
          cta: "Browse products",
        }}
        render={(product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            isEvent={product.starting_date}
          />
        )}
      />

      <Shelf
        index={2}
        kicker="new · arrivals"
        title={
          <>
            Fresh from the <Serif>workshop</Serif>.
          </>
        }
        subtitle="The most recent listings across every shop."
        isLoading={isLoadingLatestProducts}
        isError={isErrorLatestProducts}
        items={latestProducts}
        empty={{
          icon: <PackageSearch size={28} />,
          title: "No products yet",
          hint: "New listings from sellers will appear here first.",
          href: "/products",
          cta: "Browse products",
        }}
        render={(product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            isEvent={product.starting_date}
          />
        )}
      />

      {/* The ink band. It uses `shops[0]`, already fetched for the shelf below,
          so the page's most striking section costs no extra request. */}
      <Spotlight shop={shops?.[0]} />

      <Shelf
        index={3}
        kicker="shops · to know"
        title="The sellers everyone is buying from"
        subtitle="Sellers with the most orders this month."
        isLoading={shopLoading}
        items={shops}
        empty={{
          icon: <Store size={28} />,
          title: "No shops ranked yet",
          hint: "Once shops start taking orders, the busiest ones show up here.",
          href: "/shops",
          cta: "See all shops",
        }}
        render={(shop: any) => <ShopCard key={shop.id} shop={shop} />}
      />

      <Shelf
        index={4}
        kicker="offers · while they last"
        title={
          <>
            On offer, <Serif>briefly</Serif>.
          </>
        }
        subtitle="Limited-time promotions, while they last."
        isLoading={offersLoading}
        isError={offerError}
        items={offers}
        action={
          <ButtonLink href="/offers" variant="ghost" mono arrow="→">
            See all offers
          </ButtonLink>
        }
        empty={{
          icon: <PackageSearch size={28} />,
          title: "No offers running",
          hint: "When sellers put products on a timed promotion, they land here.",
          href: "/products",
          cta: "Browse products",
        }}
        render={(offer: any) => (
          <ProductCard key={offer.id} product={offer} isEvent />
        )}
      />
    </>
  );
}

function Shelf({
  title,
  subtitle,
  kicker,
  index,
  items,
  isLoading,
  isError,
  render,
  empty,
  action,
}: {
  title: React.ReactNode;
  subtitle?: string;
  kicker?: string;
  index?: number;
  items?: any[];
  isLoading?: boolean;
  isError?: boolean;
  render: (item: any) => React.ReactNode;
  empty: {
    icon: React.ReactNode;
    title: string;
    hint: string;
    href: string;
    cta: string;
  };
  action?: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink-line py-16 lg:py-24">
      <Container>
        <SectionHeader
          index={index}
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          action={action}
        />

        {isLoading ? (
          <div className={GRID}>
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="border border-line bg-paper">
            <EmptyState
              title="Couldn't load this list"
              hint="The request didn't come back. Reload the page to try again."
            />
          </div>
        ) : items?.length ? (
          <div className={GRID}>
            {items.map((item, i) => (
              // The delay wraps every five cards so a long row staggers across
              // rather than trailing off into a two-second wait at the end.
              <Reveal key={item.id ?? i} delay={i % 5}>
                {render(item)}
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-paper">
            <EmptyState
              icon={empty.icon}
              title={empty.title}
              hint={empty.hint}
              action={
                <ButtonLink href={empty.href} variant="primary" arrow="→">
                  {empty.cta}
                </ButtonLink>
              }
            />
          </div>
        )}
      </Container>
    </section>
  );
}

/**
 * The featured-shop band. A full-bleed ink section partway down a cream page is
 * the theme's strongest structural device — it breaks a long scroll of product
 * grids into a before and an after, and it is the only place on this page where
 * a single shop gets room to be more than a card.
 */
function Spotlight({ shop }: { shop?: any }) {
  if (!shop) return null;

  return (
    <InkSection>
      <Container className="py-16 lg:py-24">
        <SysStrip
          className="mb-12"
          items={[
            { key: "~/spotlight", value: "top shop this month" },
            { value: "fig.02", trailing: true },
          ]}
        />

        <div className="relative grid gap-12 lg:grid-cols-12 lg:gap-10">
          <span className="ghost-index" aria-hidden="true">
            02
          </span>

          <div className="relative z-10 lg:col-span-7">
            <Kicker>featured shop · verified</Kicker>

            <h2 className="mt-5 font-display text-4xl font-medium leading-[0.98] tracking-tight text-on-ink md:text-5xl lg:text-6xl">
              {shop.name}
              <span className="text-terra-2">.</span>
            </h2>

            {shop.category ? (
              <p className="mt-4 font-serif text-2xl italic text-terra lg:text-3xl">
                {shop.category}
              </p>
            ) : null}

            {shop.bio ? (
              <p className="mt-6 max-w-xl text-base leading-[1.55] text-on-ink-muted">
                {shop.bio}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-2">
              {shop.category ? <Chip>{shop.category}</Chip> : null}
              {shop.address ? <Chip>{shop.address}</Chip> : null}
              <Chip>{shop?.followers?.length ?? 0} followers</Chip>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={`/shop/${shop.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-terra bg-terra px-6 py-3 text-sm font-medium tracking-tight text-ink transition-all duration-200 hover:-translate-y-px"
              >
                Visit shop
                <span
                  className="font-mono text-xs transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </a>
              <a
                href="/shops"
                className="inline-flex items-center gap-2 rounded-full border border-ink-border px-6 py-3 text-sm font-medium tracking-tight text-on-ink transition-colors duration-200 hover:border-paper hover:bg-ink-soft"
              >
                All shops
              </a>
            </div>
          </div>

          {shop.coverBanner ? (
            <div className="relative z-10 lg:col-span-5">
              <Frame
                tone="ink"
                frameClassName="aspect-[4/3]"
                caption={{ left: `fig.02 / ${shop.name}`, right: "verified" }}
              >
                <Image
                  src={shop.coverBanner}
                  alt={shop.name ?? "Shop banner"}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 460px"
                  className="object-cover"
                />
              </Frame>
            </div>
          ) : null}
        </div>
      </Container>
    </InkSection>
  );
}
