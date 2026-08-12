"use client";

import React from "react";

const staticData = [
  { name: "Phone", value: 45 },
  { name: "Tablet", value: 25 },
  { name: "Computer", value: 30 },
];

/**
 * Three shares of one total, and the reader's question is "which is biggest, and
 * by how much" — a length comparison against a common baseline answers that far
 * better than three arcs, which is what this was.
 *
 * Because each bar carries its own name and percentage, colour encodes nothing
 * here, so the chart needs one hue instead of the green/amber/blue trio it had.
 * That trio was also borrowing the reserved status colours, so a device category
 * read like a payment state.
 */
export default function DeviceUsagePie() {
  const total = staticData.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...staticData.map((d) => d.value));

  return (
    <section className="rounded-panel border border-rule bg-panel shadow-panel">
      <header className="border-b border-rule px-5 py-4">
        <h2 className="text-[15px] font-semibold text-white">Device usage</h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          How buyers reach your shop
        </p>
      </header>

      <div className="space-y-5 px-5 py-5">
        {staticData.map((d) => {
          const share = Math.round((d.value / total) * 100);
          return (
            <div key={d.name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm text-[var(--text)]">{d.name}</span>
                <span className="figure text-sm text-[var(--muted)]">{share}%</span>
              </div>
              {/* The track spans the full width, so every bar is read against the
                  same baseline and the same maximum. */}
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-raised"
                role="img"
                aria-label={`${d.name}: ${share} percent`}
              >
                <div
                  className="h-full rounded-full bg-data transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
