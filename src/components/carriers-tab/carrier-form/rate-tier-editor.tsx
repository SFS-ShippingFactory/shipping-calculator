'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input, Button, ActionIcon } from 'rizzui'
import { PiPlusBold, PiTrashBold } from 'react-icons/pi'
import type { ServiceFormValues } from '@/validators/shipping-calculator.schema'

export function RateTierEditor() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ServiceFormValues>()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rates',
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Rate Tiers</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              minWeight: fields.length > 0 ? (fields[fields.length - 1] as any).maxWeight || 0 : 0,
              maxWeight: 0,
              ratePerKg: 0,
              handlingFee: 0,
            })
          }
          className="gap-1"
        >
          <PiPlusBold className="size-3.5" />
          Add Tier
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <span>Min Weight (kg)</span>
            <span>Max Weight (kg)</span>
            <span>Rate/kg (RMB)</span>
            <span>Handling (RMB)</span>
            <span className="w-8" />
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-start gap-2 border-b border-gray-100 px-3 py-2 last:border-0 dark:border-gray-800"
            >
              <Input
                type="number"
                step="0.01"
                size="sm"
                {...register(`rates.${index}.minWeight`, { valueAsNumber: true })}
                error={errors.rates?.[index]?.minWeight?.message}
              />
              <Input
                type="number"
                step="0.01"
                size="sm"
                {...register(`rates.${index}.maxWeight`, { valueAsNumber: true })}
                error={errors.rates?.[index]?.maxWeight?.message}
              />
              <Input
                type="number"
                step="0.01"
                size="sm"
                {...register(`rates.${index}.ratePerKg`, { valueAsNumber: true })}
                error={errors.rates?.[index]?.ratePerKg?.message}
              />
              <Input
                type="number"
                step="0.01"
                size="sm"
                {...register(`rates.${index}.handlingFee`, { valueAsNumber: true })}
                error={errors.rates?.[index]?.handlingFee?.message}
              />
              <ActionIcon
                type="button"
                variant="text"
                color="danger"
                size="sm"
                onClick={() => remove(index)}
                className="mt-1"
              >
                <PiTrashBold className="size-4" />
              </ActionIcon>
            </div>
          ))}
        </div>
      )}

      {errors.rates?.message && (
        <p className="text-xs text-red-500">{errors.rates.message}</p>
      )}
    </div>
  )
}
