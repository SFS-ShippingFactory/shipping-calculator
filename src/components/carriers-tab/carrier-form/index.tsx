'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button, Textarea, Switch } from 'rizzui'
import { carrierFormSchema, type CarrierFormValues } from '@/validators/shipping-calculator.schema'
import type { Carrier } from '@/lib/types'

interface CarrierFormProps {
  carrier?: Carrier
  onSubmit: (values: CarrierFormValues) => void
  onCancel: () => void
}

export function CarrierForm({ carrier, onSubmit, onCancel }: CarrierFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CarrierFormValues>({
    resolver: zodResolver(carrierFormSchema),
    defaultValues: carrier
      ? {
          name: carrier.name,
          effectiveDate: carrier.effectiveDate,
          rating: carrier.rating,
          notes: carrier.notes,
          isActive: carrier.isActive,
        }
      : {
          name: '',
          effectiveDate: new Date().toISOString().slice(0, 10),
          rating: 0,
          notes: '',
          isActive: true,
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Carrier Name"
        placeholder="e.g. DHL Express"
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="Effective Date"
        type="date"
        {...register('effectiveDate')}
        error={errors.effectiveDate?.message}
      />
      <Textarea
        label="Notes"
        placeholder="Pros, cons, special conditions..."
        {...register('notes')}
        rows={3}
      />
      <Controller
        control={control}
        name="isActive"
        render={({ field: { onChange, value } }) => (
          <Switch label="Active" checked={value} onChange={onChange} />
        )}
      />
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {carrier ? 'Update Carrier' : 'Create Carrier'}
        </Button>
      </div>
    </form>
  )
}
