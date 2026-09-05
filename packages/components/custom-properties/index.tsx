'use client';
import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Controller } from 'react-hook-form';

type Property = { label: string; values: string[] };

const fieldClass =
  'w-full  border border-[var(--ink-border)] bg-transparent px-3 py-2 text-sm text-[var(--on-ink)] outline-none transition-colors placeholder:text-[var(--on-ink-faint)] focus:border-[var(--terra)]';

const CustomProperties = ({ control, errors }: { control: any; errors: any }) => {
  const [newLabel, setNewLabel] = useState('');
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});

  return (
    <div className="mt-2">
      <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--on-ink-muted)]">Custom Properties</label>

      <Controller
        name="custom_properties"
        control={control}
        defaultValue={[]}
        render={({ field }) => {
          const properties: Property[] = field.value || [];

          const addProperty = () => {
            const label = newLabel.trim();
            if (!label) return;
            field.onChange([...properties, { label, values: [] }]);
            setNewLabel('');
          };

          const removeProperty = (index: number) =>
            field.onChange(properties.filter((_, i) => i !== index));

          const addValue = (index: number) => {
            const val = (valueDrafts[index] || '').trim();
            if (!val) return;
            field.onChange(
              properties.map((p, i) =>
                i === index && !p.values.includes(val)
                  ? { ...p, values: [...p.values, val] }
                  : p
              )
            );
            setValueDrafts((d) => ({ ...d, [index]: '' }));
          };

          const removeValue = (index: number, val: string) =>
            field.onChange(
              properties.map((p, i) =>
                i === index ? { ...p, values: p.values.filter((v) => v !== val) } : p
              )
            );

          return (
            <div className="flex flex-col gap-3">
              {/* Existing properties, each with its own set of values */}
              {properties.map((property, index) => (
                <div
                  key={index}
                  className="border border-[var(--ink-border)] bg-[var(--ink-soft)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--on-ink)]">
                      {property.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      aria-label={`Remove ${property.label} property`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--ink-border)] text-[var(--on-ink-faint)] transition-colors hover:border-[var(--neg)] hover:text-[var(--neg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neg"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Value chips */}
                  {property.values.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {property.values.map((val) => (
                        <span
                          key={val}
                          className="flex items-center gap-1.5 rounded-full bg-[var(--terra)]/10 px-3 py-1 text-xs font-medium text-[#FF6B35] ring-1 ring-[var(--terra)]/25"
                        >
                          {val}
                          <button
                            type="button"
                            onClick={() => removeValue(index, val)}
                            aria-label={`Remove value ${val}`}
                            className="text-[#FF6B35]/70 transition-colors hover:text-[var(--on-ink)]"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add a value to this property */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={valueDrafts[index] || ''}
                      onChange={(e) =>
                        setValueDrafts((d) => ({ ...d, [index]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addValue(index);
                        }
                      }}
                      placeholder={`Add a value for ${property.label}`}
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => addValue(index)}
                      aria-label="Add value"
                      className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--ink-border)] text-[var(--on-ink-muted)] transition-colors hover:border-[var(--terra)] hover:text-[var(--terra)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--terra)]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Create a new property */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addProperty();
                    }
                  }}
                  placeholder="Property name (e.g. Material, Warranty Type)"
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={addProperty}
                  className="flex shrink-0 items-center gap-2 border border-dashed border-[var(--ink-border)] px-3 py-2 text-sm font-medium text-[var(--on-ink-muted)] transition-colors hover:border-[var(--terra)] hover:text-[var(--terra)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--terra)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
                >
                  <Plus size={16} />
                  Add Property
                </button>
              </div>
            </div>
          );
        }}
      />

      {errors?.custom_properties && (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--neg)]">
          {errors.custom_properties.message as string}
        </p>
      )}
    </div>
  );
};

export default CustomProperties;
