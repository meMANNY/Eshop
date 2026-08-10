import { sendKafkaEvent } from "@/actions/track-user";
import {create } from "zustand";
import { persist } from "zustand/middleware";

type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity?: number;
  shopId: string;
};

type Store = {
    cart: Product[];
    wishlist: Product[];

    addToCart: (
        product: Product,
        user: any,
        location: any,
        deviceInfo: any
    ) => Promise<void> | void;

    removeFromCart: (
        id: string,
        user: any,
        location: any,
        deviceInfo: any
    ) => Promise<void> | void;

    addToWishlist: (
        product: Product,
        user: any,
        location: any,
        deviceInfo: any
    ) => Promise<void> | void;

    removeFromWishlist: (
        id: string,
        user: any,
        location: any,
        deviceInfo: any
    ) => Promise<void> | void;
};

export const useStore = create<Store>()(
    persist(
        (set,get) =>({
            cart: [],
            wishlist: [],

            addToCart: async(
                product,
                user,
                location,
                deviceInfo

            )=>{
                set((state)=>{
                    const existing  = state.cart.find((i)=>i.id === product.id);
                    if(existing){
                        return {
                            cart: state.cart.map((i)=>i.id === product.id ? {...i, quantity: (i.quantity ?? 1) + 1} : i)
                        }
                    }
                    return {
                        cart: [...state.cart, {...product, quantity: product?.quantity}]
                    }
                });

                if(user?.id && location && deviceInfo){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: product?.id,
                        shopId: product?.shopId,
                        action: "add_to_cart",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                        device: deviceInfo?.device || "Unknown device",
                    });
                }

            },
            removeFromCart: async(id,user,location,deviceInfo) => {

                const removeProduct = get().cart.find((i)=>i.id === id);

                set((state) => ({
                    cart: state.cart.filter((i) => i.id !== id)
                }));
                if(user?.id && location && deviceInfo && removeProduct){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: removeProduct?.id,
                        shopId: removeProduct?.shopId,
                        action: "remove_from_cart",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                        device: deviceInfo?.device || "Unknown device",
                    });
                }
                if (!removeProduct) {
                    console.warn("CLIENT SKIP track remove_from_cart (no product)", {
                        productId: id,
                    });
                    return;
                }
            },
            addToWishlist: async(product,user,location,deviceInfo) => {
                set((state) => {
                    const existing = state.wishlist.find((i) => i.id === product.id);
                    if (existing) {
                        return state; // Product already in wishlist, do nothing
                    }
                    return {
                        wishlist: [...state.wishlist, product],
                    };
                });
                if(user?.id && location && deviceInfo){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: product?.id,
                        shopId: product?.shopId,
                        action: "add_to_wishlist",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                        device: deviceInfo?.device || "Unknown device",
                    });
                }
            },

            removeFromWishlist: async(id,user,location,deviceInfo) => {
                const removeProduct = get().wishlist.find((i) => i.id === id);
                 set((state) => ({
                    wishlist: state.wishlist.filter((i) => i.id !== id),
                    }));
                    if(user?.id && location && deviceInfo && removeProduct){
                    sendKafkaEvent({
                        userId: user?.id,
                        productId: removeProduct?.id,
                        shopId: removeProduct?.shopId,
                        action: "remove_from_wishlist",
                        country: location?.country || "Unknown",
                        city: location?.city || "Unknown",
                        device: deviceInfo?.device || "Unknown device",
                    });
                }

                    if (!removeProduct) {
                    console.warn("CLIENT SKIP track remove_from_wishlist (no product)", {
                        productId: id,
                    });
                    return;
                }
            },

        }),

        {name: "ecommerce-store"}
        
    )
);
