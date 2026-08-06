"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#0f131a]">
      {/* Soft coral glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-[#ff6f61]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#ff8a7d]/10 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-20 md:flex-row md:py-28">
        {/* Copy */}
        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6f61]/30 bg-[#ff6f61]/10 px-3 py-1 text-sm font-medium text-[#ff8a7d]">
            <ShoppingBag size={15} /> New season, new deals
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Shop the trends you{" "}
            <span className="text-[#ff6f61]">love</span>, delivered fast.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400 md:mx-0">
            Discover thousands of products from trusted sellers. Handpicked
            quality, unbeatable prices, and a checkout that just works.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-lg bg-[#ff6f61] px-6 py-3 font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d]"
            >
              Shop now <ArrowRight size={18} />
            </Link>
            <Link
              href="/offers"
              className="rounded-lg border border-slate-700 bg-white/[0.04] px-6 py-3 font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              View offers
            </Link>
          </div>
        </div>

        {/* Visual placeholder */}
        <div className="flex-1">
          <div className="relative mx-auto aspect-square w-full max-w-md rounded-2xl border border-slate-800 bg-[#141922] shadow-2xl">
            <div className="flex h-full w-full items-center justify-center text-slate-600">
              <ShoppingBag size={72} strokeWidth={1.2} />
            </div>
            <span className="absolute -bottom-4 left-6 rounded-lg bg-[#ff6f61] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ff6f61]/30">
              Up to 50% off
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
