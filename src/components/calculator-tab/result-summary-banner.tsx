'use client'

import type { ComparisonSummary } from '@/lib/types'
import { formatUSD, formatRMB, rmbToUsd } from '@/lib/calculator'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'

interface Props {
  summary: ComparisonSummary
  totalResults: number
}

export function ResultSummaryBanner({ summary, totalResults }: Props) {
  const { exchangeRate } = useShippingCalculatorStore()
  const { cheapest, fastest, savingsRmb, savingsPercent } = summary

  if (!cheapest || totalResults < 2) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Cheapest */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/20">
        <div className="text-xs font-medium text-green-700 dark:text-green-400">Cheapest Option</div>
        <div className="mt-1 text-lg font-bold text-green-800 dark:text-green-300">
          {formatUSD(rmbToUsd(cheapest.totalPerParcel, exchangeRate))}
        </div>
        <div className="text-xs text-green-600 dark:text-green-500">
          {cheapest.serviceName} · {formatRMB(cheapest.totalPerParcel)}
        </div>
      </div>

      {/* Fastest */}
      {fastest && fastest.serviceId !== cheapest.serviceId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Fastest Option</div>
          <div className="mt-1 text-lg font-bold text-blue-800 dark:text-blue-300">
            {fastest.deliveryDays.min}-{fastest.deliveryDays.max} days
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500">
            {fastest.serviceName} · {formatUSD(rmbToUsd(fastest.totalPerParcel, exchangeRate))}
          </div>
        </div>
      )}

      {/* Savings */}
      {savingsRmb > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400">Max Savings</div>
          <div className="mt-1 text-lg font-bold text-amber-800 dark:text-amber-300">
            {formatUSD(rmbToUsd(savingsRmb, exchangeRate))} ({savingsPercent.toFixed(0)}%)
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-500">vs most expensive</div>
        </div>
      )}

      {/* Formula */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Formula</div>
        <div className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          <div>Vol = L×W×H ÷ divisor</div>
          <div>Charged = max(actual, vol, 50g min)</div>
          <div>Total = (charged × rate) + handling + oversize</div>
        </div>
      </div>
    </div>
  )
}
