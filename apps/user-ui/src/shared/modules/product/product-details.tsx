"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageSquareText,
  Minus,
  Package,
  Plus,
  WalletMinimal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {  useState,useEffect } from "react";
import useUser from "@/hooks/useUser";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import ImageMagnifier from "../../components/image-magnifier";
import Link from "next/link";
import { Ratings } from "../../components/ratings";
import {CartIcon} from "../../../assets/svgs/cart-icon";
import ProductCard from "../../components/cards/product-card";



export default function ProductDetails({
  productDetails,
}: {
  productDetails: any;
}) {
  const [currentImage, setCurrentImage] = useState(
    productDetails?.images?.[0]?.url
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(
    productDetails?.colors?.[0] || ""
  );
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [priceRange] = useState([
    productDetails?.sale_price,
    1199,
  ]);
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

  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails.id
  );
  const isInCart = cart.some((item: any) => item.id === productDetails.id);

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(productDetails?.images?.[currentIndex - 1]?.url);
    }
  };
  const nextImage = () => {
    if (currentIndex < productDetails?.images?.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(productDetails?.images?.[currentIndex + 1]?.url);
    }
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
  }, [priceRange]);

  const handleChat = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: productDetails?.Shop?.sellerId },
        //isProtected
      );
      router.push(`/inbox?conversationId=${res?.data?.conversation.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#f5f5f5] py-5">
      <div className="w-[90%] lg:w-[80%] mx-auto grid grid-cols-1 lg:grid-cols-[28fr_44fr_28fr] rounded-xl border border-slate-200 bg-white shadow-sm lg:divide-x lg:divide-slate-200">
        {/* LEFT PART */}
        <div className="p-5 animate-fadeUp">
          <div className="relative w-full">
            {/* FIXED IMAGE ZOOM */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <ImageMagnifier
                src={currentImage}
                alt={productDetails?.title}
                fluid
                zoom={2.5}
              />
            </div>
          </div>
          {/* THUMBNAIL IMAGES ARRAY*/}
          <div className="relative flex items-center gap-2 mt-4 overflow-hidden">
            {productDetails?.images?.length > 4 && (
              <button
                onClick={prevImage}
                disabled={currentIndex === 0}
                aria-label="Previous image"
                className="absolute left-0 bg-white p-2 rounded-full border border-slate-200 shadow-md z-10 text-slate-600 transition-colors hover:text-[#ff6f61] disabled:opacity-40"
              >
                <ChevronLeft size={24} />
                {""}
              </button>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {productDetails?.images?.map((image: any, i: number) => (
                <Image
                  key={i}
                  src={
                    image?.url ||
                    "https://ik.imagekit.io/fz0xzwtey/products/product-1741207782553-0_-RWfpGzfHt.jpg"
                  }
                  alt="Thumbnail"
                  width={60}
                  height={60}
                  className={`cursor-pointer border-2 rounded-lg p-1 transition-colors ${
                    currentImage === image?.url
                      ? "border-[#ff6f61]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => {
                    setCurrentIndex(i);
                    setCurrentImage(image?.url);
                  }}
                />
              ))}
            </div>
            {productDetails?.images?.length > 4 && (
              <button
                onClick={nextImage}
                disabled={currentIndex === productDetails?.images?.length - 1}
                aria-label="Next image"
                className="absolute right-0 bg-white p-2 rounded-full border border-slate-200 shadow-md z-10 text-slate-600 transition-colors hover:text-[#ff6f61] disabled:opacity-40"
              >
                <ChevronRight size={24} />
                {""}
              </button>
            )}
          </div>
        </div>

        {/* MIDDLE PART */}
        <div className="p-5">
          <h1 className="text-2xl mb-2 font-semibold text-slate-900 leading-snug">
            {productDetails?.title}
          </h1>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 mt-2">
              <Ratings rating={productDetails?.ratings || 0 } />
              <Link
                href={"#reviews"}
                className="text-sm text-slate-500 transition-colors hover:text-[#ff6f61]"
              >
                ({productDetails?.ratings} Reviews)
              </Link>
            </div>
            <div>
              <Heart
                size={25}
                fill={isWishlisted ? "red" : "transparent"}
                color={isWishlisted ? "transparent" : "#777"}
                className="cursor-pointer"
                onClick={() =>
                  isWishlisted
                    ? removeFromWishlist(
                        productDetails?.id,
                        user,
                        location,
                        deviceInfo
                      )
                    : addToWishlist(
                        {
                          ...productDetails,
                          quantity,
                          selectedOptions: {
                            color: isSelected,
                            sizes: isSizeSelected,
                          },
                        },
                        user,
                        location,
                        deviceInfo
                      )
                }
              />
            </div>
          </div>
          <div className="py-3 border-b border-slate-200">
            <span className="text-slate-500">Brand: </span>
            <span className="font-medium text-slate-900">
              {productDetails?.brand || "No Brand"}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline gap-3 pb-3 border-b border-slate-200">
              <span className="text-4xl font-bold text-[#ff6f61]">
                ${productDetails?.sale_price}
              </span>
              <span className="text-lg text-slate-400 line-through">
                ${productDetails?.regular_price}
              </span>
              {discountPercentage > 0 && (
                <span className="rounded-full bg-[#ff6f61]/10 px-2.5 py-1 text-sm font-semibold text-[#ff6f61]">
                  Save {discountPercentage}%
                </span>
              )}
            </div>
            <div className="mt2">
              <div className="flex flex-col md:flex-row items-start gap-5 mt-4">
                {/* COLORS */}
                {productDetails?.colors?.length > 0 && (
                  <div>
                    <strong className="text-sm font-semibold text-slate-900">
                      Color
                    </strong>
                    <div className="flex gap-2 mt-2">
                      {productDetails?.colors?.map(
                        (color: string, i: number) => (
                          <button
                            key={i}
                            aria-label={`Select colour ${color}`}
                            className={`w-8 h-8 cursor-pointer rounded-full ring-1 ring-slate-300 transition ${
                              isSelected === color
                                ? "scale-110 ring-2 ring-[#ff6f61] ring-offset-2"
                                : "hover:scale-105"
                            }`}
                            onClick={() => setIsSelected(color)}
                            style={{ backgroundColor: color }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
                {productDetails?.sizes?.length > 0 && (
                  <div>
                    <strong className="text-sm font-semibold text-slate-900">
                      Size
                    </strong>
                    <div className="flex gap-2 mt-2">
                      {productDetails?.sizes?.map((size: any, i: number) => (
                        <button
                          key={i}
                          className={`px-4 py-1.5 cursor-pointer rounded-md border text-sm font-medium transition-colors ${
                            isSizeSelected === size
                              ? "border-[#ff6f61] bg-[#ff6f61] text-white"
                              : "border-slate-200 text-slate-700 hover:border-slate-400"
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
            </div>
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-between rounded-full border border-slate-200 w-[110px] p-1">
                  <button
                    aria-label="Decrease quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#ff6f61]/10 hover:text-[#ff6f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-medium text-slate-900">
                    {quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#ff6f61]/10 hover:text-[#ff6f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                    onClick={() => setQuantity((prev) => prev + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {productDetails?.stock > 0 ? (
                  <span className="text-emerald-600 font-semibold">
                    In stock{" "}
                    <span className="text-slate-500 font-medium">
                      ({productDetails?.stock} left)
                    </span>
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    Out of stock
                  </span>
                )}
              </div>
              <button
                className={`flex mt-6 items-center gap-2 px-6 py-[10px] bg-[#ff6f61] hover:bg-[#e05a4d] text-white font-medium rounded-lg shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61] disabled:opacity-60 ${
                  isInCart || productDetails?.stock === 0
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={isInCart || productDetails?.stock === 0}
                onClick={() =>
                  addToCart(
                    {
                      ...productDetails,
                      quantity,
                      selectedOptions: {
                        color: isSelected,
                        size: isSizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo
                  )
                }
              >
                <CartIcon />{" "}
                {productDetails?.stock === 0
                  ? "Out of stock"
                  : isInCart
                  ? "In your cart"
                  : "Add to cart"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PART */}
        <div className="p-5">
          <div className="mb-4 pb-4 border-b border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Delivery
            </span>
            <div className="flex items-center text-slate-700 gap-2 mt-2">
              <MapPin size={18} className="text-[#ff6f61] shrink-0" />
              {location?.city && location?.country && (
                <span className="text-base font-medium">
                  {location.city}, {location.country}
                </span>
              )}
            </div>
          </div>
          <div className="mb-4 pb-4 border-b border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Returns &amp; warranty
            </span>
            <div className="flex items-center text-slate-700 gap-2 mt-2">
              <Package size={18} className="text-[#ff6f61] shrink-0" />
              <span className="text-base">7 day returns</span>
            </div>
            <div className="flex items-center pt-2 text-slate-700 gap-2">
              <WalletMinimal size={18} className="text-[#ff6f61] shrink-0" />
              <span className="text-base">
                {productDetails?.warranty
                  ? productDetails?.warranty
                  : "No warranty"}
              </span>
            </div>
          </div>
          <div>
            <div className="w-full rounded-lg">
              {/* SOLD BY SECTION */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sold by
                  </span>
                  <span className="block max-w-[150px] truncate font-medium text-lg text-slate-900">
                    {productDetails?.Shop?.name}
                  </span>
                </div>
                <button
                  disabled={isLoading}
                  onClick={() => handleChat()}
                  className="text-[#ff6f61] text-sm font-medium flex items-center gap-1.5 transition-colors hover:text-[#e05a4d] disabled:opacity-60"
                >
                  <MessageSquareText size={18} />
                  {isLoading ? "Opening..." : "Chat"}
                </button>
              </div>
              {/* SELLER PERFORMANCE STATS */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-200 mt-4 pt-4">
                <div>
                  <p className="text-[12px] text-slate-500 leading-tight">
                    Positive ratings
                  </p>
                  <p className="text-lg font-semibold text-slate-900">55%</p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 leading-tight">
                    Ships on time
                  </p>
                  <p className="text-lg font-semibold text-slate-900">100%</p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 leading-tight">
                    Chat response
                  </p>
                  <p className="text-lg font-semibold text-slate-900">100%</p>
                </div>
              </div>
              {/* STORE LINK */}
              <div className="mt-4 border-t border-slate-200 pt-4">
                <Link
                  href={`/shop/${productDetails?.Shop?.id}`}
                  className="block rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:border-[#ff6f61] hover:text-[#ff6f61]"
                >
                  Visit store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-[90%] lg:w-[80%] mx-auto mt-6 animate-fadeIn">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            {/* Coral marker — the same section accent used across the app. */}
            <span
              aria-hidden="true"
              className="h-6 w-[3px] rounded-full bg-[#ff6f61]"
            />
            <h3 className="text-lg font-semibold text-slate-900">
              Product details
            </h3>
          </div>
          <div
            className="prose prose-sm text-slate-700 max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: productDetails?.detailed_description,
            }}
          />
        </div>
      </div>
      <div
        id="reviews"
        className="w-[90%] lg:w-[80%] mx-auto mt-6 scroll-mt-6 animate-fadeIn"
      >
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-6 w-[3px] rounded-full bg-[#ff6f61]"
            />
            <h3 className="text-lg font-semibold text-slate-900">
              Ratings &amp; reviews
            </h3>
          </div>
          <p className="text-center text-slate-500 py-10">
            No reviews yet. Be the first to review this product.
          </p>
        </div>
      </div>
      {recommendedProducts?.length > 0 && (
        <div className="w-[90%] lg:w-[80%] mx-auto">
          <div className="w-full h-full my-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                aria-hidden="true"
                className="h-6 w-[3px] rounded-full bg-[#ff6f61]"
              />
              <h3 className="text-xl font-semibold text-slate-900">
                You may also like
              </h3>
            </div>
            <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {recommendedProducts?.map((product: any) => (
                <div
                  key={product.id}
                  className="animate-fadeIn hover:scale-[1.02] transition-transform duration-300"
                >
                  <ProductCard
                    product={product}
                    isEvent={product.starting_date}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}