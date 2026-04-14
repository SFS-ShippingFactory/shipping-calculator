'use client'

import { useMemo } from 'react'
import { Button, Text } from 'rizzui'
import { PiExportBold } from 'react-icons/pi'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import {
  normalizeInputs,
  calculateAll,
  getComparisonSummary,
  formatRMB,
  formatUSD,
  formatWeight,
  rmbToUsd,
} from '@/lib/calculator'
import { COUNTRY_NAMES } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function CompareTab() {
  const {
    carriers,
    packageInput,
    carrierFilter,
    countryFilter,
    selectedServices,
    exchangeRate,
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
    return calculateAll(carriers, l, w, h, weight, carrierFilter, countryFilter)
  }, [carriers, packageInput, carrierFilter, countryFilter])

  const visibleResults = useMemo(
    () => results.filter((r) => selectedServices.includes(r.serviceId)),
    [results, selectedServices]
  )

  const summary = useMemo(() => getComparisonSummary(visibleResults), [visibleResults])

  const qty = packageInput.quantity
  const freq = packageInput.frequency
  const batchMul = freq === 'daily' ? qty : freq === 'monthly' ? qty * 30 : qty

  const handleExportCSV = () => {
    const headers = [
      'Service', 'Carrier', 'Country', 'Speed', 'Divisor',
      'Vol Weight (kg)', 'Charged Weight (kg)', 'Shipping (RMB)',
      'Handling (RMB)', 'Oversize (RMB)', 'Total/Parcel (RMB)',
      'Total/Parcel (USD)', 'Status',
    ]
    const rows = visibleResults.map((r) => [
      r.serviceName,
      r.carrierName,
      (COUNTRY_NAMES[r.country] || r.country) + (r.zone ? ` ${r.zone}` : ''),
      `${r.deliveryDays.min}-${r.deliveryDays.max}`,
      r.divisor,
      r.volumetricWeight.toFixed(3),
      r.chargedWeight.toFixed(3),
      r.shippingFee.toFixed(2),
      r.handlingFee.toFixed(2),
      r.oversizeFee.toFixed(2),
      r.totalPerParcel.toFixed(2),
      rmbToUsd(r.totalPerParcel, exchangeRate).toFixed(2),
      r.exceeded ? 'EXCEEDS' : summary.cheapest?.serviceId === r.serviceId ? 'CHEAPEST' : 'OK',
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `shipping_compare_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (visibleResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="mb-2 text-4xl">📊</span>
        <Text className="text-gray-500">
          Enter package details in the Calculator tab to see comparison
        </Text>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text className="text-sm font-semibold">
          {visibleResults.length} service(s) compared
        </Text>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
          <PiExportBold className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">Service</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">Carrier</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">Country</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold">Speed</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold">÷</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Vol Wt</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Charged</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Shipping</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Handling</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Oversize</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Total/Parcel</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">USD</th>
              {batchMul > 1 && (
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">
                  Batch (×{batchMul})
                </th>
              )}
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleResults.map((r) => {
              const isCheapest = summary.cheapest?.serviceId === r.serviceId && !r.exceeded
              const isFastest =
                summary.fastest?.serviceId === r.serviceId &&
                !r.exceeded &&
                r.serviceId !== summary.cheapest?.serviceId

              const totalClass = r.exceeded
                ? 'bg-red-50 dark:bg-red-950/20'
                : isCheapest
                  ? 'bg-green-50 dark:bg-green-950/20'
                  : ''

              return (
                <tr
                  key={r.serviceId}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.serviceName}</div>
                    <div className="text-gray-400">{r.code}</div>
                  </td>
                  <td className="px-3 py-2">{r.carrierName}</td>
                  <td className="px-3 py-2">
                    {(COUNTRY_NAMES[r.country] || r.country)}
                    {r.zone && <span className="text-gray-400"> {r.zone}</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.deliveryDays.min}-{r.deliveryDays.max}d
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500">{r.divisor}</td>
                  <td className="px-3 py-2 text-right">{formatWeight(r.volumetricWeight)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatWeight(r.chargedWeight)}</td>
                  <td className="px-3 py-2 text-right">{formatRMB(r.shippingFee)}</td>
                  <td className="px-3 py-2 text-right">{formatRMB(r.handlingFee)}</td>
                  <td className="px-3 py-2 text-right">
                    {r.oversizeFee > 0 ? formatRMB(r.oversizeFee) : '–'}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-medium', totalClass)}>
                    {formatRMB(r.totalPerParcel)}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-bold', totalClass)}>
                    {formatUSD(rmbToUsd(r.totalPerParcel, exchangeRate))}
                  </td>
                  {batchMul > 1 && (
                    <td className="px-3 py-2 text-right">
                      {formatUSD(rmbToUsd(r.totalPerParcel * batchMul, exchangeRate))}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center">
                    {r.exceeded ? (
                      <span className="font-bold text-red-500">Exceeds</span>
                    ) : isCheapest ? (
                      <span className="font-bold text-green-600">Cheapest</span>
                    ) : isFastest ? (
                      <span className="font-bold text-blue-600">Fastest</span>
                    ) : (
                      <span className="text-gray-400">OK</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
