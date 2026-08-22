import SellerProfile from "@/shared/modules/seller/seller-profile";
import axiosInstance from "@/utils/axiosInstance";

import { Metadata } from "next";
import { notFound } from "next/navigation";

async function fetchSellerDetails(id: string) {
  const res = await axiosInstance.get(`/seller/api/get-seller/${id}`);
  return res.data;
}

/*
  Next only recognises the exact export name `generateMetadata`. This was
  `generateMetaData`, so it was dead code — the shop pages shipped with no
  title, description, or OG tags at all. It also read `params.id` off what is
  a Promise in the app router, which would have yielded `undefined` and sent
  the literal string "undefined" to the API the moment the name was corrected.
*/
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Metadata runs before the page body, so an unresolvable shop must not throw
  // here — the page's own notFound() is what should handle it.
  let data: any;
  try {
    data = await fetchSellerDetails(id);
  } catch {
    return { title: "Shop not found | Eshop Marketplace" };
  }

  return {
    title: `${data?.shop?.name} | Eshop Marketplace`,
    description:
      data?.shop?.bio ||
      "Explore products and services from trusted sellers on Eshop.",
    openGraph: {
      title: `${data?.shop?.name} | Eshop Marketplace`,
      description:
        data?.shop?.bio ||
        "Explore products and services from trusted sellers on Eshop.",
      type: "website",
      images: [
        {
          url:
            data?.shop?.avatar ||
            "https://cdn-icons-png.flaticon.com/512/847/847969.png",
          width: 800,
          height: 600,
          alt: data?.shop?.name || "Shop Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data?.shop?.name} | Eshop Marketplace`,
      description:
        data?.shop?.bio ||
        "Explore products and services from trusted sellers on Eshop.",
      images: [
        data?.shop?.avatar ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png",
      ],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // A bad id now gets a 400 from the API rather than a 500, but an unhandled
  // rejection here is still a crashed page — a shop that cannot be resolved is
  // a 404.
  let data;
  try {
    data = await fetchSellerDetails(id);
  } catch {
    notFound();
  }

  if (!data?.shop) notFound();

  return (
    <div>
      <SellerProfile shop={data?.shop} followersCount={data?.followersCount} />
    </div>
  );
}