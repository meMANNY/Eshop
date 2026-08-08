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
    card: Product[];
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
