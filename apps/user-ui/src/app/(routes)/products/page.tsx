"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PackageSearch, SearchX } from "lucide-react";
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

function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
    The header's search box sends people here with `?q=`, and the departments
    menu with `?category=`. Nothing on this page read either, so both controls
    landed on an unfiltered list. The category seeds the real backend filter; see
    the note on `term` below for what search can and can't do yet.
  */
  const term = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category");

  const [isProductLoading, setIsProductLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([MIN, MAX]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
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
    // Passed through so this filters server-side the moment the product service
    // understands it; until then the client-side narrowing below covers it.
    if (term) query.set("search", term);
    query.set("page", String(page));
    query.set("limit", "12");
    return query;
  };

  useEffect(() => {
    const query = buildQuery();

    // Keep `q` in the address bar — the old updateURL rebuilt the querystring
    // from the filters alone, so any search term was dropped on the first
    // filter change.
    const url = new URLSearchParams(query);
    if (term) url.set("q", term);
    router.replace(`/products?${decodeURIComponent(url.toString())}`);

    let cancelled = false;
    setIsProductLoading(true);
    axiosInstance
      .get(`product/api/get-filtered-products?${query.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.products);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch((err) => console.error("Failed to fetch filtered products.", err))
      .finally(() => !cancelled && setIsProductLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, selectedCategories, selectedColors, selectedSizes, page, term]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res.data.categories;
    },
    staleTime: 1000 * 60 * 30,
  });

  const visible = useMemo(() => {
    if (!term) return products;
    const needle = term.toLowerCase();
    return products.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(needle) ||
        p.category?.toLowerCase().includes(needle) ||
        p.Shop?.name?.toLowerCase().includes(needle)
    );
  }, [products, term]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
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
    router.replace("/products");
  };

  const filterCount =
    selectedCategories.length +
    selectedColors.length +
    selectedSizes.length +
    (priceRange[0] !== MIN || priceRange[1] !== MAX ? 1 : 0) +
    (term ? 1 : 0);

  return (
    <div className="pb-16">
      <Container className="pt-8">
        <Crumbs trail={[{ label: term ? `Search: ${term}` : "All products" }]} />

        <div className="mt-6">
          <PageHeading
            kicker={`/products${filterCount ? ` · ${filterCount} filters` : ""}`}
            title={term ? `Results for “${term}”` : "All products"}
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
            { key: "~/products", value: isProductLoading ? "loading…" : `${visible.length} results` },
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
            ) : visible.length > 0 ? (
              <div className={GRID}>
                {visible.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isEvent={product.starting_date}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-line bg-paper">
                {/* The two empties need different next steps, so they say
                    different things. */}
                {term ? (
                  <EmptyState
                    icon={<SearchX size={28} />}
                    title={`Nothing matched “${term}”`}
                    hint="Try a shorter or more general term, or browse by department."
                    action={
                      <Button variant="ghost" mono onClick={clearAll}>
                        clear search
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<PackageSearch size={28} />}
                    title="No products match these filters"
                    hint="Try widening the price range or clearing a filter."
                    action={
                      filterCount > 0 ? (
                        <Button variant="ghost" mono onClick={clearAll}>
                          clear filters
                        </Button>
                      ) : null
                    }
                  />
                )}
              </div>
            )}

            <Pager page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function Page() {
  /*
    `useSearchParams` needs a Suspense boundary or Next bails out of
    prerendering this route entirely.
  */
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </Container>
      }
    >
      <ProductsPage />
    </Suspense>
  );
}
