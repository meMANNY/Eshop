"use client";

import { shopCategories, countries } from "@/configs/constants";
import axiosInstance from "@/utils/axiosInstance";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import ShopCard from "@/shared/components/cards/shop.card";
import {
  Button,
  CardSkeleton,
  CheckRow,
  Container,
  Crumbs,
  EmptyState,
  FilterGroup,
  PageHeading,
  Pager,
  SysStrip,
} from "@/shared/components/ui";

const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedCountries, page]);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat: string) => cat !== label)
        : [...prev, label]
    );
    setPage(1);
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((cou) => cou !== country)
        : [...prev, country]
    );
    setPage(1);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedCountries([]);
    setPage(1);
  };

  const filterCount = selectedCategories.length + selectedCountries.length;

  return (
    <div className="pb-16">
      {/* This page laid itself out with a bare `w-[90%] lg:w-[80%]` wrapper, so
          its gutter did not agree with any other page in the app. */}
      <Container className="pt-8">
        <Crumbs trail={[{ label: "All shops" }]} />

        <div className="mt-6">
          <PageHeading
            kicker={`/shops${filterCount ? ` · ${filterCount} filters` : ""}`}
            title="All shops"
            actions={
              filterCount > 0 ? (
                <Button variant="ghost" mono onClick={clearAll}>
                  clear filters ×
                </Button>
              ) : null
            }
          />
        </div>

        <SysStrip
          className="mb-10"
          items={[
            {
              key: "~/shops",
              value: isShopLoading ? "loading…" : `${shops.length} results`,
            },
            { value: `${filterCount} filters`, hideOnMobile: true },
            {
              value: `page ${String(page).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`,
              trailing: true,
            },
          ]}
        />

        <div className="flex w-full flex-col gap-10 lg:flex-row">
          <aside className="h-max w-full shrink-0 space-y-6 border border-line bg-paper p-5 lg:w-[270px]">
            <FilterGroup title="Categories">
              <ul>
                {shopCategories?.map((category: any) => (
                  <li key={category.value}>
                    <CheckRow
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => toggleCategory(category.value)}
                      label={category.label}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            <FilterGroup title="Countries" bordered>
              <ul>
                {countries?.map((country: any) => (
                  <li key={country.code}>
                    <CheckRow
                      checked={selectedCountries.includes(country.code)}
                      onChange={() => toggleCountry(country.code)}
                      label={country.name}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>
          </aside>

          <div className="flex-1">
            {isShopLoading ? (
              <div className={GRID}>
                {/* Was ten `h-[250px] bg-slate-200` blocks — a grey wall that
                    matched neither the card's shape nor the page's palette. */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className={GRID}>
                {shops?.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <div className="border border-line bg-paper">
                <EmptyState
                  icon={<Store size={28} />}
                  title="No shops match these filters"
                  hint="Try clearing a category or country to widen the search."
                  action={
                    filterCount > 0 ? (
                      <Button variant="ghost" mono onClick={clearAll}>
                        clear filters
                      </Button>
                    ) : null
                  }
                />
              </div>
            )}

            {/* Was one button per page — a wall of them once the directory grew. */}
            <Pager page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </Container>
    </div>
  );
}
