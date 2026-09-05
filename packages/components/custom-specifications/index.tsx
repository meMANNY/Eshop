'use client';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import Input from '../input';

const CustomSpecifications = ({ control, errors }: { control: any; errors: any }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom_specifications',
  });

  return (
    <div className="mt-2">
      <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--on-ink-muted)]">
        Custom Specifications
      </label>

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Controller
                name={`custom_specifications.${index}.name`}
                control={control}
                rules={{ required: 'Specification name is required' }}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. Battery Life" />
                )}
              />
              {errors?.custom_specifications?.[index]?.name && (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--neg)]">
                  {errors.custom_specifications[index].name.message as string}
                </p>
              )}
            </div>

            <div className="flex-1">
              <Controller
                name={`custom_specifications.${index}.value`}
                control={control}
                rules={{ required: 'Specification value is required' }}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g. 4000 mAh" />
                )}
              />
              {errors?.custom_specifications?.[index]?.value && (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--neg)]">
                  {errors.custom_specifications[index].value.message as string}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove specification"
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--ink-border)] text-[var(--on-ink-faint)] transition-colors duration-150 hover:border-[var(--neg)] hover:text-[var(--neg)]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => append({ name: '', value: '' })}
        className="mt-3 flex items-center gap-2 border border-dashed border-[var(--ink-border)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--on-ink-muted)] transition-colors duration-150 hover:border-[var(--terra)] hover:text-[var(--terra)]"
      >
        <Plus size={16} />
        Add Specification
      </button>
    </div>
  );
};

export default CustomSpecifications;
