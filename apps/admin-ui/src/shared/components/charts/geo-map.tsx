"use client";

import { geoEqualEarth, geoPath } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";

// `react-simple-maps` is a thin wrapper over exactly these two libraries, and
// its peer range stops at React 18. Projecting and drawing the paths here
// directly costs ~40 lines and keeps this component off React's version churn.
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WIDTH = 800;
const HEIGHT = 600;

const countryData = [
  { name: "United States of America", users: 120, sellers: 30 },
  { name: "India", users: 100, sellers: 20 },
  { name: "United Kingdom", users: 85, sellers: 15 },
  { name: "Germany", users: 70, sellers: 10 },
  { name: "Egypt", users: 160, sellers: 5 },
  { name: "Syria", users: 6, sellers: 5 },
  { name: "China", users: 65, sellers: 5 },
];

// User count is a sequential quantity, so the ramp is one hue at rising
// strength. The previous green/blue/yellow set read as three categories.
//
// Every step is checked to clear 3:1 against the panel behind it, so the lowest
// band still reads as data rather than blending into "no data" — the darker ramp
// this replaced put its bottom step at 2.2:1.
const BANDS = [
  { min: 100, fill: "#6da7ec", label: "100+" },
  { min: 70, fill: "#3987e5", label: "70–99" },
  { min: 1, fill: "#256abf", label: "1–69" },
];

const EMPTY_FILL = "#1a1f2b";

function getFill(users: number) {
  return BANDS.find((band) => users >= band.min)?.fill ?? EMPTY_FILL;
}

type Tooltip = {
  name: string;
  users: number;
  sellers: number;
  x: number;
  y: number;
};

export default function GeoMap() {
  const [features, setFeatures] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(geoUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Map data returned ${res.status}`);
        return res.json();
      })
      .then((topology: any) => {
        if (cancelled) return;
        const collection: any = feature(topology, topology.objects.countries);
        setFeatures(collection.features);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load map data", err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toPath = useMemo(() => {
    const projection = geoEqualEarth()
      .scale(150)
      .translate([WIDTH / 2, HEIGHT / 2]);
    return geoPath(projection);
  }, []);

  const byName = useMemo(
    () => new Map(countryData.map((c) => [c.name, c])),
    []
  );

  return (
    <section className="relative rounded-panel border border-rule bg-panel shadow-panel">
      <header className="border-b border-rule px-5 py-4">
        <h2 className="text-[15px] font-semibold text-white">
          Where your marketplace is
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Buyers and sellers by country
        </p>
      </header>

      {status === "error" ? (
        <p className="px-5 py-16 text-center text-sm text-[var(--muted)]">
          Map data didn&apos;t load. Check your connection and refresh.
        </p>
      ) : status === "loading" ? (
        <div className="px-5 py-16">
          <div className="mx-auto h-3 w-40 animate-pulse rounded bg-raised motion-reduce:animate-none" />
        </div>
      ) : (
        <div className="p-5">
          <div className="relative">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full"
              role="img"
              aria-label="World map shaded by number of users per country"
            >
              <g>
                {features.map((geo, i) => {
                  const match = byName.get(geo.properties?.name);
                  return (
                    <path
                      key={geo.id ?? i}
                      d={toPath(geo) ?? undefined}
                      fill={match ? getFill(match.users) : EMPTY_FILL}
                      /* The hairline is the panel colour, so shapes separate
                         without a stroke that reads as its own line. */
                      stroke="#12161f"
                      strokeWidth={0.5}
                      className={
                        match
                          ? "cursor-pointer transition-opacity hover:opacity-80 motion-reduce:transition-none"
                          : undefined
                      }
                      onMouseMove={(e) => {
                        if (!match) return;
                        setTooltip({
                          name: match.name,
                          users: match.users,
                          sellers: match.sellers,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </g>
            </svg>

            {tooltip && (
              <div
                className="pointer-events-none fixed z-50 rounded-lg border border-rule bg-raised px-3 py-2 text-xs shadow-pop"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y + 12,
                  whiteSpace: "nowrap",
                }}
              >
                <div className="font-semibold text-white">{tooltip.name}</div>
                <div className="mt-1 text-[var(--muted)]">
                  Users{" "}
                  <span className="figure text-[var(--text)]">
                    {tooltip.users}
                  </span>
                </div>
                <div className="text-[var(--muted)]">
                  Sellers{" "}
                  <span className="figure text-[var(--text)]">
                    {tooltip.sellers}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* A choropleth without a legend is unreadable — the old one had none. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
            <span className="text-label font-semibold uppercase text-[var(--faint)]">
              Users
            </span>
            {BANDS.map((band) => (
              <span key={band.label} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: band.fill }}
                />
                <span className="figure">{band.label}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-rule"
                style={{ backgroundColor: EMPTY_FILL }}
              />
              None
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
