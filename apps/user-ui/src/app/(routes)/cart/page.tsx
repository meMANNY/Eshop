"use client";


import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import axiosInstance from "@/utils/axiosInstance";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/shared/components/Loader";

export default function Cart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [discountedProductId, setDiscountedProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [error, setError] = useState("");
  const [storedCouponCode, setStoredCouponCode] = useState("");

  const couponCodeApply = async () => {
    setError("");

    if (!couponCode.trim()) {
      setError("Coupon code is required!");
      return;
    }

    try {
      const res = await axiosInstance.post("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });

      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setError(res.data.message || "Coupon not valid for any items in cart.");
      }
    } catch (err: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      setError(err?.response?.data?.message);
    }
  };

  const createPaymentSession = async () => {
    if (addresses?.length === 0) {
      toast.error("Please set your delivery address to create an order!");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post(
        "/order/api/create-payment-session",
        {
          cart,
          selectedAddressId,
          coupon: {
            code: storedCouponCode,
            discountAmount,
            discountPercent,
            discountedProductId,
          },
        }
      );
      const sessionId = res.data.sessionId;
      router.push(`/checkout?sessionId=${sessionId}`);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const removeFromCart = useStore((state: any) => state.removeFromCart);
  const cart = useStore((state: any) => state.cart);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) =>
        item.id === id && (item.quantity ?? 1) > 1
          ? { ...item, quantity: (item.quantity ?? 1) - 1 }
          : item
      ),
    }));
  };
  const increaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };

  const subTotal = cart.reduce(
    (total: number, item: any) => total + (item.quantity ?? 1) * item.sale_price,
    0
  );

  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
    staleTime: 3 * 60 * 60,
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  return (
    <div className="w-full bg-[#f5f5f5]">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-10">
          <div className="md:pt-[50px] pt-8 flex items-center gap-3 mb-4">
            {/* Coral marker — the same "you are here" accent used across the app. */}
            <span
              aria-hidden="true"
              className="h-10 w-[4px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.5)]"
            />
            <h1 className="font-medium text-[44px] leading-[1] font-jost text-slate-900">
              Shopping Cart
            </h1>
            {cart.length > 0 && (
              <span className="ml-1 rounded-full bg-[#ff6f61]/10 px-3 py-1 text-sm font-medium text-[#ff6f61]">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Link href="/" className="hover:text-[#ff6f61] transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Cart</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
              <ShoppingCart size={28} />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              Your cart is empty
            </h2>
            <p className="mt-2 max-w-sm text-slate-500">
              Add a few products and they&apos;ll show up here, ready to check
              out.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-lg bg-[#ff6f61] px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[#e05a4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="lg:flex items-start gap-8 pb-16">
            {/* Line items */}
            <div className="w-full lg:w-[70%] overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-4 text-left pl-6 align-middle">Product</th>
                    <th className="py-4 text-center align-middle">Price</th>
                    <th className="py-4 text-center align-middle">Quantity</th>
                    <th className="py-4 text-center align-middle pr-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart?.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 last:border-0 transition-colors hover:bg-[#ff6f61]/[0.04]"
                    >
                      <td className="flex items-center gap-4 py-4 pl-6">
                        <Image
                          src={
                            item?.images?.[0]?.url ||
                            "https://cdn-icons-png.flaticon.com/512/6134/6134065.png"
                          }
                          alt={item?.title}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                        />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-900">
                            {item?.title}
                          </span>
                          {item?.selectedOptions && (
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              {item?.selectedOptions?.color && (
                                <span className="flex items-center gap-1.5">
                                  Color:
                                  <span
                                    className="inline-block h-3 w-3 rounded-full ring-1 ring-slate-300"
                                    style={{
                                      backgroundColor:
                                        item?.selectedOptions?.color,
                                    }}
                                  />
                                </span>
                              )}
                              {item?.selectedOptions.size && (
                                <span>Size: {item?.selectedOptions?.size}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        {item?.id === discountedProductId ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm text-slate-400 line-through">
                              ${item?.sale_price.toFixed(2)}
                            </span>
                            <span className="text-lg font-semibold text-emerald-600">
                              $
                              {(
                                (item?.sale_price * (100 - discountPercent)) /
                                100
                              ).toFixed(2)}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Discount applied
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg text-slate-900">
                            ${item?.sale_price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="mx-auto flex items-center justify-between rounded-full border border-slate-200 w-[110px] p-1">
                          <button
                            aria-label={`Decrease quantity of ${item?.title}`}
                            onClick={() => decreaseQuantity(item?.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#ff6f61]/10 hover:text-[#ff6f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium text-slate-900">
                            {item?.quantity ?? 1}
                          </span>
                          <button
                            aria-label={`Increase quantity of ${item?.title}`}
                            onClick={() => increaseQuantity(item?.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#ff6f61]/10 hover:text-[#ff6f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="pr-6 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item?.title} from cart`}
                          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                        >
                          <X size={16} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order summary */}
            <div className="mt-8 lg:mt-0 w-full lg:w-[30%] lg:sticky lg:top-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-base font-medium pb-2">
                  <span className="font-jost text-slate-600">
                    Discount ({discountPercent}%)
                  </span>
                  <span className="text-emerald-600">
                    − ${discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-900 text-[20px] font-[550] pb-3">
                <span className="font-jost">Subtotal</span>
                <span>${(subTotal - discountAmount).toFixed(2)}</span>
              </div>

              <hr className="my-4 border-slate-200" />

              <div className="mb-4">
                <h4 className="mb-[7px] font-[500] text-[15px] text-slate-900">
                  Have a coupon?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e: any) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full p-2 border border-slate-200 rounded-l-md outline-none transition-colors focus:border-[#ff6f61] placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => couponCodeApply()}
                    className="bg-[#ff6f61] cursor-pointer text-white font-medium rounded-r-md hover:bg-[#e05a4d] transition-colors px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-sm pt-2 text-red-500">{error}</p>}
              </div>

              <hr className="my-4 border-slate-200" />

              <div className="mb-4">
                <h4 className="mb-[7px] font-medium text-[15px] text-slate-900">
                  Shipping address
                </h4>
                {addresses?.length !== 0 ? (
                  <select
                    className="w-full p-2 border border-slate-200 rounded-md outline-none transition-colors focus:border-[#ff6f61] text-slate-700"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((address: any) => (
                      <option key={address.id} value={address.id}>
                        {address?.label} - {address?.city} - {address?.country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-md bg-[#ff6f61]/5 px-3 py-2 text-sm text-slate-600">
                    Add an address from your profile to place an order.
                  </p>
                )}
              </div>

              <hr className="my-4 border-slate-200" />

              <div className="mb-4">
                <h4 className="mb-[7px] font-medium text-[15px] text-slate-900">
                  Payment method
                </h4>
                <select className="w-full p-2 border border-slate-200 rounded-md outline-none transition-colors focus:border-[#ff6f61] text-slate-700">
                  <option value="credit_card">Online Payment</option>
                  <option value="cash_on_delivery">Cash On Delivery</option>
                </select>
              </div>

              <hr className="my-4 border-slate-200" />

              <div className="flex justify-between items-center text-slate-900 text-[20px] font-[550] pb-4">
                <span className="font-jost">Total</span>
                <span>${(subTotal - discountAmount).toFixed(2)}</span>
              </div>

              <button
                onClick={createPaymentSession}
                className="w-full flex items-center justify-center gap-2 bg-[#ff6f61] cursor-pointer text-white font-medium rounded-lg hover:bg-[#e05a4d] transition-colors px-4 py-2.5 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                disabled={loading}
              >
                {loading && <Loader size={20} color="text-white" />}
                {loading ? "Redirecting ..." : "Proceed to checkout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
