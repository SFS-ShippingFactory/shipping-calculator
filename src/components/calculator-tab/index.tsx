'use client'

import { useMemo } from 'react'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import {
  normalizeInputs,
  calculateAll,
  getComparisonSummary,
} from '@/lib/calculator'
import { PackageForm } from './package-form'
import { QuickPresets } from './quick-presets'
import { ResultCards } from './result-cards'
import { ResultSummaryBanner } from './result-summary-banner'

export function CalculatorTab() {
  const {
    carriers,
    packageInput,
    carrierFilter,
    countryFilter,
    selectedServices,
  } = useShippingCalculatorStore()

  const results = useMemo(() => {
    const { l, w, h, weight } = normalizeInputs(
      packageInput.length,
      packageInput.width,
      packageInput.height,
      packageInput.weight,
      packageInput.dimUnit,
      packageInput.weightUnit
    )

    if (l <= 0 && w <= 0 && h <= 0 && weight <= 0) return []

    const all = calculateAll(carriers, l, w, h, weight, carrierFilter, countryFilter)
    return all.filter((r) => selectedServices.includes(r.serviceId))
  }, [carriers, packageInput, carrierFilter, countryFilter, selectedServices])

  const summary = useMemo(() => getComparisonSummary(results), [results])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <QuickPresets />
        <div className="mt-4">
          <PackageForm />
        </div>
      </div>

      <ResultSummaryBanner summary={summary} totalResults={results.length} />

      <ResultCards
        results={results}
        summary={summary}
        quantity={packageInput.quantity}
        frequency={packageInput.frequency}
      />
    </div>
  )
}
