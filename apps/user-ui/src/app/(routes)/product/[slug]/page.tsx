import ProductDetails from "@/shared/modules/product/product-details";
import axiosInstance from "@/utils/axiosInstance";
import { Metadata } from "next";

const fetchProductDetails = async (slug: string) => {
  try {
    const res = await axiosInstance.get(`/product/api/get-product/${slug}`);
    return res.data.product;
  } catch (err) {
    console.error("Error fetching product!", err);
  }
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);
  return {
    title: `${product?.title} | Zoz Marketplace`,
    description:
      product?.short_description ||
      "Discover high-quality products on Zoz Marketplace.",
    openGraph: {
      title: product?.title,
      description: product?.short_description || "",
      images: [
        product?.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format&fit=crop&q=80",
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: product?.short_description || "",
      images: [
        product?.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format&fit=crop&q=80",
      ],
    },
  };
};
export default async function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug);

  return <ProductDetails productDetails={productDetails} />;
}