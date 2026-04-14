'use client'

import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Button, Select, Switch, Text } from 'rizzui'
import { serviceFormSchema, type ServiceFormValues } from '@/validators/shipping-calculator.schema'
import { RateTierEditor } from './rate-tier-editor'
import { COUNTRY_NAMES } from '@/lib/constants'
import type { Service } from '@/lib/types'

const countryOptions = Object.entries(COUNTRY_NAMES).map(([code, name]) => ({
  value: code,
  label: `${name} (${code})`,
}))

const typeOptions = [
  { value: 'Express', label: 'Express' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Economy', label: 'Economy' },
  { value: 'DDP', label: 'DDP' },
  { value: 'DDP-DG', label: 'DDP-DG (Dangerous Goods)' },
]

interface ServiceFormProps {
  service?: Service
  onSubmit: (values: ServiceFormValues) => void
  onCancel: () => void
}

export function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const methods = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: service
      ? {
          name: service.name,
          code: service.code,
          country: service.country,
          zone: service.zone ?? '',
          deliveryDays: service.deliveryDays,
          type: service.type,
          isActive: service.isActive,
          volumetricDivisor: service.volumetricDivisor,
          maxWeight: service.maxWeight,
          maxDimensions: service.maxDimensions,
          maxVolume: service.maxVolume,
          maxDimSum: service.maxDimSum,
          oversizeSurcharge: service.oversizeSurcharge,
          maxCompensation: service.maxCompensation,
          rates: service.rates,
        }
      : {
          name: '',
          code: '',
          country: 'CA',
          zone: '',
          deliveryDays: { min: 7, max: 14 },
          type: 'Express',
          isActive: true,
          volumetricDivisor: 8000,
          maxWeight: 30,
          maxDimensions: { l: 55, w: 40, h: 35 },
          maxVolume: 0.077,
          oversizeSurcharge: 0,
          maxCompensation: { beforeTracking: 200, afterTracking: 200 },
          rates: [{ minWeight: 0, maxWeight: 1, ratePerKg: 50, handlingFee: 20 }],
        },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = methods

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Service Name"
            placeholder="e.g. AU Zone 1 — General"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Service Code"
            placeholder="e.g. CAAU-GEN-Z1"
            {...register('code')}
            error={errors.code?.message}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Country"
                options={countryOptions}
                value={countryOptions.find((o) => o.value === value)}
                onChange={(opt: any) => onChange(opt?.value)}
                error={errors.country?.message}
              />
            )}
          />
          <Input
            label="Zone (optional)"
            placeholder="e.g. Zone 1"
            {...register('zone')}
          />
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Service Type"
                options={typeOptions}
                value={typeOptions.find((o) => o.value === value)}
                onChange={(opt: any) => onChange(opt?.value)}
                error={errors.type?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input
            label="Min Delivery (days)"
            type="number"
            {...register('deliveryDays.min', { valueAsNumber: true })}
            error={errors.deliveryDays?.min?.message}
          />
          <Input
            label="Max Delivery (days)"
            type="number"
            {...register('deliveryDays.max', { valueAsNumber: true })}
            error={errors.deliveryDays?.max?.message}
          />
          <Input
            label="Vol. Divisor"
            type="number"
            {...register('volumetricDivisor', { valueAsNumber: true })}
            error={errors.volumetricDivisor?.message}
          />
          <Input
            label="Max Weight (kg)"
            type="number"
            step="0.1"
            {...register('maxWeight', { valueAsNumber: true })}
            error={errors.maxWeight?.message}
          />
        </div>

        <div>
          <Text className="mb-2 text-sm font-semibold">Max Dimensions (cm)</Text>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Length"
              type="number"
              step="0.1"
              {...register('maxDimensions.l', { valueAsNumber: true })}
              error={errors.maxDimensions?.l?.message}
            />
            <Input
              label="Width"
              type="number"
              step="0.1"
              {...register('maxDimensions.w', { valueAsNumber: true })}
              error={errors.maxDimensions?.w?.message}
            />
            <Input
              label="Height"
              type="number"
              step="0.1"
              {...register('maxDimensions.h', { valueAsNumber: true })}
              error={errors.maxDimensions?.h?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input
            label="Max Volume (m³)"
            type="number"
            step="0.001"
            {...register('maxVolume', { valueAsNumber: true })}
            error={errors.maxVolume?.message}
          />
          <Input
            label="Max Dim Sum (cm)"
            type="number"
            placeholder="Optional"
            {...register('maxDimSum', { valueAsNumber: true })}
          />
          <Input
            label="Oversize Surcharge (RMB)"
            type="number"
            {...register('oversizeSurcharge', { valueAsNumber: true })}
          />
          <div className="flex items-end pb-1">
            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label="Active"
                  checked={value}
                  onChange={onChange}
                />
              )}
            />
          </div>
        </div>

        <div>
          <Text className="mb-2 text-sm font-semibold">Compensation Limits (RMB)</Text>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Before Tracking"
              type="number"
              {...register('maxCompensation.beforeTracking', { valueAsNumber: true })}
            />
            <Input
              label="After Tracking"
              type="number"
              {...register('maxCompensation.afterTracking', { valueAsNumber: true })}
            />
          </div>
        </div>

        <RateTierEditor />

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {service ? 'Update Service' : 'Add Service'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
