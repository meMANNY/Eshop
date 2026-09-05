"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { Range } from "react-range";
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

const MIN = 0,
  MAX = 1199;

const COLORS = [
  { name: "Black", code: "#000000" },
  { name: "Red", code: "#ff0000" },
  { name: "Green", code: "#00ff00" },
  { name: "Blue", code: "#0000ff" },
  { name: "Yellow", code: "#ffff00" },
  { name: "Magenta", code: "#ff00ff" },
  { name: "Cyan", code: "#00ffff" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const GRID = "grid grid-cols-2 gap-6 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4";

export default function Page() {
  const router = useRouter();

  const [isProductLoading, setIsProductLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([MIN, MAX]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [tempPriceRange, setTempPriceRange] = useState([MIN, MAX]);

  const buildQuery = () => {
    const query = new URLSearchParams();
    query.set("priceRange", priceRange.join(","));
    if (selectedCategories.length) query.set("categories", selectedCategories.join(","));
    if (selectedColors.length) query.set("colors", selectedColors.join(","));
    if (selectedSizes.length) query.set("sizes", selectedSizes.join(","));
    query.set("page", String(page));
    query.set("limit", "12");
    return query;
  };

  useEffect(() => {
    const query = buildQuery();
    router.replace(`/offers?${decodeURIComponent(query.toString())}`);

    /*
      The old effect fired a fetch with no cancellation, so changing two filters
      quickly could land the slower response last and paint stale results.
    */
    let cancelled = false;
    setIsProductLoading(true);
    axiosInstance
      .get(`product/api/get-filtered-offers?${query.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.products);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch((err) => console.error("Failed to fetch filtered offers.", err))
      .finally(() => !cancelled && setIsProductLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, selectedCategories, selectedColors, selectedSizes, page]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res.data.categories;
    },
    staleTime: 1000 * 60 * 30,
  });

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
      setter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
      setPage(1);
    };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([MIN, MAX]);
    setTempPriceRange([MIN, MAX]);
    setPage(1);
  };

  const filterCount =
    selectedCategories.length +
    selectedColors.length +
    selectedSizes.length +
    (priceRange[0] !== MIN || priceRange[1] !== MAX ? 1 : 0);

  return (
    <div className="pb-16">
      {/* This page laid itself out with a bare `w-[90%] lg:w-[80%]` wrapper, so
          its gutter did not agree with any other page in the app. */}
      <Container className="pt-8">
        <Crumbs trail={[{ label: "Offers" }]} />

        <div className="mt-6">
          <PageHeading
            kicker={`/offers${filterCount ? ` · ${filterCount} filters` : ""}`}
            title="On offer, briefly"
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
              key: "~/offers",
              value: isProductLoading ? "loading…" : `${products.length} running`,
            },
            { value: `${filterCount} filters`, hideOnMobile: true },
            {
              value: `page ${String(page).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`,
              trailing: true,
            },
          ]}
        />

        <div className="flex w-full flex-col gap-10 lg:flex-row">
          <aside className="h-max w-full shrink-0 space-y-6 border border-line bg-paper p-5 lg:w-[260px]">
            <FilterGroup title="Price">
              <div className="px-1">
                <Range
                  values={tempPriceRange}
                  step={1}
                  min={MIN}
                  max={MAX}
                  onChange={setTempPriceRange}
                  renderTrack={({ props, children }) => {
                    const [min, max] = tempPriceRange;
                    const left = ((min - MIN) / (MAX - MIN)) * 100;
                    const right = ((max - MIN) / (MAX - MIN)) * 100;
                    return (
                      <div
                        {...props}
                        className="relative h-px cursor-pointer bg-line"
                        style={{ ...props.style }}
                      >
                        <div
                          className="absolute h-full bg-terra-2"
                          style={{ left: `${left}%`, width: `${right - left}%` }}
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
                        className="h-4 w-4 border border-ink-line bg-paper"
                      />
                    );
                  }}
                />
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="figure text-sm text-ink-500">
                  ${tempPriceRange[0]} – ${tempPriceRange[1]}
                </span>
                <Button
                  variant="primary"
                  mono
                  arrow="→"
                  className="!px-3 !py-1.5"
                  onClick={() => {
                    setPriceRange(tempPriceRange);
                    setPage(1);
                  }}
                >
                  apply
                </Button>
              </div>
            </FilterGroup>

            <FilterGroup title="Category" bordered>
              {isLoading ? (
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-300">
                  loading…
                </p>
              ) : (
                <ul>
                  {categories?.map((category: any) => (
                    <li key={category}>
                      <CheckRow
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggle(setSelectedCategories)(category)}
                        label={category}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </FilterGroup>

            <FilterGroup title="Colour" bordered>
              <ul>
                {COLORS.map((color) => (
                  <li key={color.name}>
                    <CheckRow
                      checked={selectedColors.includes(color.name)}
                      onChange={() => toggle(setSelectedColors)(color.name)}
                      label={color.name}
                      swatch={color.code}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>

            <FilterGroup title="Size" bordered>
              <ul>
                {SIZES.map((size) => (
                  <li key={size}>
                    <CheckRow
                      checked={selectedSizes.includes(size)}
                      onChange={() => toggle(setSelectedSizes)(size)}
                      label={size}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>
          </aside>

          <div className="flex-1">
            {isProductLoading ? (
              <div className={GRID}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={GRID}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} isEvent />
                ))}
              </div>
            ) : (
              <div className="border border-line bg-paper">
                <EmptyState
                  icon={<Tag size={28} />}
                  title="No offers match these filters"
                  hint="Promotions come and go — try widening the price range or clearing a filter."
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

            <Pager page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </Container>
    </div>
  );
}
