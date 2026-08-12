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
const BANDS = [
  { min: 100, fill: "#38bdf8", label: "100+" },
  { min: 70, fill: "#0284c7", label: "70–99" },
  { min: 1, fill: "#075985", label: "1–69" },
];

const EMPTY_FILL = "#1f2937";

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
    <div className="relative rounded-xl bg-[#111] p-4">
      <h2 className="font-semibold text-white">User &amp; Seller Distribution</h2>
      <p className="mt-1 text-sm text-gray-400">
        Visual breakdown of global user &amp; seller activity
      </p>

      {status === "error" ? (
        <p className="py-16 text-center text-sm text-gray-400">
          Map data didn&apos;t load. Check your connection and refresh.
        </p>
      ) : status === "loading" ? (
        <div className="py-16">
          <div className="mx-auto h-3 w-40 animate-pulse rounded bg-gray-800 motion-reduce:animate-none" />
        </div>
      ) : (
        <>
          <div className="relative mt-4">
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
                      stroke="#111"
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
                className="pointer-events-none fixed z-50 rounded-md border border-gray-700 bg-[#222] px-3 py-2 text-xs shadow-lg"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y + 12,
                  whiteSpace: "nowrap",
                }}
              >
                <div className="font-semibold text-white">{tooltip.name}</div>
                <div className="mt-1 text-gray-400">
                  Users <span className="text-gray-200">{tooltip.users}</span>
                </div>
                <div className="text-gray-400">
                  Sellers <span className="text-gray-200">{tooltip.sellers}</span>
                </div>
              </div>
            )}
          </div>

          {/* A choropleth without a legend is unreadable — the old one had none. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
            <span className="font-medium text-gray-300">Users</span>
            {BANDS.map((band) => (
              <span key={band.label} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: band.fill }}
                />
                {band.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: EMPTY_FILL }}
              />
              None
            </span>
          </div>
        </>
      )}
    </div>
  );
}
