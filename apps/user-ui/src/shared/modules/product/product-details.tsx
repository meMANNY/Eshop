"use client";

import {
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  WalletMinimal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import useUser from "@/hooks/useUser";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import ImageMagnifier from "../../components/image-magnifier";
import Link from "next/link";
import ProductCard from "../../components/cards/product-card";
import { sanitizeRichText } from "../../../../../../packages/utils/sanitize";
import {
  Button,
  ButtonLink,
  Card,
  CardHead,
  Chip,
  Container,
  Crumbs,
  Frame,
  Kicker,
  Rating,
  Reveal,
  SectionHeader,
  SysStrip,
} from "@/shared/components/ui";

export default function ProductDetails({
  productDetails,
}: {
  productDetails: any;
}) {
  const [currentImage, setCurrentImage] = useState(
    productDetails?.images?.[0]?.url
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(productDetails?.colors?.[0] || "");
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [priceRange] = useState([productDetails?.sale_price, 1199]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const router = useRouter();

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);

  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  const isWishlisted = wishlist.some((item: any) => item.id === productDetails.id);
  const isInCart = cart.some((item: any) => item.id === productDetails.id);

  const images = productDetails?.images ?? [];

  const showImage = (index: number) => {
    if (index < 0 || index > images.length - 1) return;
    setCurrentIndex(index);
    setCurrentImage(images[index]?.url);
  };

  const discountPercentage = Math.round(
    ((productDetails?.regular_price - productDetails?.sale_price) /
      productDetails?.regular_price) *
      100
  );

  const fetchFilteredProducts = async () => {
    try {
      const query = new URLSearchParams();

      query.set("priceRange", priceRange.join(","));
      query.set("page", "1");
      query.set("limit", "5");

      const res = await axiosInstance.get(
        `/product/api/get-filtered-products?${query.toString()}`
      );
      setRecommendedProducts(res.data.products);
    } catch (err) {
      console.error("Failed to fetch filtered products", err);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange]);

  const handleChat = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: productDetails?.Shop?.sellerId }
      );
      router.push(`/inbox?conversationId=${res?.data?.conversation.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWishlist = () =>
    isWishlisted
      ? removeFromWishlist(productDetails?.id, user, location, deviceInfo)
      : addToWishlist(
          {
            ...productDetails,
            quantity,
            selectedOptions: { color: isSelected, sizes: isSizeSelected },
          },
          user,
          location,
          deviceInfo
        );

  return (
    <div className="pb-16">
      <Container className="pt-8">
        <Crumbs
          trail={[
            { label: "Products", href: "/products" },
            { label: productDetails?.title ?? "Product" },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* ---- gallery ---- */}
          <div className="lg:col-span-5">
            <Frame
              caption={{
                left: `fig.01 / ${productDetails?.slug ?? "product"}`,
                right: `${currentIndex + 1} / ${images.length || 1}`,
              }}
            >
              <ImageMagnifier
                src={currentImage}
                alt={productDetails?.title}
                fluid
                zoom={2.5}
              />
            </Frame>

            {images.length > 1 ? (
              <div className="mt-4 flex items-center gap-2">
                {images.length > 4 ? (
                  <button
                    onClick={() => showImage(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    aria-label="Previous image"
                    className="grid h-10 w-8 shrink-0 place-items-center border border-line font-mono text-sm text-ink-500 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                ) : null}

                <div className="scroll-slim flex gap-2 overflow-x-auto">
                  {images.map((image: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => showImage(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={currentIndex === i ? "true" : undefined}
                      className={`relative h-[60px] w-[60px] shrink-0 overflow-hidden border transition-colors ${
                        currentIndex === i
                          ? "border-ink-line"
                          : "border-line hover:border-ink-300"
                      }`}
                    >
                      <Image
                        src={image?.url}
                        alt=""
                        fill
                        unoptimized
                        sizes="60px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                {images.length > 4 ? (
                  <button
                    onClick={() => showImage(currentIndex + 1)}
                    disabled={currentIndex === images.length - 1}
                    aria-label="Next image"
                    className="grid h-10 w-8 shrink-0 place-items-center border border-line font-mono text-sm text-ink-500 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ---- the product itself ---- */}
          <div className="lg:col-span-4">
            <Kicker>
              {[productDetails?.category, productDetails?.Shop?.name]
                .filter(Boolean)
                .join(" · ")}
            </Kicker>

            <div className="mt-4 flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink lg:text-4xl">
                {productDetails?.title}
              </h1>
              <button
                type="button"
                onClick={toggleWishlist}
                aria-pressed={isWishlisted}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Save to wishlist"
                }
                className={`grid h-10 w-10 shrink-0 place-items-center border transition-colors ${
                  isWishlisted
                    ? "border-terra-2 text-terra-2"
                    : "border-line text-ink-500 hover:border-ink-line hover:text-terra-2"
                }`}
              >
                <Heart size={18} className={isWishlisted ? "fill-current" : ""} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Rating value={productDetails?.ratings ?? 0} />
              {/*
                This link used to read `({ratings} Reviews)` — it printed the
                average rating where a review count belongs, so a 4.5-star
                product claimed "4.5 Reviews". Nothing in the payload carries a
                count, so the link names the destination instead of inventing a
                number.
              */}
              <Link
                href="#reviews"
                className="link-underline font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-ink"
              >
                read reviews ↘
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-baseline gap-3 border-t border-line pt-6">
              <span className="figure text-3xl font-semibold text-ink">
                ${productDetails?.sale_price}
              </span>
              {productDetails?.regular_price > productDetails?.sale_price ? (
                <>
                  <span className="figure text-base text-ink-300 line-through">
                    ${productDetails?.regular_price}
                  </span>
                  {discountPercentage > 0 ? (
                    <Chip className="border-terra-2/40 text-terra-2">
                      −{discountPercentage}%
                    </Chip>
                  ) : null}
                </>
              ) : null}
            </div>

            <SysStrip
              className="mt-6"
              items={[
                {
                  key: "stock",
                  value:
                    productDetails?.stock > 0
                      ? `${productDetails.stock} left`
                      : "out of stock",
                },
                {
                  value: `brand: ${productDetails?.brand || "none"}`,
                  hideOnMobile: true,
                },
                ...(productDetails?.totalSales > 0
                  ? [{ value: `${productDetails.totalSales} sold`, trailing: true }]
                  : []),
              ]}
            />

            {/* ---- options ---- */}
            <div className="mt-8 flex flex-col gap-6 sm:flex-row">
              {productDetails?.colors?.length > 0 ? (
                <div>
                  <span className="mb-2.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                    Colour
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {productDetails.colors.map((color: string, i: number) => (
                      /* Swatches stay round: they stand for a physical colour,
                         not for a control of this interface. */
                      <button
                        key={i}
                        aria-label={`Select colour ${color}`}
                        aria-pressed={isSelected === color}
                        className={`h-8 w-8 cursor-pointer rounded-full transition ${
                          isSelected === color
                            ? "ring-2 ring-ink-line ring-offset-2 ring-offset-paper"
                            : "ring-1 ring-line hover:ring-ink-300"
                        }`}
                        onClick={() => setIsSelected(color)}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {productDetails?.sizes?.length > 0 ? (
                <div>
                  <span className="mb-2.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                    Size
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {productDetails.sizes.map((size: any, i: number) => (
                      <button
                        key={i}
                        aria-pressed={isSizeSelected === size}
                        className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                          isSizeSelected === size
                            ? "border-ink-line bg-ink text-paper"
                            : "border-line text-ink-500 hover:border-ink"
                        }`}
                        onClick={() => setIsSizeSelected(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ---- quantity and cart ---- */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-stretch border border-line">
                <button
                  aria-label="Decrease quantity"
                  className="grid h-10 w-10 place-items-center border-r border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="figure grid w-12 place-items-center text-sm text-ink">
                  {quantity}
                </span>
                <button
                  aria-label="Increase quantity"
                  className="grid h-10 w-10 place-items-center border-l border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>

              <span
                className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                  productDetails?.stock > 0 ? "text-pos" : "text-neg"
                }`}
              >
                {productDetails?.stock > 0 ? "in stock" : "out of stock"}
              </span>
            </div>

            <Button
              variant="primary"
              mono
              arrow="→"
              className="mt-6 w-full !justify-between"
              disabled={isInCart || productDetails?.stock === 0}
              onClick={() =>
                addToCart(
                  {
                    ...productDetails,
                    quantity,
                    selectedOptions: { color: isSelected, size: isSizeSelected },
                  },
                  user,
                  location,
                  deviceInfo
                )
              }
            >
              {productDetails?.stock === 0
                ? "Out of stock"
                : isInCart
                ? "In your cart"
                : "Add to cart"}
            </Button>
          </div>

          {/* ---- delivery, returns, seller ---- */}
          <div className="lg:col-span-3">
            <Card className="p-5">
              <div className="border-b border-line pb-4">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Delivery
                </span>
                <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                  <MapPin size={16} className="shrink-0 text-terra-2" />
                  {location?.city && location?.country ? (
                    <span>
                      {location.city}, {location.country}
                    </span>
                  ) : (
                    <span className="text-ink-300">Location unknown</span>
                  )}
                </div>
              </div>

              <div className="border-b border-line py-4">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Returns &amp; warranty
                </span>
                <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                  <Package size={16} className="shrink-0 text-terra-2" />
                  <span>7 day returns</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                  <WalletMinimal size={16} className="shrink-0 text-terra-2" />
                  <span>{productDetails?.warranty || "No warranty"}</span>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Sold by
                    </span>
                    <span className="mt-1 block truncate font-display text-base font-medium tracking-tight text-ink">
                      {productDetails?.Shop?.name}
                    </span>
                  </div>
                  <button
                    disabled={isLoading}
                    onClick={handleChat}
                    className="link-underline shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-terra-2 disabled:opacity-60"
                  >
                    <MessageSquareText size={14} className="mr-1 inline" />
                    {isLoading ? "opening…" : "chat ↗"}
                  </button>
                </div>

                {/*
                  A hardcoded "55% positive ratings / 100% ships on time / 100%
                  chat response" panel used to sit here. Those three figures were
                  literals in the markup, identical on every product in the
                  catalogue, and presented to buyers as this seller's measured
                  performance. Inventing trust signals is worse than showing
                  none, so what remains is the two numbers the payload actually
                  carries.
                */}
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                      Shop rating
                    </dt>
                    <dd className="figure mt-1 text-lg font-semibold text-ink">
                      {(productDetails?.Shop?.ratings ?? 0).toFixed(1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                      Followers
                    </dt>
                    <dd className="figure mt-1 text-lg font-semibold text-ink">
                      {productDetails?.Shop?.followers?.length ?? 0}
                    </dd>
                  </div>
                </dl>

                <ButtonLink
                  href={`/shop/${productDetails?.Shop?.id}`}
                  variant="ghost"
                  mono
                  arrow="↗"
                  className="mt-4 w-full"
                >
                  Visit store
                </ButtonLink>
              </div>
            </Card>
          </div>
        </div>

        {/* ---- description ---- */}
        <Card className="mt-16">
          <CardHead title="Product details" note="~/description" />
          {/*
            Seller-authored HTML. product-service sanitises on write, but every
            product created before that shipped is still raw in the database —
            so this pass is what actually protects existing rows.
          */}
          <div
            className="prose max-w-none p-6"
            dangerouslySetInnerHTML={{
              __html: sanitizeRichText(productDetails?.detailed_description),
            }}
          />
        </Card>

        {/* ---- reviews ---- */}
        <Card id="reviews" className="mt-6 scroll-mt-6">
          <CardHead title="Ratings & reviews" note="~/reviews" />
          <p className="px-6 py-14 text-center text-sm text-ink-400">
            No reviews yet. Be the first to review this product.
          </p>
        </Card>
      </Container>

      {/* ---- recommendations ---- */}
      {recommendedProducts?.length > 0 ? (
        <section className="mt-16 border-t border-ink-line py-16 lg:py-20">
          <Container>
            <SectionHeader
              index={2}
              kicker="also · worth a look"
              title="You may also like"
            />
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
              {recommendedProducts.map((product: any, i: number) => (
                <Reveal key={product.id} delay={i % 5}>
                  <ProductCard product={product} isEvent={product.starting_date} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </div>
  );
}
