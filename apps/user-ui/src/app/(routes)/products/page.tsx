"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";
import { Range } from "react-range";

const MIN = 0,
  MAX = 1199;

export default function Page() {
  const router = useRouter();

  const [isProductLoading, setisProductLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1199]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [tempPriceRange, setTempPriceRange] = useState([0, 1199]);

  const colors = [
    { name: "Black", code: "#000" },
    { name: "Red", code: "#ff0000" },
    { name: "Green", code: "#00ff00" },
    { name: "Blue", code: "#0000ff" },
    { name: "Yellow", code: "#ffff00" },
    { name: "Magenta", code: "#ff00ff" },
    { name: "Cyan", code: "#00ffff" },
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const updateURL = () => {
    const params = new URLSearchParams();
    params.set("priceRange", priceRange.join(","));
    if (selectedCategories?.length > 0)
      params.set("categories", selectedCategories.join(","));
    if (selectedColors?.length > 0)
      params.set("colors", selectedColors.join(","));
    if (selectedSizes?.length > 0) params.set("sizes", selectedSizes.join(","));
    params.set("page", page.toString());
    params.set("limit", "12");
    router.replace(`/products?${decodeURIComponent(params.toString())}`);
  };

  const fetchFilteredProducts = async () => {
    setisProductLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("priceRange", priceRange.join(","));
      if (selectedCategories?.length > 0)
        query.set("categories", selectedCategories.join(","));
      if (selectedColors?.length > 0)
        query.set("colors", selectedColors.join(","));
      if (selectedSizes?.length > 0)
        query.set("sizes", selectedSizes.join(","));
      query.set("page", page.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(
        `product/api/get-filtered-products?${query.toString()}`
      );
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch filtered products.", err);
    } finally {
      setisProductLoading(false);
    }
  };

  useEffect(() => {
    updateURL();
    fetchFilteredProducts();
  }, [priceRange, selectedCategories, selectedColors, selectedSizes, page]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res.data.categories;
    },
    staleTime: 1000 * 60 * 30,
  });

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat: string) => cat !== label)
        : [...prev, label]
    );
  };
  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c: string) => c !== color)
        : [...prev, color]
    );
  };
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s: string) => s !== size)
        : [...prev, size]
    );
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-14">
      <div className="w-[90%] lg:w-[80%] m-auto">
        {/* HEADER */}
        <div className="pb-10">
          <div className="md:pt-10 pt-8 flex items-center gap-3 mb-3">
            {/* Coral marker — the same "you are here" accent used across the app. */}
            <span
              aria-hidden="true"
              className="h-10 w-[4px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.5)]"
            />
            <h1 className="font-semibold text-[40px] sm:text-[44px] leading-tight font-jost text-slate-900">
              All Products
            </h1>
          </div>
          <div className="flex items-center text-sm text-slate-500 gap-2">
            <Link href={"/"} className="hover:text-[#ff6f61] transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">All Products</span>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR */}
          <aside className="w-full lg:w-[270px] shrink-0 rounded-xl bg-white p-6 space-y-6 shadow-sm border border-slate-200 h-max">
            {/* PRICE FILTER */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">Price</h3>
              <div className="ml-2">
                <Range
                  values={tempPriceRange}
                  step={1}
                  min={MIN}
                  max={MAX}
                  onChange={(values) => setTempPriceRange(values)}
                  renderTrack={({ props, children }) => {
                    const [min, max] = tempPriceRange;
                    const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                    const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;

                    return (
                      <div
                        {...props}
                        className="h-[6px] bg-slate-200 rounded-full relative cursor-pointer"
                        style={{ ...props.style }}
                      >
                        <div
                          className="absolute h-full bg-[#ff6f61] rounded-full"
                          style={{
                            left: `${percentageLeft}%`,
                            width: `${percentageRight - percentageLeft}%`,
                          }}
                        />
                        {children}
                      </div>
                    );
                  }}
                  renderThumb={({ props }) => {
                    const { key, ...rest } = props;
                    return (
                      <div
                        key={key}
                        {...rest}
                        className="w-[18px] h-[18px] bg-[#ff6f61] rounded-full border-2 border-white shadow-md hover:scale-110 transform transition-transform duration-150"
                      ></div>
                    );
                  }}
                />
              </div>

              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-slate-600 font-medium">
                  ${tempPriceRange[0]} - ${tempPriceRange[1]}
                </div>
                <button
                  onClick={() => {
                    setPriceRange(tempPriceRange);
                    setPage(1);
                  }}
                  className="text-sm px-4 py-1.5 bg-[#ff6f61] text-white font-medium rounded-md shadow-sm hover:bg-[#e05a4d] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* CATEGORY FILTER */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Category
              </h3>
              <ul className="space-y-1 mt-2">
                {isLoading ? (
                  <li className="text-center text-slate-500 animate-pulse">
                    Loading...
                  </li>
                ) : (
                  categories?.map((category: any) => (
                    <li key={category}>
                      <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-full rounded-md px-2 py-1.5 transition-colors hover:bg-[#ff6f61]/5 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="accent-[#ff6f61] cursor-pointer"
                        />
                        <span>{category}</span>
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* COLOR FILTER */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Color
              </h3>
              <ul className="space-y-1 mt-2">
                {colors?.map((color) => (
                  <li key={color.name}>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer rounded-md px-2 py-1.5 transition-colors hover:bg-[#ff6f61]/5 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color.name)}
                        onChange={() => toggleColor(color.name)}
                        className="accent-[#ff6f61] cursor-pointer"
                      />
                      <span
                        className="w-[16px] h-[16px] rounded-full ring-1 ring-slate-300"
                        style={{ backgroundColor: color.code }}
                      />
                      <span>{color.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* SIZE FILTER */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Size
              </h3>
              <ul className="space-y-1 mt-2">
                {sizes?.map((size) => (
                  <li key={size}>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer rounded-md px-2 py-1.5 transition-colors hover:bg-[#ff6f61]/5 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                        className="accent-[#ff6f61] cursor-pointer"
                      />
                      <span className="font-medium">{size}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            {isProductLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 animate-fadeIn">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    className="h-[250px] bg-slate-200 rounded-xl animate-pulse"
                    key={i}
                  />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5 transition-all duration-500 animate-fadeIn">
                {products?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isEvent={product.starting_date}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 px-6 text-center animate-fadeIn">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
                  <PackageSearch size={28} />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">
                  No products match these filters
                </h2>
                <p className="mt-2 max-w-sm text-slate-500">
                  Try widening the price range or clearing a filter.
                </p>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    aria-current={page === i + 1 ? "page" : undefined}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61] ${
                      page === i + 1
                        ? "border-[#ff6f61] bg-[#ff6f61] text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#ff6f61] hover:text-[#ff6f61]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
