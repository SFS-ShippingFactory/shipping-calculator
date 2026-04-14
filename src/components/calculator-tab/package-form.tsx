'use client'

import { Input, Select } from 'rizzui'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { UnitToggle } from '../shared/unit-toggle'
import { getUniqueCountries } from '@/lib/calculator'
import { COUNTRY_NAMES } from '@/lib/constants'
import type { DimensionUnit, WeightUnit, Frequency } from '@/lib/types'

const frequencyOptions = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Per day' },
  { value: 'monthly', label: 'Per month' },
]

export function PackageForm() {
  const {
    carriers,
    packageInput,
    carrierFilter,
    countryFilter,
    setPackageInput,
    setActivePreset,
    setCarrierFilter,
    setCountryFilter,
  } = useShippingCalculatorStore()

  const carrierOptions = [
    { value: 'all', label: 'All Carriers' },
    ...Object.values(carriers).map((c) => ({ value: c.id, label: c.name })),
  ]

  const countries = getUniqueCountries(carriers)
  const countryOptions = [
    { value: 'all', label: 'All Countries' },
    ...countries.map((code) => ({ value: code, label: COUNTRY_NAMES[code] || code })),
  ]

  const handleDimChange = (field: 'length' | 'width' | 'height' | 'weight', value: string) => {
    setActivePreset('custom')
    setPackageInput({ [field]: parseFloat(value) || 0 })
  }

  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-end gap-2">
          <Input
            label="Length"
            type="number"
            step="0.1"
            size="sm"
            value={packageInput.length || ''}
            onChange={(e) => handleDimChange('length', e.target.value)}
            className="w-24"
            inputClassName="text-center"
          />
          <span className="pb-2 text-gray-400">×</span>
          <Input
            label="Width"
            type="number"
            step="0.1"
            size="sm"
            value={packageInput.width || ''}
            onChange={(e) => handleDimChange('width', e.target.value)}
            className="w-24"
            inputClassName="text-center"
          />
          <span className="pb-2 text-gray-400">×</span>
          <Input
            label="Height"
            type="number"
            step="0.1"
            size="sm"
            value={packageInput.height || ''}
            onChange={(e) => handleDimChange('height', e.target.value)}
            className="w-24"
            inputClassName="text-center"
          />
        </div>
        <UnitToggle
          options={[
            { value: 'cm', label: 'cm' },
            { value: 'in', label: 'in' },
          ]}
          value={packageInput.dimUnit}
          onChange={(v) => setPackageInput({ dimUnit: v as DimensionUnit })}
          className="mb-0.5"
        />
      </div>

      {/* Weight + Qty + Frequency */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-end gap-2">
          <Input
            label="Weight"
            type="number"
            step="0.01"
            size="sm"
            value={packageInput.weight || ''}
            onChange={(e) => handleDimChange('weight', e.target.value)}
            className="w-28"
            inputClassName="text-center"
          />
          <UnitToggle
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'g', label: 'g' },
            ]}
            value={packageInput.weightUnit}
            onChange={(v) => setPackageInput({ weightUnit: v as WeightUnit })}
            className="mb-0.5"
          />
        </div>
        <Input
          label="Qty"
          type="number"
          min={1}
          size="sm"
          value={packageInput.quantity || ''}
          onChange={(e) => setPackageInput({ quantity: parseInt(e.target.value) || 1 })}
          className="w-20"
          inputClassName="text-center"
        />
        <Select
          label="Frequency"
          size="sm"
          options={frequencyOptions}
          value={frequencyOptions.find((o) => o.value === packageInput.frequency)}
          onChange={(opt: any) => setPackageInput({ frequency: opt?.value as Frequency })}
          className="w-32"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Carrier"
          size="sm"
          options={carrierOptions}
          value={carrierOptions.find((o) => o.value === carrierFilter)}
          onChange={(opt: any) => setCarrierFilter(opt?.value ?? 'all')}
          className="w-48"
        />
        <Select
          label="Country"
          size="sm"
          options={countryOptions}
          value={countryOptions.find((o) => o.value === countryFilter)}
          onChange={(opt: any) => setCountryFilter(opt?.value ?? 'all')}
          className="w-48"
        />
      </div>
    </div>
  )
}
