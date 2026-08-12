"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type OrdersData = { month: string; count: number }[];

const staticData: OrdersData = [
  { month: "Jan", count: 20 },
  { month: "Feb", count: 25 },
  { month: "Mar", count: 15 },
  { month: "Apr", count: 30 },
  { month: "May", count: 45 },
  { month: "Jun", count: 40 },
];

export default function SalesChart({ ordersData }: { ordersData?: OrdersData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = ordersData || staticData;

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      foreColor: "#94a3b8",
      background: "transparent",
      fontFamily: "var(--font-sans), sans-serif",
      animations: { enabled: true, speed: 600 },
    },
    /*
      One data hue, kept clear of the coral chrome and of the reserved status
      colours so a mark on a chart can never be read as a state. Coral is what
      buttons and the active nav wear; it does not double as a series colour.
    */
    colors: ["#3987e5"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        opacityFrom: 0.32,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.06)",
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 4 },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "12px" },
        formatter: (val: number) => String(Math.round(val)),
      },
    },
    tooltip: {
      theme: "dark",
      // The series counts orders. It was labelled "Revenue" and formatted as
      // `$…k`, which put a currency symbol on a number that was never money.
      y: { formatter: (val: number) => `${Math.round(val)} orders` },
    },
    dataLabels: { enabled: false },
    // A single series needs no legend — the panel heading already names it.
    legend: { show: false },
    markers: { size: 0, hover: { size: 5 } },
  };

  const series = [{ name: "Orders", data: data.map((d) => d.count) }];

  return (
    <section className="rounded-panel border border-rule bg-panel shadow-panel">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Orders</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Orders placed in your shop per month
          </p>
        </div>
        <span className="text-label font-semibold uppercase text-[var(--faint)]">
          Last 6 months
        </span>
      </header>
      <div className="px-2 pb-2 pt-4">
        {/* Rendering only after mount keeps Apex off the server, but the wrapper
            holds its height either way so the dashboard doesn't jump. */}
        <div className="min-h-[260px]">
          {mounted ? (
            <Chart options={options} series={series} type="area" height={260} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
