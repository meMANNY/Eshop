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
      <label className="block font-semibold text-gray-300 mb-1">
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
                <p className="text-red-500 text-xs mt-1">
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
                <p className="text-red-500 text-xs mt-1">
                  {errors.custom_specifications[index].value.message as string}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove specification"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-400 transition-colors duration-150 hover:border-red-500 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => append({ name: '', value: '' })}
        className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:border-[#ff6f61] hover:text-[#ff6f61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
      >
        <Plus size={16} />
        Add Specification
      </button>
    </div>
  );
};

export default CustomSpecifications;
