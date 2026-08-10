"use client";

import { shopCategories, countries } from "@/configs/constants";
import axiosInstance from "@/utils/axiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import ShopCard from "@/shared/components/cards/shop.card";

export default function Page() {
  const router = useRouter();

  const [isShopLoading, setIsShopLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const updateURL = () => {
    const params = new URLSearchParams();

    if (selectedCategories?.length > 0)
      params.set("categories", selectedCategories.join(","));

    if (selectedCountries?.length > 0)
      params.set("countries", selectedCountries.join(","));

    params.set("page", page.toString());
    params.set("limit", "12");
    router.replace(`/shops?${decodeURIComponent(params.toString())}`);
  };

  const fetchFilteredShops = async () => {
    setIsShopLoading(true);
    try {
      const query = new URLSearchParams();

      if (selectedCategories?.length > 0)
        query.set("categories", selectedCategories.join(","));

      if (selectedCountries?.length > 0)
        query.set("countries", selectedCountries.join(","));
      query.set("page", page.toString());
      query.set("limit", "12");

      const res = await axiosInstance.get(
        `product/api/get-filtered-shops?${query.toString()}`
      );
      setShops(res.data.shops);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch filtered shops.", err);
    } finally {
      setIsShopLoading(false);
    }
  };

  useEffect(() => {
    updateURL();
    fetchFilteredShops();
  }, [selectedCategories, selectedCountries, page]);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat: string) => cat !== label)
        : [...prev, label]
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((cou) => cou !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-14">
      <div className="w-[90%] lg:w-[80%] mx-auto">
        {/* Header */}
        <div className="pb-10">
          <div className="md:pt-10 pt-8 flex items-center gap-3 mb-3">
            {/* Coral marker — the same "you are here" accent used across the app. */}
            <span
              aria-hidden="true"
              className="h-10 w-[4px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.5)]"
            />
            <h1 className="font-semibold text-[40px] sm:text-[44px] leading-tight font-jost text-slate-900">
              All Shops
            </h1>
          </div>
          <div className="flex items-center text-sm text-slate-500 gap-2">
            <Link href={"/"} className="hover:text-[#ff6f61] transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">All Shops</span>
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR */}
          <aside className="w-full lg:w-[270px] shrink-0 rounded-xl bg-white p-6 shadow-sm border border-slate-200 h-max">
            {/* CATEGORY FILTER */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">
                Categories
              </h3>
              <ul className="space-y-1">
                {shopCategories?.map((category: any) => (
                  <li key={category.value}>
                    <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-full rounded-md px-2 py-1.5 transition-colors hover:bg-[#ff6f61]/5 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.value)}
                        onChange={() => toggleCategory(category.value)}
                        className="accent-[#ff6f61] cursor-pointer"
                      />
                      <span>{category.label}</span>
                    </label>
                  </li>
                ))}
              </ul>

              {/* COUNTRIES FILTER */}
              <h3 className="text-base font-semibold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">
                Countries
              </h3>
              <ul className="space-y-1">
                {countries?.map((country: any) => (
                  <li key={country.code}>
                    <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-full rounded-md px-2 py-1.5 transition-colors hover:bg-[#ff6f61]/5 hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country.code)}
                        onChange={() => toggleCountry(country.code)}
                        className="accent-[#ff6f61] cursor-pointer"
                      />
                      {country.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* GRID */}
          <div className="flex-1">
            {isShopLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 animate-fadeIn">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    className="h-[250px] bg-slate-200 rounded-xl animate-pulse"
                    key={i}
                  />
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5 transition-all duration-500 animate-fadeIn">
                {shops?.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 px-6 text-center animate-fadeIn">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61]">
                  <Store size={28} />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">
                  No shops match these filters
                </h2>
                <p className="mt-2 max-w-sm text-slate-500">
                  Try clearing a category or country to widen the search.
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
