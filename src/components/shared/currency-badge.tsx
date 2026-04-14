'use client'

import { useEffect } from 'react'
import { Badge } from 'rizzui'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { fetchExchangeRate } from '@/lib/currency'
import { FX_REFRESH_INTERVAL_MS } from '@/lib/constants'

export function CurrencyBadge() {
  const { exchangeRate, isExchangeRateFallback, exchangeRateUpdatedAt, setExchangeRate } =
    useShippingCalculatorStore()

  useEffect(() => {
    const load = async () => {
      const fx = await fetchExchangeRate()
      setExchangeRate(fx.rate, fx.isFallback)
    }
    load()
    const interval = setInterval(load, FX_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [setExchangeRate])

  const updatedLabel = exchangeRateUpdatedAt
    ? new Date(exchangeRateUpdatedAt).toLocaleTimeString()
    : 'N/A'

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="flat"
        color={isExchangeRateFallback ? 'danger' : 'success'}
        className="text-xs font-medium"
      >
        1 USD = {exchangeRate.toFixed(4)} CNY
      </Badge>
      <span className="text-[11px] text-gray-500">
        {isExchangeRateFallback ? 'Fallback rate' : `Updated: ${updatedLabel}`}
      </span>
    </div>
  )
}
