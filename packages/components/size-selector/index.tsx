'use client';
import React from 'react';
import { Controller } from 'react-hook-form';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const SizeSelector = ({ control, errors }: { control: any; errors: any }) => {
  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">Sizes</label>

      <Controller
        name="sizes"
        control={control}
        defaultValue={[]}
        render={({ field }) => {
          const selected: string[] = field.value || [];

          const toggle = (size: string) =>
            field.onChange(
              selected.includes(size)
                ? selected.filter((s) => s !== size)
                : [...selected, size]
            );

          return (
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => {
                const isActive = selected.includes(size);
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggle(size)}
                    aria-pressed={isActive}
                    className={`flex h-10 min-w-[2.75rem] items-center justify-center rounded-md px-3 text-sm font-semibold transition-all duration-150
                      outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]
                      ${isActive
                        ? 'border border-[#ff6f61] bg-[#ff6f61]/10 text-white shadow-[0_0_8px_rgba(255,111,97,0.35)]'
                        : 'border border-slate-700 text-slate-300 hover:border-[#ff6f61]/60 hover:text-white'}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          );
        }}
      />

      {errors?.sizes && (
        <p className="text-red-500 text-xs mt-1">{errors.sizes.message as string}</p>
      )}
    </div>
  );
};

export default SizeSelector;
