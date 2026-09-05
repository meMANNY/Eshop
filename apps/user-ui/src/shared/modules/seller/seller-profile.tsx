"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Globe,
  Heart,
  MapPin,
  PackageOpen,
  Star,
  Store,
  TicketPercent,
  Video,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "../../components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import useUser from "@/hooks/useUser";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import {
  Button,
  CardSkeleton,
  Container,
  Crumbs,
  EmptyState,
  Figure,
  Rating,
  shortDate,
} from "@/shared/components/ui";

/*
  `/seller/api/get-seller/:id` flattens the `avatar` relation to a single URL
  string and includes the shop's reviews with their authors. The generated
  `shops` type describes the table, not that response, which is why this file
  used to reach for `(shop as any).avatar`.
*/
type ShopReview = {
  id: string;
  rating: number;
  createdAt: string;
  user?: { name?: string | null } | null;
};

type Shop = {
  id: string;
  name: string;
  bio?: string | null;
  category?: string | null;
  address?: string | null;
  opening_hours?: string | null;
  website?: string | null;
  avatar?: string | null;
  coverBanner?: string | null;
  socialLinks?: { type?: string; url?: string }[] | null;
  ratings?: number | null;
  createdAt?: string | Date | null;
  reviews?: ShopReview[] | null;
};

