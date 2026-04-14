'use client'

import { Badge, Text, Tooltip } from 'rizzui'
import { PiWarningDiamondBold } from 'react-icons/pi'
import type { CalculationResult, ComparisonSummary, Frequency } from '@/lib/types'
import { formatRMB, formatUSD, formatWeight, rmbToUsd, isHazmatService } from '@/lib/calculator'
import { COUNTRY_NAMES } from '@/lib/constants'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { cn } from '@/lib/cn'

interface Props {
  results: CalculationResult[]
  summary: ComparisonSummary
  quantity: number
  frequency: Frequency
}

export function ResultCards({ results, summary, quantity, frequency }: Props) {
  const { exchangeRate } = useShippingCalculatorStore()
  const { cheapest } = summary

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="mb-2 text-4xl">📦</span>
        <Text className="text-gray-500">Enter package details to see shipping rates</Text>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {results.map((r) => {
        const isCheapest = cheapest && r.serviceId === cheapest.serviceId && !r.exceeded
        const isFastest =
          summary.fastest &&
          r.serviceId === summary.fastest.serviceId &&
          !r.exceeded &&
          r.serviceId !== cheapest?.serviceId

        const totalBatch = r.totalPerParcel * quantity
        const countryLabel = r.country
          ? (COUNTRY_NAMES[r.country] || r.country) + (r.zone ? ` ${r.zone}` : '')
          : ''

        let diffTag: React.ReactNode = null
        if (cheapest && !r.exceeded && !isCheapest && cheapest.totalPerParcel > 0) {
          const diff = r.totalPerParcel - cheapest.totalPerParcel
          const pct = ((diff / cheapest.totalPerParcel) * 100).toFixed(0)
          if (diff > 0) {
            diffTag = (
              <span className="text-xs text-red-500">
                +{formatUSD(rmbToUsd(diff, exchangeRate))} (+{pct}%)
              </span>
            )
          }
        }

        return (
          <div
            key={r.serviceId}
            className={cn(
              'relative rounded-xl border p-4 transition-shadow hover:shadow-md',
              r.exceeded
                ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10'
                : isCheapest
                  ? 'border-green-300 bg-green-50/50 shadow-sm dark:border-green-800 dark:bg-green-950/10'
                  : isFastest
                    ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/10'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
            )}
          >
            {/* Badge */}
            {r.exceeded && (
              <Badge variant="flat" color="danger" className="absolute right-3 top-3 text-[10px]">
                Exceeds
              </Badge>
            )}
            {isCheapest && (
              <Badge variant="flat" color="success" className="absolute right-3 top-3 text-[10px]">
                Cheapest
              </Badge>
            )}
            {isFastest && (
              <Badge variant="flat" color="info" className="absolute right-3 top-3 text-[10px]">
                Fastest
              </Badge>
            )}

            {/* Header */}
            <div className="mb-3 pr-16">
              <div className="flex items-center gap-1.5">
                <Text className="text-sm font-semibold">{r.serviceName}</Text>
                {(r.type.toLowerCase().includes('dg') || r.serviceName.toLowerCase().includes('battery')) && (
                  <Tooltip content="Hazmat / Dangerous Goods" placement="top">
                    <span className="inline-flex items-center rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/30">
                      <PiWarningDiamondBold className="size-3 text-amber-600 dark:text-amber-400" />
                    </span>
                  </Tooltip>
                )}
              </div>
              <Text className="text-xs text-gray-500">
                {r.carrierName} · {r.code}
                {countryLabel && ` · ${countryLabel}`}
              </Text>
              <Text className="text-xs font-medium text-primary">
                {r.deliveryDays.min}-{r.deliveryDays.max} business days
              </Text>
            </div>

            {/* Weight breakdown */}
            <div className="mb-3 space-y-1">
              <Row label="Actual Weight" value={formatWeight(r.actualWeight)} />
              <Row label={`Vol. Weight (÷${r.divisor})`} value={formatWeight(r.volumetricWeight)} />
              <Row label="Charged Weight" value={<strong>{formatWeight(r.chargedWeight)}</strong>} bold />
            </div>

            <div className="mb-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <Row label="Shipping Fee" value={priceCell(r.shippingFee, exchangeRate)} />
              <Row label="Handling Fee" value={priceCell(r.handlingFee, exchangeRate)} />
              {r.oversizeFee > 0 && (
                <Row label="Oversize Fee" value={priceCell(r.oversizeFee, exchangeRate)} />
              )}
            </div>

            {/* Total */}
            <div className="flex items-baseline justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <Text className="text-sm font-medium">Per Parcel</Text>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatUSD(rmbToUsd(r.totalPerParcel, exchangeRate))}
                </div>
                <div className="text-xs text-gray-500">{formatRMB(r.totalPerParcel)}</div>
              </div>
            </div>

            {diffTag && <div className="mt-1 text-right">{diffTag}</div>}

            {/* Batch */}
            {(quantity > 1 || frequency !== 'once') && (
              <div className="mt-3 space-y-1 rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-800">
                {quantity > 1 && (
                  <div className="flex justify-between">
                    <span>{quantity} parcels</span>
                    <span className="font-medium">
                      {formatUSD(rmbToUsd(totalBatch, exchangeRate))}
                    </span>
                  </div>
                )}
                {frequency === 'daily' && (
                  <div className="flex justify-between">
                    <span>Monthly est. (×30)</span>
                    <span className="font-medium">
                      {formatUSD(rmbToUsd(totalBatch * 30, exchangeRate))}
                    </span>
                  </div>
                )}
                {frequency === 'monthly' && (
                  <div className="flex justify-between">
                    <span>Monthly total (×30)</span>
                    <span className="font-medium">
                      {formatUSD(rmbToUsd(totalBatch * 30, exchangeRate))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Compensation */}
            <Tooltip
              content={
                <div className="text-xs">
                  <div>Before tracking: max {formatRMB(r.maxCompensation.beforeTracking)}</div>
                  <div>After tracking: max {formatRMB(r.maxCompensation.afterTracking)}</div>
                </div>
              }
              placement="top"
            >
              <div className="mt-2 cursor-help text-[11px] text-gray-400">
                Compensation: {formatRMB(r.maxCompensation.beforeTracking)} ⓘ
              </div>
            </Tooltip>

            {/* Warnings */}
            {r.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {r.warnings.map((w, i) => (
                  <div key={i} className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-600 dark:bg-red-950/20 dark:text-red-400">
                    ⚠ {w.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: React.ReactNode
  bold?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={cn(bold && 'font-semibold')}>{value}</span>
    </div>
  )
}

function priceCell(rmb: number, exchangeRate: number) {
  return (
    <span>
      {formatRMB(rmb)}{' '}
      <span className="text-gray-400">({formatUSD(rmbToUsd(rmb, exchangeRate))})</span>
    </span>
  )
}
