import React from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

const SectionTitle = ({ title}: SectionTitleProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        {/* Coral marker — echoes the project's "you are here" accent. */}
        <span
          aria-hidden="true"
          className="h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]"
        />
        <h2 className="text-2xl font-semibold text-black md:text-3xl">
          {title}
        </h2>
      </div>
      {/* {subtitle && (
        <p className="mt-2 max-w-2xl text-slate-400">{subtitle}</p>
      )} */}
    </div>
  );
};

export default SectionTitle;