const TABS = [
  { id: "Products", label: "Products", icon: PackageOpen },
  { id: "Offers", label: "Offers", icon: TicketPercent },
  { id: "Reviews", label: "Reviews", icon: Star },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SellerProfile({
  shop,
  followersCount,
}: {
  shop: Shop;
  followersCount: number;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("Products");
  const [followers, setFollowers] = useState(followersCount);
  const [isFollowing, setIsFollowing] = useState(false);

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const { data: products, isLoading } = useQuery({
    // The shop id belongs in the key. Without it every shop page shared one
    // cache entry, so opening a second shop showed the first one's products
    // until the refetch landed.
    queryKey: ["seller-products", shop?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-products/${shop?.id}?page=1&limit=20`
      );
      return res.data.products;
    },
    enabled: !!shop?.id,
  });

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ["seller-events", shop?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-events/${shop?.id}?page=1&limit=20`
      );
      return res.data.products;
    },
    enabled: !!shop?.id,
  });

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!shop?.id) return;
      try {
        const res = await axiosInstance.get(
          `/seller/api/is-following/${shop?.id}`
        );
        setIsFollowing(res.data.isFollowing !== null);
      } catch (err) {
        console.error("Failed to fetch follow status!", err);
      }
    };
    fetchFollowStatus();
  }, [shop?.id]);

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing)
        await axiosInstance.post("/seller/api/unfollow-shop", {
          shopId: shop?.id,
        });
      else
        await axiosInstance.post("/seller/api/follow-shop", {
          shopId: shop?.id,
        });
    },
    onSuccess: () => {
      setFollowers((prev) => (isFollowing ? prev - 1 : prev + 1));
      setIsFollowing((prev) => !prev);
      queryClient.invalidateQueries({ queryKey: ["is-following", shop?.id] });
    },
  });

  /* ------------------------------------------------------------ tracking -- */

  const trackedShop = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !shop?.id || !location || !deviceInfo) return;
    // One event per shop visit. The effect re-runs as the user, location and
    // device hooks resolve, and every one of those runs used to POST again.
    if (trackedShop.current === shop.id) return;
    trackedShop.current = shop.id;

    const url =
      (process.env.NEXT_PUBLIC_TRACK_URL ?? "http://localhost:6010") + "/track";

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        shopId: shop.id,
        action: "shop_visit",
        country: location.country || "Unknown",
        city: location.city || "Unknown",
        device: deviceInfo || "Unknown Device",
      }),
      keepalive: true,
    }).catch((e) => console.error("Tracking failed:", e));
  }, [user?.id, shop?.id, location, deviceInfo]);

  /* -------------------------------------------------------------- derived -- */

  const reviews = useMemo(() => shop?.reviews ?? [], [shop?.reviews]);

  const productImages = useMemo(
    () =>
      (products ?? [])
        .map((p: any) => p?.images?.[0]?.url)
        .filter(Boolean)
        .slice(0, 6) as string[],
    [products]
  );

  const joinedYear = shop?.createdAt
    ? new Date(shop.createdAt).getFullYear()
    : null;

  const rise = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <ShopWindow
        shopName={shop?.name}
        coverBanner={shop?.coverBanner}
        images={productImages}
        reduceMotion={!!reduceMotion}
      />

      <Container>
        {/* MASTHEAD — lifted over the window band. */}
        <motion.div {...rise} className="relative z-10 -mt-14 sm:-mt-20">
          <div className="border border-line bg-paper p-5 shadow-lift sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-paper bg-surface sm:h-24 sm:w-24">
                {shop?.avatar ? (
                  <Image
                    src={shop.avatar}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="font-display text-3xl font-semibold text-ink-500">
                    {shop?.name?.[0]?.toUpperCase() ?? "S"}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  {/* The coral rail the whole product uses to say "here". */}
                  <span className="mt-1.5 h-8 w-px bg-terra-2" aria-hidden="true" />
                  <div className="min-w-0">
                    <h1 className="font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink sm:text-[34px]">
                      {shop?.name}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
                      {shop?.bio ||
                        "This seller hasn't written a description yet."}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant={isFollowing ? "ghost" : "primary"}
                onClick={() => toggleFollowMutation.mutate()}
                disabled={toggleFollowMutation.isPending}
                aria-pressed={isFollowing}
                className="shrink-0 self-start"
              >
                <Heart
                  size={16}
                  className={isFollowing ? "fill-terra-ink text-terra-2" : ""}
                  aria-hidden="true"
                />
                {isFollowing ? "Following" : "Follow shop"}
              </Button>
            </div>

            {/*
              FACT RAIL — the four things a shopper actually weighs before
              browsing. Product count is deliberately absent: the grid is
              paginated, so any number here would be the page size, not the
              catalogue.
            */}
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
              <Fact label="Rating">
                {reviews.length > 0 || shop?.ratings ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={15} className="fill-warn text-warn" aria-hidden="true" />
                    <Figure>{(shop?.ratings ?? 0).toFixed(1)}</Figure>
                  </span>
                ) : (
                  <span className="text-base text-ink-400">Not rated</span>
                )}
              </Fact>
              <Fact label="Reviews">
                <Figure>{reviews.length}</Figure>
              </Fact>
              <Fact label="Followers">
                <Figure>{followers}</Figure>
              </Fact>
              <Fact label="Selling since">
                {joinedYear ? <Figure>{joinedYear}</Figure> : "—"}
              </Fact>
            </dl>

            {/*
              Shop details as an inline rail rather than the half-empty sidebar
              card this page used to carry — most sellers fill in one or two of
              these, and a panel of blanks reads worse than a short line.
            */}
            {(shop?.opening_hours ||
              shop?.address ||
              shop?.website ||
              (shop?.socialLinks?.length ?? 0) > 0) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-line pt-5 text-sm text-ink-500">
                {shop?.opening_hours ? (
                  <Meta icon={Clock}>{shop.opening_hours}</Meta>
                ) : null}
                {shop?.address ? <Meta icon={MapPin}>{shop.address}</Meta> : null}
                {shop?.website ? (
                  <Meta icon={Globe}>
                    <Link
                      href={shop.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terra-2 underline-offset-4 hover:underline"
                    >
                      {shop.website.replace(/^https?:\/\//, "")}
                    </Link>
                  </Meta>
                ) : null}
                {(shop?.socialLinks ?? []).map((link, i) =>
                  link?.url ? (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-400 transition-colors hover:text-terra-2"
                      aria-label={link.type ?? "Social link"}
                    >
                      {link.type === "youtube" ? (
                        <Video size={17} />
                      ) : (
                        <XIcon size={17} />
                      )}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* TABS */}
        <div className="mt-10">
          <div
            role="tablist"
            aria-label="Shop sections"
            className="scroll-slim flex gap-1 overflow-x-auto border-b border-line"
          >
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    selected
                      ? "border-terra text-ink"
                      : "border-transparent text-ink-500 hover:text-terra-2"
                  }`}
                >
                  <tab.icon size={15} aria-hidden="true" />
                  {tab.label}
                  {tab.id === "Reviews" && reviews.length > 0 ? (
                    <Figure className="text-xs text-ink-400">
                      {reviews.length}
                    </Figure>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="mt-6"
          >
            {activeTab === "Products" ? (
              <Grid
                isLoading={isLoading}
                items={products}
                empty={
                  <EmptyState
                    icon={<PackageOpen size={30} />}
                    title="Nothing listed yet"
                    hint="This shop hasn't published any products. Follow it to hear when the first one lands."
                  />
                }
                render={(product) => <ProductCard product={product} />}
              />
            ) : activeTab === "Offers" ? (
              <Grid
                isLoading={isEventsLoading}
                items={events}
                empty={
                  <EmptyState
                    icon={<TicketPercent size={30} />}
                    title="No offers running"
                    hint="Timed deals from this shop will appear here while they're live."
                  />
                }
                render={(product) => <ProductCard product={product} isEvent />}
              />
            ) : (
              <Reviews reviews={reviews} average={shop?.ratings ?? 0} />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------ shop window -- */

/**
 * The header band. A shop's own goods are the most honest thing to show at the
 * top of its page, so with no uploaded banner this sets out the first few
 * product images like a window display rather than hotlinking a stock photo of
 * someone else's warehouse — the same call `shop.card.tsx` already made for the
 * cards on the shops index.
 */
function ShopWindow({
  shopName,
  coverBanner,
  images,
  reduceMotion,
}: {
  shopName?: string;
  coverBanner?: string | null;
  images: string[];
  reduceMotion: boolean;
}) {
  const hasWindow = !coverBanner && images.length >= 3;

  return (
    <div className="relative h-[190px] w-full overflow-hidden bg-surface sm:h-[280px]">
      {coverBanner ? (
        <Image
          src={coverBanner}
          alt=""
          fill
          unoptimized
          priority
          className="object-cover"
        />
      ) : hasWindow ? (
        <div className="flex h-full w-full">
          {images.map((src, i) => (
            <motion.div
              key={`${src}-${i}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              /* Six panes at phone width are 60px slivers that read as stripes
                 rather than goods, so the tail of the row drops out as the
                 viewport narrows. */
              className={`relative h-full flex-1 ${
                i >= 3 ? "hidden sm:block" : ""
              } ${i >= 5 ? "sm:hidden lg:block" : ""}`}
            >
              <Image src={src} alt="" fill unoptimized className="object-cover" />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-coral/15 to-coral/5">
          <Store size={34} className="text-terra-2/40" aria-hidden="true" />
        </div>
      )}

      {/*
        The wash, in two layers. Product shots are busy and arrive in unknown
        tones, so a coral tint gives the band one consistent cast and the canvas
        gradient veils it — heavily at the top, where the breadcrumb has to stay
        legible over whatever photo happens to sit there, and to solid at the
        bottom so the masthead lifts off it cleanly.
      */}
      {(coverBanner || hasWindow) && (
        <>
          <div aria-hidden="true" className="absolute inset-0 bg-terra/20" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-canvas/80 via-canvas/45 to-canvas"
          />
        </>
      )}

      <div className="absolute inset-x-0 top-0">
        <Container className="pt-5">
          <Crumbs
            trail={[
              { label: "Shops", href: "/shops" },
              { label: shopName ?? "Shop" },
            ]}
          />
        </Container>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces -- */

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper px-4 py-3">
      <dt className="text-label font-semibold uppercase text-ink-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-ink">{children}</dd>
    </div>
  );
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon size={15} className="shrink-0 text-terra-2" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function Grid({
  isLoading,
  items,
  empty,
  render,
}: {
  isLoading: boolean;
  items?: any[];
  empty: React.ReactNode;
  render: (item: any) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // The empty state used to be a `<p>` inside the grid, so it was laid out as a
  // single 1-of-5 column and sat squashed against the left edge.
  if (!items?.length) return <>{empty}</>;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item: any) => (
        <div key={item.id}>{render(item)}</div>
      ))}
    </div>
  );
}

