'use client'

import { Input, Select, Switch } from 'rizzui'
import { PiWarningDiamondBold } from 'react-icons/pi'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { UnitToggle } from '../shared/unit-toggle'
import { getUniqueCountries } from '@/lib/calculator'
import { COUNTRY_NAMES } from '@/lib/constants'
import { cn } from '@/lib/cn'
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
    selectedCarriers,
    countryFilter,
    showHazmat,
    setPackageInput,
    setActivePreset,
    toggleCarrierFilter,
    selectAllCarrierFilters,
    setCountryFilter,
    setShowHazmat,
  } = useShippingCalculatorStore()

  const carrierList = Object.values(carriers)
  const allSelected = selectedCarriers.length === carrierList.length

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
    <div className="space-y-5">
      {/* Row 1: Dimensions */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500">Package Dimensions</label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            step="0.1"
            size="sm"
            placeholder="L"
            value={packageInput.length || ''}
            onChange={(e) => handleDimChange('length', e.target.value)}
            className="w-20"
            inputClassName="text-center"
          />
          <span className="text-gray-300">×</span>
          <Input
            type="number"
            step="0.1"
            size="sm"
            placeholder="W"
            value={packageInput.width || ''}
            onChange={(e) => handleDimChange('width', e.target.value)}
            className="w-20"
            inputClassName="text-center"
          />
          <span className="text-gray-300">×</span>
          <Input
            type="number"
            step="0.1"
            size="sm"
            placeholder="H"
            value={packageInput.height || ''}
            onChange={(e) => handleDimChange('height', e.target.value)}
            className="w-20"
            inputClassName="text-center"
          />
          <UnitToggle
            options={[
              { value: 'cm', label: 'cm' },
              { value: 'in', label: 'in' },
            ]}
            value={packageInput.dimUnit}
            onChange={(v) => setPackageInput({ dimUnit: v as DimensionUnit })}
          />
          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <Input
            type="number"
            step="0.01"
            size="sm"
            placeholder="Weight"
            value={packageInput.weight || ''}
            onChange={(e) => handleDimChange('weight', e.target.value)}
            className="w-24"
            inputClassName="text-center"
          />
          <UnitToggle
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'g', label: 'g' },
            ]}
            value={packageInput.weightUnit}
            onChange={(v) => setPackageInput({ weightUnit: v as WeightUnit })}
          />
          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <Input
            type="number"
            min={1}
            size="sm"
            placeholder="Qty"
            value={packageInput.quantity || ''}
            onChange={(e) => setPackageInput({ quantity: parseInt(e.target.value) || 1 })}
            className="w-16"
            inputClassName="text-center"
          />
          <Select
            size="sm"
            options={frequencyOptions}
            value={frequencyOptions.find((o) => o.value === packageInput.frequency)}
            onChange={(opt: any) => setPackageInput({ frequency: opt?.value as Frequency })}
            className="w-28"
          />
        </div>
      </div>

      {/* Row 2: Filters — Carriers (multi-select chips) + Country + Hazmat */}
      <div className="flex flex-wrap items-start gap-4">
        {/* Carrier multi-select */}
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Carriers</label>
            <button
              type="button"
              onClick={() => {
                if (allSelected) {
                  carrierList.forEach((c) => {
                    if (selectedCarriers.includes(c.id)) toggleCarrierFilter(c.id)
                  })
                } else {
                  selectAllCarrierFilters()
                }
              }}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {carrierList.map((carrier) => {
              const isOn = selectedCarriers.includes(carrier.id)
              return (
                <button
                  key={carrier.id}
                  type="button"
                  onClick={() => toggleCarrierFilter(carrier.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    isOn
                      ? 'border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isOn ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                  {carrier.name}
                  <span className="text-[10px] opacity-60">
                    ({carrier.services.length})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Country + Hazmat */}
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Country</label>
            <Select
              size="sm"
              options={countryOptions}
              value={countryOptions.find((o) => o.value === countryFilter)}
              onChange={(opt: any) => setCountryFilter(opt?.value ?? 'all')}
              className="w-40"
            />
          </div>
          <div className="pb-0.5">
            <button
              type="button"
              onClick={() => setShowHazmat(!showHazmat)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                showHazmat
                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  : 'border-gray-200 bg-white text-gray-400 line-through dark:border-gray-700 dark:bg-gray-800'
              )}
              title={showHazmat ? 'Hazmat/DG services are visible — click to hide' : 'Hazmat/DG services are hidden — click to show'}
            >
              <PiWarningDiamondBold className="size-3.5" />
              Hazmat/DG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
