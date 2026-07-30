'use client';
import { Check, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { Controller } from 'react-hook-form';

// How many swatches to show before collapsing behind a "show more" toggle.
const VISIBLE_LIMIT = 12;

// A curated starting palette — neutrals first, then brand-friendly hues.
const DEFAULT_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#6b7280', // Gray
  '#ef4444', // Red
  '#ff6f61', // Coral
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#a16207', // Bronze
];

// A swatch that needs a visible border against the dark canvas (near-white fills).
const needsBorder = (hex: string) => {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 200;
};

// Readable check color for a given swatch (dark check on light fills, light on dark).
const checkOnLight = (hex: string) => {
  const c = hex.replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
};

const ColorSelector = ({ control, errors }: { control: any; errors: any }) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState('#ff6f61');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">Colors</label>

      <Controller
        name="colors"
        control={control}
        defaultValue={[]}
        render={({ field }) => {
          const selected: string[] = field.value || [];

          const toggle = (color: string) =>
            field.onChange(
              selected.includes(color)
                ? selected.filter((c) => c !== color)
                : [...selected, color]
            );

          const isValidHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(draft);

          const addCustom = () => {
            if (!isValidHex) return;
            // Normalize shorthand (#abc -> #aabbcc) so toggles/dupes compare cleanly.
            let hex = draft.toLowerCase();
            if (hex.length === 4) {
              hex = '#' + hex.slice(1).split('').map((ch) => ch + ch).join('');
            }
            if (!customColors.includes(hex) && !DEFAULT_COLORS.includes(hex)) {
              setCustomColors((prev) => [...prev, hex]);
            }
            if (!selected.includes(hex)) field.onChange([...selected, hex]);
            setDraft('#ff6f61');
            setShowPicker(false);
          };

          const allColors = [...DEFAULT_COLORS, ...customColors];
          const overLimit = allColors.length > VISIBLE_LIMIT;
          // Collapsed view shows the first N — but never hides a selected color.
          const visibleColors =
            expanded || !overLimit
              ? allColors
              : Array.from(
                  new Set([
                    ...allColors.slice(0, VISIBLE_LIMIT),
                    ...allColors.filter((c) => selected.includes(c)),
                  ])
                );
          const hiddenCount = allColors.length - visibleColors.length;

          return (
            <div className="flex flex-wrap items-center gap-3">
              {visibleColors.map((color) => {
                const isActive = selected.includes(color);
                return (
                  <button
                    type="button"
                    key={color}
                    onClick={() => toggle(color)}
                    aria-pressed={isActive}
                    aria-label={`Color ${color}${isActive ? ' (selected)' : ''}`}
                    title={color}
                    style={{ backgroundColor: color }}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150
                      outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]
                      ${needsBorder(color) ? 'ring-1 ring-inset ring-slate-500/40' : ''}
                      ${isActive
                        ? 'ring-2 ring-[#ff6f61] ring-offset-2 ring-offset-[#0f172a] scale-105'
                        : 'hover:scale-110'}`}
                  >
                    {isActive && (
                      <Check
                        size={16}
                        strokeWidth={3}
                        className={checkOnLight(color) ? 'text-slate-900' : 'text-white'}
                      />
                    )}
                  </button>
                );
              })}

              {/* Add-custom tile — the one place that opens the native picker. */}
              {showPicker ? (
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isValidHex ? draft : '#ff6f61'}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-full border-none bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                    aria-label="Pick a custom color"
                  />
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                    placeholder="#ff6f61"
                    spellCheck={false}
                    aria-label="Enter a hex color"
                    className={`w-24 rounded-md border bg-transparent px-2 py-1 text-sm text-white outline-none transition-colors
                      ${isValidHex ? 'border-slate-600 focus:border-[#ff6f61]' : 'border-red-500'}`}
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    disabled={!isValidHex}
                    className="rounded-md bg-[#ff6f61] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#e05a4d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  aria-label="Add a custom color"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate-600 text-slate-400 transition-colors duration-150 hover:border-[#ff6f61] hover:text-[#ff6f61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
                >
                  <Plus size={16} />
                </button>
              )}

              {/* Collapse control — only when there is something hidden or expanded. */}
              {overLimit && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-[#ff6f61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
                >
                  {expanded ? 'Show less' : `+${hiddenCount} more`}
                </button>
              )}
            </div>
          );
        }}
      />

      {errors?.colors && (
        <p className="text-red-500 text-xs mt-1">{errors.colors.message as string}</p>
      )}
    </div>
  );
};

export default ColorSelector;