/**
 * Reviews here are a star rating and nothing else — `shopReviews` has no comment
 * column — so this shows the shape of the ratings rather than pretending there is
 * prose to read. The tab used to be hard-coded to "No Reviews Available yet!"
 * while `get-seller` was already returning this data.
 */
function Reviews({
  reviews,
  average,
}: {
  reviews: ShopReview[];
  average: number;
}) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star size={30} />}
        title="No ratings yet"
        hint="Ratings appear here once buyers have ordered from this shop."
      />
    );
  }

  const buckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.round(r.rating) === stars).length,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="border border-line bg-paper p-5">
        <p className="font-display text-5xl font-semibold leading-none text-ink">
          <Figure>{average.toFixed(1)}</Figure>
        </p>
        <div className="mt-2.5">
          <Rating value={average} count={reviews.length} size={15} />
        </div>

        <div className="mt-5 space-y-2">
          {buckets.map(({ stars, count }) => (
            <div key={stars} className="flex items-center gap-2.5">
              <span className="figure w-3 text-xs text-ink-500">{stars}</span>
              <Star size={11} className="fill-warn text-warn" aria-hidden="true" />
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface ring-1 ring-inset ring-line"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-terra"
                  style={{
                    width: `${(count / reviews.length) * 100}%`,
                  }}
                />
              </div>
              <span className="figure w-4 text-right text-xs text-ink-400">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-line overflow-hidden border border-line bg-paper">
        {reviews.map((review) => (
          <li key={review.id} className="flex items-center gap-4 px-5 py-4">
            {/*
              `get-seller` includes the review's user but not that user's avatar
              relation, so this is an initial by design rather than a fallback
              for a missing image.
            */}
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terra-soft font-display text-sm font-semibold text-terra-2">
              {review.user?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="clamp-1 text-sm font-medium text-ink">
                {review.user?.name ?? "A buyer"}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {shortDate(review.createdAt)}
              </p>
            </div>
            <Rating value={review.rating} size={13} />
          </li>
        ))}
      </ul>
    </div>
  );
}
