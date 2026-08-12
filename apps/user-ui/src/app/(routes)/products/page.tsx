"use client";

import ProductCard from "@/shared/components/cards/product-card";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PackageSearch, SearchX, X } from "lucide-react";
import { Range } from "react-range";
import {
  Button,
  CardSkeleton,
  Container,
  Crumbs,
  EmptyState,
  Figure,
  PageHeading,
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
    <main className="pb-16">
      <Container className="pt-8">
        <Crumbs trail={[{ label: term ? `Search: ${term}` : "All products" }]} />
        <div className="mt-4">
          <PageHeading
            title={term ? `Results for “${term}”` : "All products"}
            meta={
              isProductLoading ? (
                "Loading…"
              ) : (
                <>
                  <Figure>{visible.length}</Figure> product
                  {visible.length === 1 ? "" : "s"}
                  {filterCount > 0 ? " matching your filters" : ""}
                </>
              )
            }
            actions={
              filterCount > 0 ? (
                <Button variant="ghost" onClick={clearAll}>
                  <X size={15} aria-hidden="true" />
                  Clear filters
                </Button>
              ) : null
            }
          />
        </div>

        <div className="flex w-full flex-col gap-8 lg:flex-row">
          <aside className="h-max w-full shrink-0 space-y-6 rounded-card border border-rule bg-surface p-5 shadow-card lg:w-[260px]">
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
                        className="relative h-1.5 cursor-pointer rounded-full bg-rule"
                        style={{ ...props.style }}
                      >
                        <div
                          className="absolute h-full rounded-full bg-coral"
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
                        className="h-[18px] w-[18px] rounded-full border-2 border-surface bg-coral shadow-card"
                      />
                    );
                  }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="figure text-sm text-ink-muted">
                  ${tempPriceRange[0]} – ${tempPriceRange[1]}
                </span>
                <Button
                  variant="primary"
                  className="px-3 py-1.5"
                  onClick={() => {
                    setPriceRange(tempPriceRange);
                    setPage(1);
                  }}
                >
                  Apply
                </Button>
              </div>
            </FilterGroup>

            <FilterGroup title="Category" bordered>
              {isLoading ? (
                <p className="text-sm text-ink-faint">Loading…</p>
              ) : (
                <ul className="space-y-0.5">
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
              <ul className="space-y-0.5">
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
              <ul className="space-y-0.5">
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {visible.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isEvent={product.starting_date}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-card border border-rule bg-surface">
                {/* The two empties need different next steps, so they say
                    different things. */}
                {term ? (
                  <EmptyState
                    icon={<SearchX size={28} />}
                    title={`Nothing matched “${term}”`}
                    hint="Try a shorter or more general term, or browse by department."
                    action={
                      <Button variant="ghost" onClick={clearAll}>
                        Clear search
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
                        <Button variant="ghost" onClick={clearAll}>
                          Clear filters
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
    </main>
  );
}

function FilterGroup({
  title,
  children,
  bordered,
}: {
  title: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? "border-t border-rule pt-5" : undefined}>
      <h3 className="mb-3 text-label font-semibold uppercase text-ink-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  swatch,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  swatch?: string;
}) {
  return (
    <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="cursor-pointer accent-coral"
      />
      {swatch ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-rule"
          style={{ backgroundColor: swatch }}
        />
      ) : null}
      <span className="capitalize">{label}</span>
    </label>
  );
}

/**
 * Windowed pagination. The old control rendered one button per page, so a
 * catalogue of fifty pages produced a fifty-button wall under the grid.
 */
function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
      <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - list[i - 1] > 1 ? (
            <span className="px-1 text-ink-faint">…</span>
          ) : null}
          <button
            onClick={() => onChange(p)}
            aria-current={page === p ? "page" : undefined}
            className={`min-w-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              page === p
                ? "border-coral bg-coral text-[#2b0f0a]"
                : "border-rule bg-surface text-ink-muted hover:border-coral hover:text-coral-ink"
            }`}
          >
            <span className="figure">{p}</span>
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </nav>
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
