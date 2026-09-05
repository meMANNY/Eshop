'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ImageMagnifier from '../image-magnifier';
import React, { useEffect, useState } from 'react';
import { Heart, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Ratings } from '../ratings/index';
import { useStore } from '@/store';
import useDeviceTracking from '@/hooks/useDeviceTracking';
import useLocationTracking from '@/hooks/useLocationTracking';
import useUser from '@/hooks/useUser';
import axiosInstance from '@/utils/axiosInstance';
import { isProtected } from '@/utils/protected';
import { Button, Chip, Figure, Frame, money } from '../ui';

/*
  Quick view. It is the same product page in a dialog, so it wears the same
  vocabulary: a header strip with an escape affordance, a framed figure with
  registration marks, mono option labels, square controls, and one pill for the
  action that spends money.
*/
const ProductDetailsCard = ({
  data,
  setOpen,
}: {
  data: any;
  setOpen: (open: boolean) => void;
}) => {
  const router = useRouter();

  const [activeImage, setActiveImage] = useState(0);
  const [isSelected, setIsSelected] = useState(data?.colors?.[0] || '');
  const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const addToCart = useStore((state: any) => state.addToCart);

  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);

  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  const isWishlisted = wishlist.some((item: any) => item.id === data.id);
  const isInCart = cart.some((item: any) => item.id === data.id);

  /*
    Escape closes it, and the page behind stops scrolling while it is open —
    neither of which the original dialog did, so on a phone the grid kept moving
    under the overlay.
  */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [setOpen]);

  const handleChat = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        '/chatting/api/create-user-conversationGroup',
        { sellerId: data?.Shop?.sellerId },
        isProtected
      );
      // `newConversation` responds with { conversation, isNew } — there is no
      // top-level `conversationId`. Reading one produced the string "undefined"
      // in the URL, which reached Prisma as an ObjectID and threw P2023.
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const discount =
    data?.regular_price > data?.sale_price
      ? Math.round(
          (100 * (data.regular_price - data.sale_price)) / data.regular_price
        )
      : 0;

  const avatarUrl = data?.Shop?.avatar?.[0]?.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={data?.title ?? 'Product quick view'}
    >
      <div
        className="scroll-slim max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-ink-line bg-paper shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The same ruled header strip every dialog in this theme carries. */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-line bg-surface px-6 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra-2">
            ~/quick-view
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-ink"
          >
            esc ×
          </button>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-2">
          {/* ---- figure ---- */}
          <div>
            <Frame
              caption={{
                left: `fig.01 / ${data?.slug ?? 'product'}`,
                right: `${activeImage + 1} / ${data?.images?.length || 1}`,
              }}
            >
              <ImageMagnifier
                src={data?.images?.[activeImage]?.url}
                alt={data?.title}
                fluid
                zoom={2.2}
              />
            </Frame>

            {data?.images?.length > 1 ? (
              <div className="scroll-slim mt-4 flex gap-2 overflow-x-auto">
                {data.images.map((image: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={activeImage === i ? 'true' : undefined}
                    className={`relative h-[60px] w-[60px] shrink-0 overflow-hidden border transition-colors ${
                      activeImage === i
                        ? 'border-ink-line'
                        : 'border-line hover:border-ink-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      unoptimized
                      sizes="60px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* ---- the product ---- */}
          <div className="min-w-0">
            {/* Shop line */}
            <div className="flex items-start gap-3 border-b border-line pb-5">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden border border-ink-line bg-surface">
                {/*
                  `Shop.avatar` is an `images[]` relation, so the raw value is an
                  array of rows. `[]` is truthy, so passing it straight through
                  meant the fallback never fired and next/image got an array as
                  `src`. The fallback was also a hotlinked flaticon PNG — a
                  third-party request per open, for a placeholder.
                */}
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <span className="font-display text-base font-medium text-ink-500">
                    {data?.Shop?.name?.[0]?.toUpperCase() ?? 'S'}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/${data?.Shop?.id}`}
                  className="block truncate font-display text-base font-medium tracking-tight text-ink transition-colors hover:text-terra"
                >
                  {data?.Shop?.name}
                </Link>
                <div className="mt-1.5">
                  <Ratings rating={data?.Shop?.ratings} />
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                  <MapPin size={12} className="shrink-0 text-terra-2" />
                  {data?.Shop?.address || 'location not available'}
                </p>
              </div>

              <button
                disabled={isLoading}
                onClick={handleChat}
                className="link-underline shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-terra-2 disabled:opacity-60"
              >
                <MessageCircle size={12} className="mr-1 inline" />
                {isLoading ? 'opening…' : 'message ↗'}
              </button>
            </div>

            <h3 className="mt-5 font-display text-2xl font-medium leading-[1.1] tracking-tight text-ink">
              {data?.title}
            </h3>
            {data?.short_description ? (
              <p className="mt-2.5 text-sm leading-[1.55] text-ink-500">
                {data.short_description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-baseline gap-3 border-t border-line pt-5">
              <Figure className="text-2xl font-semibold text-ink">
                {money(data?.sale_price)}
              </Figure>
              {discount ? (
                <>
                  <Figure className="text-sm text-ink-300 line-through">
                    {money(data?.regular_price)}
                  </Figure>
                  <Chip className="border-terra-2/40 text-terra-2">−{discount}%</Chip>
                </>
              ) : null}
            </div>

            {/* stock / brand / delivery, in the metadata voice */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
              <span className={data?.stock > 0 ? 'text-pos' : 'text-neg'}>
                {data?.stock > 0 ? 'in stock' : 'out of stock'}
              </span>
              {data?.brand ? (
                <span className="text-ink-400">brand: {data.brand}</span>
              ) : null}
              <span className="text-ink-400">
                eta {estimatedDelivery.toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            </div>

            {/* ---- options ---- */}
            <div className="mt-6 flex flex-col gap-5 sm:flex-row">
              {data?.colors?.length > 0 && (
                <div>
                  <span className="mb-2.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                    Colour
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {data.colors.map((color: string, i: number) => (
                      /* Round, because a swatch stands for a physical colour. */
                      <button
                        key={i}
                        aria-label={`Select colour ${color}`}
                        aria-pressed={isSelected === color}
                        className={`h-8 w-8 rounded-full transition ${
                          isSelected === color
                            ? 'ring-2 ring-ink-line ring-offset-2 ring-offset-paper'
                            : 'ring-1 ring-line hover:ring-ink-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setIsSelected(color)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {data?.sizes?.length > 0 && (
                <div>
                  <span className="mb-2.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                    Size
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.sizes.map((size: string, i: number) => (
                      <button
                        key={i}
                        aria-pressed={isSizeSelected === size}
                        className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                          isSizeSelected === size
                            ? 'border-ink-line bg-ink text-paper'
                            : 'border-line text-ink-500 hover:border-ink'
                        }`}
                        onClick={() => setIsSizeSelected(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ---- quantity and cart ---- */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex items-stretch border border-line">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="grid h-10 w-10 place-items-center border-r border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
                >
                  <span aria-hidden="true">−</span>
                </button>
                <Figure className="grid w-12 place-items-center text-sm text-ink">
                  {quantity}
                </Figure>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="grid h-10 w-10 place-items-center border-l border-line font-mono text-sm text-ink-500 transition-colors hover:bg-surface hover:text-ink"
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  isWishlisted
                    ? removeFromWishlist(data.id, user, location, deviceInfo)
                    : addToWishlist(
                        { ...data, quantity },
                        user,
                        location,
                        deviceInfo
                      )
                }
                aria-pressed={isWishlisted}
                aria-label={
                  isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'
                }
                className={`grid h-10 w-10 place-items-center border transition-colors ${
                  isWishlisted
                    ? 'border-terra-2 text-terra-2'
                    : 'border-line text-ink-500 hover:border-ink-line hover:text-terra-2'
                }`}
              >
                <Heart size={17} className={isWishlisted ? 'fill-current' : ''} />
              </button>
            </div>

            {/*
              Was a hardcoded `bg-[#ff5722]` fill with a sweeping shine overlay —
              a second orange that belonged to no palette, on the one control
              that spends money.
            */}
            <Button
              variant="primary"
              mono
              arrow="→"
              disabled={isInCart || data?.stock === 0}
              onClick={() =>
                !isInCart &&
                addToCart(
                  {
                    ...data,
                    quantity,
                    selectedOptions: { color: isSelected, size: isSizeSelected },
                  },
                  user,
                  location,
                  deviceInfo
                )
              }
              className="mt-5 w-full !justify-between"
            >
              {data?.stock === 0
                ? 'Out of stock'
                : isInCart
                ? 'In your cart'
                : 'Add to cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
