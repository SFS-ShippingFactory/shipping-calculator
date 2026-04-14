'use client'

import { useState, useMemo, useCallback } from 'react'
import { Text } from 'rizzui'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import {
  calculateDesi,
  getDesiDimensions,
  formatRMB,
  formatUSD,
  rmbToUsd,
} from '@/lib/calculator'
import { ServiceSelector, type DesiServiceSelection } from './service-selector'
import { cn } from '@/lib/cn'

const MAX_DESI = 100

export function DesiTab() {
  const { carriers, exchangeRate } = useShippingCalculatorStore()
  const [selected, setSelected] = useState<DesiServiceSelection[]>([])

  const handleToggle = useCallback(
    (carrierId: string, serviceId: string) => {
      setSelected((prev) => {
        const idx = prev.findIndex((s) => s.carrierId === carrierId && s.serviceId === serviceId)
        if (idx >= 0) return prev.filter((_, i) => i !== idx)
        if (prev.length >= 6) return prev
        const carrier = carriers[carrierId]
        if (!carrier) return prev
        const svc = carrier.services.find((s) => s.id === serviceId)
        if (!svc) return prev
        return [
          ...prev,
          {
            carrierId,
            serviceId,
            carrierName: carrier.name,
            serviceName: svc.name,
            volumetricDivisor: svc.volumetricDivisor,
          },
        ]
      })
    },
    [carriers]
  )

  const handleRemove = useCallback((index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const tableData = useMemo(() => {
    if (selected.length === 0) return []
    const rows: Array<{
      desi: number
      dims: ReturnType<typeof getDesiDimensions>
      results: Array<ReturnType<typeof calculateDesi>>
      minPrice: number | null
    }> = []

    for (let desi = 1; desi <= MAX_DESI; desi++) {
      const dims = getDesiDimensions(desi)
      const results = selected.map((sel) => {
        const carrier = carriers[sel.carrierId]
        const service = carrier?.services.find((s) => s.id === sel.serviceId)
        if (!service) return { price: null, volWeight: 0, chargedWeight: 0, exceeded: true }
        return calculateDesi(service, desi)
      })

      const validPrices = results.filter((r) => r.price !== null).map((r) => r.price as number)
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null

      rows.push({ desi, dims, results, minPrice })
    }
    return rows
  }, [selected, carriers])

  return (
    <div className="space-y-4">
      <ServiceSelector
        selected={selected}
        onToggle={handleToggle}
        onRemove={handleRemove}
      />

      {selected.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="mb-2 text-4xl">📊</span>
          <Text className="text-gray-500">Select up to 6 services to compare desi rates</Text>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold" style={{ minWidth: 110 }}>
                  Desi
                </th>
                {selected.map((s) => (
                  <th
                    key={`${s.carrierId}-${s.serviceId}`}
                    className="whitespace-nowrap px-3 py-2.5 text-center font-semibold"
                    style={{ minWidth: 140 }}
                  >
                    <div>{s.carrierName}</div>
                    <div className="font-normal text-gray-500">{s.serviceName}</div>
                    <div className="text-[10px] font-normal text-gray-400">÷{s.volumetricDivisor}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr
                  key={row.desi}
                  className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-gray-800/50 dark:hover:bg-gray-800/20"
                >
                  <td className="px-3 py-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{row.desi}</span>
                    <br />
                    <span className="text-gray-400">
                      {row.dims.l}×{row.dims.w}×{row.dims.h} cm
                    </span>
                    <br />
                    <span className="text-gray-400">
                      {row.dims.volumeCm3.toLocaleString()} cm³
                    </span>
                  </td>
                  {row.results.map((r, i) => {
                    if (r.exceeded || r.price === null) {
                      return (
                        <td key={i} className="px-3 py-2 text-center text-gray-400">
                          🚫 max
                          <br />
                          <span className="text-[10px]">{r.volWeight.toFixed(2)} kg</span>
                        </td>
                      )
                    }
                    const isBest =
                      row.minPrice !== null &&
                      row.results.filter((x) => x.price !== null).length > 1 &&
                      r.price === row.minPrice

                    return (
                      <td
                        key={i}
                        className={cn(
                          'px-3 py-2 text-center',
                          isBest && 'bg-green-50 font-medium dark:bg-green-950/20'
                        )}
                      >
                        <div className="font-semibold">{formatRMB(r.price)}</div>
                        <div className="text-gray-500">
                          {formatUSD(rmbToUsd(r.price, exchangeRate))}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {r.volWeight.toFixed(2)} kg
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
