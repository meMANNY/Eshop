'use client';
import React from 'react';
import { Controller } from 'react-hook-form';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/*
  Square chips in the mono voice, selected by inversion rather than by a tinted
  fill with a coral glow — the glow was the single most anti-editorial thing in
  these shared components, and it is the one detail the theme replaced outright.
*/
const SizeSelector = ({ control, errors }: { control: any; errors: any }) => {
  return (
    <div className="mt-2">
      <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--on-ink-muted)]">
        Sizes
      </label>

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
                    className={`flex h-10 min-w-[2.75rem] items-center justify-center border px-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-150 ${
                      isActive
                        ? 'border-[var(--on-ink)] bg-[var(--paper)] text-[var(--ink)]'
                        : 'border-[var(--ink-border)] text-[var(--on-ink-muted)] hover:border-[var(--on-ink)] hover:text-[var(--on-ink)]'
                    }`}
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
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--neg)]">
          {errors.sizes.message as string}
        </p>
      )}
    </div>
  );
};

export default SizeSelector;
