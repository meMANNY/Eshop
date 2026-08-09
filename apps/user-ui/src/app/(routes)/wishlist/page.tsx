"use client";


import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import { useStore } from "@/store";
import { Heart, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Wishlist() {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      wishlist: state.wishlist.map((item) =>
        item.id === id && (item.quantity ?? 1) > 1
          ? { ...item, quantity: (item.quantity ?? 1) - 1 }
          : item
      ),
    }));
  };
  const increaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      wishlist: state.wishlist.map((item) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromWishlist(id, user, location, deviceInfo);
  };

  return (
    <div className="w-full bg-[#f5f5f5]">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-10">
          <div className="md:pt-12 pt-8 flex items-center gap-3 mb-4">
            {/* Coral marker — the same "you are here" accent used across the app. */}
            <span
              aria-hidden="true"
              className="h-9 w-[4px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.5)]"
            />
            <h1 className="font-semibold text-4xl leading-tight font-jost text-slate-900">
              Wishlist
            </h1>
            {wishlist.length > 0 && (
              <span className="ml-1 rounded-full bg-[#ff6f61]/10 px-3 py-1 text-sm font-medium text-[#ff6f61]">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Link href="/" className="hover:text-[#ff6f61] transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Wishlist</span>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
              <Heart size={28} />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mt-2 max-w-sm text-slate-500">
              Save the products you love and they&apos;ll show up here.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-lg bg-[#ff6f61] px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[#e05a4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-slate-700">
              <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 pl-6">Product</th>
                  <th className="py-4">Price</th>
                  <th className="py-4">Quantity</th>
                  <th className="py-4">Action</th>
                  <th className="py-4 pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {wishlist?.map((item: any) => (
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
                      <span className="font-medium text-slate-900">
                        {item.title}
                      </span>
                    </td>
                    <td className="px-6 font-semibold text-slate-900">
                      ${item.sale_price.toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center justify-between rounded-full border border-slate-200 w-[110px] p-1">
                        <button
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => decreaseQuantity(item?.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#ff6f61]/10 hover:text-[#ff6f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium text-slate-900">
                          {item?.quantity ?? 1}
                        </span>
                        <button
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => increaseQuantity(item?.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-[#ff6f61]/10 hover:text-[#ff6f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          addToCart(item, user, location, deviceInfo)
                        }
                        className="rounded-lg bg-[#ff6f61] px-5 py-2 font-medium text-white shadow-sm transition-colors hover:bg-[#e05a4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                      >
                        Add to cart
                      </button>
                    </td>
                    <td className="pr-6">
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title} from wishlist`}
                        className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <X size={16} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
