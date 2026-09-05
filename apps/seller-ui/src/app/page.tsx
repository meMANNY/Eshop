"use client";

import useSeller from "@/hooks/useSeller";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Globe,
  LayoutDashboard,
  MapPin,
  Package,
  Pencil,
  Phone,
  Star,
  Store,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

// An "offer" is a product with a live promo window — the same definition the
// storefront uses to separate events from the regular catalogue.
const isOffer = (product: any) =>
  Boolean(product?.starting_date && product?.ending_date);

const TABS = ["Products", "Offers", "Reviews"] as const;
type Tab = (typeof TABS)[number];

export default function SellerHome() {
  const { seller, isLoading } = useSeller();
  const [tab, setTab] = useState<Tab>("Products");

  const shop = seller?.shop;

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-shop-products");
      return res.data.products ?? [];
    },
    enabled: Boolean(shop?.id),
  });

  const { data: reviewData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["shop-reviews"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/get-shop-reviews");
      return res.data;
    },
    enabled: Boolean(shop?.id),
  });

  const { catalogue, offers } = useMemo(() => {
    const live = products.filter((p: any) => !p.isDeleted);
    return {
      catalogue: live.filter((p: any) => !isOffer(p)),
      offers: live.filter(isOffer),
    };
  }, [products]);

  const reviews = reviewData?.reviews ?? [];

  if (isLoading) return <HomeSkeleton />;

  if (!shop) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
          <Store size={24} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-on-ink">
          You don&apos;t have a shop yet
        </h1>
        <p className="mt-1.5 max-w-sm text-sm text-on-ink-muted">
          Set up your shop to start listing products and taking orders.
        </p>
        <Link
          href="/signup"
          className="mt-6 bg-[#ff6f61] px-4 py-2 text-sm font-medium text-on-ink shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d]"
        >
          Create your shop
        </Link>
      </div>
    );
  }

  return (
    // `/` sits outside the dashboard layout, so it carries its own dark canvas.
    <div className="min-h-screen w-full bg-black pb-16">
      {/* COVER + IDENTITY */}
      <div className="relative">
        <div className="h-44 w-full overflow-hidden bg-gradient-to-r from-[#3a1f1c] via-[#5c2a24] to-[#1a1d24] sm:h-56">
          {shop.coverBanner && (
            <img
              src={shop.coverBanner}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar url={shop.avatar?.url} name={shop.name} />
              <div className="pb-1">
                <h1 className="text-2xl font-semibold text-on-ink sm:text-3xl">
                  {shop.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-ink-muted">
                  <span className="inline-flex items-center rounded-full border border-ink-border bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-on-ink-muted">
                    {shop.category}
                  </span>
                  <Rating value={shop.ratings} count={shop.totalRating} />
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-3 pb-1">
              <Link
                href="/edit-profile"
                className="inline-flex items-center gap-2 bg-[#ff6f61] px-4 py-2 text-sm font-medium text-on-ink shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
              >
                <Pencil size={16} />
                Edit profile
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 border border-ink-border bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-ink-border hover:text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-6">
        {/* AT-A-GLANCE */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat Icon={Package} label="Products" value={catalogue.length} />
          <Stat Icon={Tag} label="Live offers" value={offers.length} />
          <Stat
            Icon={Star}
            label="Rating"
            value={Number(shop.ratings ?? 0).toFixed(1)}
          />
          <Stat Icon={Users} label="Reviews" value={reviews.length} />
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          {/* PROFILE COLUMN */}
          <aside className="w-full shrink-0 space-y-6 lg:w-[320px]">
            <Card>
              <SectionTitle>About the shop</SectionTitle>
              <p className="text-sm leading-relaxed text-on-ink-muted">
                {shop.bio || "No description added yet."}
              </p>
            </Card>

            <Card>
              <SectionTitle>Shop details</SectionTitle>
              <dl className="space-y-3.5">
                <Detail Icon={Clock} label="Opening hours">
                  {shop.opening_hours && shop.closing_hours
                    ? `${shop.opening_hours} – ${shop.closing_hours}`
                    : "Not set"}
                </Detail>
                <Detail Icon={MapPin} label="Location">
                  {[shop.address, shop.country].filter(Boolean).join(", ") ||
                    "Not set"}
                </Detail>
                <Detail Icon={Phone} label="Phone">
                  {shop.phone_number || "Not set"}
                </Detail>
                <Detail Icon={Globe} label="Website">
                  {shop.website ? (
                    <a
                      href={shop.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[#ff8a7d] hover:underline"
                    >
                      {shop.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "Not set"
                  )}
                </Detail>
              </dl>
            </Card>

            <Card>
              <SectionTitle>Account</SectionTitle>
              <dl className="space-y-3.5">
                <Detail label="Name">{seller.name}</Detail>
                <Detail label="Email">{seller.email}</Detail>
                <Detail label="Phone">{seller.phone_number || "Not set"}</Detail>
                <Detail label="Country">{seller.country || "Not set"}</Detail>
                <Detail label="Selling since">
                  {new Date(seller.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </Detail>
                <Detail label="Payouts">
                  {seller.stripeId ? (
                    <span className="text-emerald-400">Connected</span>
                  ) : (
                    <span className="text-amber-400">Not connected</span>
                  )}
                </Detail>
              </dl>
            </Card>
          </aside>

          {/* TABBED CONTENT */}
          <section className="min-w-0 flex-1">
            <div
              role="tablist"
              aria-label="Shop content"
              className="flex gap-1 border-b border-slate-800"
            >
              {TABS.map((name) => {
                const count =
                  name === "Products"
                    ? catalogue.length
                    : name === "Offers"
                    ? offers.length
                    : reviews.length;
                const active = tab === name;
                return (
                  <button
                    key={name}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(name)}
                    className={`relative px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61] ${
                      active
                        ? "text-on-ink"
                        : "text-on-ink-muted hover:text-slate-200"
                    }`}
                  >
                    {name}
                    <span className="ml-1.5 text-xs text-on-ink-faint">
                      {count}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#ff6f61] transition-opacity ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {tab === "Reviews" ? (
                reviewsLoading ? (
                  <GridSkeleton rows={3} />
                ) : reviews.length === 0 ? (
                  <Empty
                    Icon={Star}
                    title="No reviews yet"
                    description="Reviews appear here once buyers rate your shop."
                  />
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review: any) => (
                      <ReviewRow key={review.id} review={review} />
                    ))}
                  </div>
                )
              ) : productsLoading ? (
                <GridSkeleton rows={4} />
              ) : (tab === "Products" ? catalogue : offers).length === 0 ? (
                <Empty
                  Icon={tab === "Products" ? Package : Tag}
                  title={
                    tab === "Products"
                      ? "No products listed"
                      : "No offers running"
                  }
                  description={
                    tab === "Products"
                      ? "Add your first product and it will show up here."
                      : "Give a product a start and end date to run it as an offer."
                  }
                  action={
                    <Link
                      href="/dashboard/create-product"
                      className="mt-5 bg-[#ff6f61] px-4 py-2 text-sm font-medium text-on-ink shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d]"
                    >
                      Create a product
                    </Link>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {(tab === "Products" ? catalogue : offers).map(
                    (product: any) => (
                      <ProductCard key={product.id} product={product} />
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const Avatar = ({ url, name }: { url?: string; name: string }) =>
  url ? (
    <img
      src={url}
      alt=""
      className="h-24 w-24 shrink-0 border-4 border-black object-cover sm:h-28 sm:w-28"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex h-24 w-24 shrink-0 items-center justify-center border-4 border-black bg-[#ff6f61] text-3xl font-bold text-on-ink sm:h-28 sm:w-28"
    >
      {name?.charAt(0).toUpperCase() ?? "S"}
    </span>
  );

const Rating = ({ value, count }: { value?: number; count?: number }) => (
  <span className="inline-flex items-center gap-1">
    <Star size={14} className="fill-[#ff6f61] text-[#ff6f61]" />
    <span className="font-medium text-slate-200">
      {Number(value ?? 0).toFixed(1)}
    </span>
    <span className="text-on-ink-faint">({count ?? 0})</span>
  </span>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-slate-800 bg-[#141922] p-5">
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-ink-muted">
    {children}
  </h2>
);

const Detail = ({
  Icon,
  label,
  children,
}: {
  Icon?: any;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-[#ff6f61]" />}
    <div className="min-w-0 flex-1">
      <dt className="text-xs text-on-ink-faint">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-200">{children}</dd>
    </div>
  </div>
);

const Stat = ({
  Icon,
  label,
  value,
}: {
  Icon: any;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="border border-slate-800 bg-[#141922] p-4">
    <div className="flex items-center gap-2 text-on-ink-muted">
      <Icon size={15} className="text-[#ff6f61]" />
      <span className="text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
    <p className="mt-2 text-2xl font-semibold tabular-nums text-on-ink">
      {value}
    </p>
  </div>
);

const ProductCard = ({ product }: { product: any }) => {
  const discounted =
    product.regular_price > product.sale_price ? product.regular_price : null;

  return (
    <Link
      href={`/dashboard/all-products`}
      className="group flex flex-col overflow-hidden border border-slate-800 bg-[#141922] transition-colors hover:border-ink-border"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-[#0d1117]">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-700">
            <Package size={28} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-sm font-medium text-slate-100">
          {product.title}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-on-ink">
            ${Number(product.sale_price ?? 0).toFixed(2)}
          </span>
          {discounted && (
            <span className="text-xs text-on-ink-faint line-through">
              ${Number(discounted).toFixed(2)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span
            className={
              product.stock > 0 ? "text-on-ink-muted" : "text-amber-400"
            }
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
          <span className="flex items-center gap-1 text-on-ink-muted">
            <Star size={12} className="fill-[#ff6f61] text-[#ff6f61]" />
            {Number(product.ratings ?? 0).toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const ReviewRow = ({ review }: { review: any }) => (
  <div className="flex items-start gap-4 border border-slate-800 bg-[#141922] p-4">
    {review.user?.avatar?.url ? (
      <img
        src={review.user.avatar.url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full border border-ink-border object-cover"
      />
    ) : (
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-border bg-white/[0.04] text-sm font-semibold text-on-ink-muted"
      >
        {(review.user?.name ?? "?").charAt(0).toUpperCase()}
      </span>
    )}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-3">
        <p className="text-sm font-medium text-slate-100">
          {review.user?.name ?? "Anonymous"}
        </p>
        <span className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={13}
              className={
                i < Math.round(review.rating)
                  ? "fill-[#ff6f61] text-[#ff6f61]"
                  : "text-slate-700"
              }
            />
          ))}
        </span>
      </div>
      <p className="mt-1 text-xs text-on-ink-faint">
        {new Date(review.createdAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  </div>
);

const Empty = ({
  Icon,
  title,
  description,
  action,
}: {
  Icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center border border-slate-800 bg-[#141922] px-6 py-16 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
      <Icon size={24} />
    </span>
    <h3 className="mt-4 text-base font-semibold text-on-ink">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm text-on-ink-muted">{description}</p>
    {action}
  </div>
);

const GridSkeleton = ({ rows }: { rows: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="h-56 animate-pulse border border-slate-800 bg-[#141922] motion-reduce:animate-none"
      />
    ))}
  </div>
);

const HomeSkeleton = () => (
  <div className="min-h-screen w-full bg-black">
    <div className="h-44 w-full animate-pulse bg-slate-900 motion-reduce:animate-none sm:h-56" />
    <div className="mx-auto max-w-6xl px-6">
      <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
        <div className="h-24 w-24 shrink-0 animate-pulse border-4 border-black bg-ink-raised motion-reduce:animate-none sm:h-28 sm:w-28" />
        <div className="space-y-2 pb-2">
          <div className="h-7 w-56 animate-pulse rounded bg-ink-raised motion-reduce:animate-none" />
          <div className="h-4 w-40 animate-pulse rounded bg-ink-raised motion-reduce:animate-none" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse bg-[#141922] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  </div>
);
