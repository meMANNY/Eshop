"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PackageSearch, Store } from "lucide-react";
import Hero from "../shared/modules/hero";
import axiosInstance from "../utils/axiosInstance";
import ProductCard from "../shared/components/cards/product-card";
import ShopCard from "../shared/components/cards/shop.card";
import {
  CardSkeleton,
  Container,
  EmptyState,
  SectionTitle,
} from "../shared/components/ui";

const GRID =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 2xl:grid-cols-5";

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
    <main>
      <Hero products={heroProducts} hasOffers={Boolean(offers?.length)} />

      <Container className="space-y-14 py-14">
        {/*
          These four sections were four copies of the same grid, the same
          `h-[250px] bg-gray-300` loading block and four differently-worded "none
          yet" lines. One component, one skeleton, one empty state.
        */}
        <Shelf
          title="Picked for you"
          subtitle="Based on what you've been looking at."
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
          title="New arrivals"
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

        <Shelf
          title="Shops to know"
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
          title="On offer"
          subtitle="Limited-time promotions, while they last."
          isLoading={offersLoading}
          isError={offerError}
          items={offers}
          action={
            <Link
              href="/offers"
              className="text-sm font-medium text-coral-ink transition-colors hover:text-coral-dim"
            >
              See all offers
            </Link>
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
      </Container>
    </main>
  );
}

function Shelf({
  title,
  subtitle,
  items,
  isLoading,
  isError,
  render,
  empty,
  action,
}: {
  title: string;
  subtitle?: string;
  items?: any[];
  isLoading?: boolean;
  isError?: boolean;
  render: (item: any) => React.ReactNode;
  empty: { icon: React.ReactNode; title: string; hint: string; href: string; cta: string };
  action?: React.ReactNode;
}) {
  return (
    <section>
      <SectionTitle title={title} subtitle={subtitle} action={action} />

      {isLoading ? (
        <div className={GRID}>
          {Array.from({ length: 10 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-card border border-rule bg-surface">
          <EmptyState
            title="Couldn't load this list"
            hint="The request didn't come back. Reload the page to try again."
          />
        </div>
      ) : items?.length ? (
        <div className={GRID}>{items.map(render)}</div>
      ) : (
        <div className="rounded-card border border-rule bg-surface">
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            hint={empty.hint}
            action={
              <Link
                href={empty.href}
                className="inline-flex items-center rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-[#2b0f0a] transition-colors hover:bg-coral-dim"
              >
                {empty.cta}
              </Link>
            }
          />
        </div>
      )}
    </section>
  );
}
