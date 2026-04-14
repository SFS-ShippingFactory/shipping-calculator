'use client'

import { useState } from 'react'
import { Input, Select, Text, Button, Badge } from 'rizzui'
import { PiXBold } from 'react-icons/pi'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { cn } from '@/lib/cn'

export interface DesiServiceSelection {
  carrierId: string
  serviceId: string
  carrierName: string
  serviceName: string
  volumetricDivisor: number
}

interface Props {
  selected: DesiServiceSelection[]
  onToggle: (carrierId: string, serviceId: string) => void
  onRemove: (index: number) => void
  maxSelections?: number
}

export function ServiceSelector({ selected, onToggle, onRemove, maxSelections = 6 }: Props) {
  const { carriers } = useShippingCalculatorStore()
  const [search, setSearch] = useState('')
  const [carrierFilterVal, setCarrierFilterVal] = useState('all')

  const carrierOptions = [
    { value: 'all', label: 'All Carriers' },
    ...Object.values(carriers).map((c) => ({ value: c.id, label: c.name })),
  ]

  const isSelected = (carrierId: string, serviceId: string) =>
    selected.some((s) => s.carrierId === carrierId && s.serviceId === serviceId)

  return (
    <div className="space-y-3">
      {/* Selected bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Text className="text-xs font-medium text-gray-500">
            {selected.length}/{maxSelections} selected:
          </Text>
          {selected.map((s, i) => (
            <Badge
              key={`${s.carrierId}-${s.serviceId}`}
              variant="flat"
              color="primary"
              className="gap-1 text-xs"
            >
              {s.serviceName}
              <button type="button" onClick={() => onRemove(i)} className="ml-0.5">
                <PiXBold className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          size="sm"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-60"
        />
        <Select
          size="sm"
          options={carrierOptions}
          value={carrierOptions.find((o) => o.value === carrierFilterVal)}
          onChange={(opt: any) => setCarrierFilterVal(opt?.value ?? 'all')}
          className="w-48"
        />
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(carriers).map((carrier) => {
          if (carrierFilterVal !== 'all' && carrier.id !== carrierFilterVal) return null
          return carrier.services
            .filter((svc) => {
              if (!search) return true
              const haystack = `${carrier.name} ${svc.name} ${svc.code} ${svc.country}`.toLowerCase()
              return haystack.includes(search.toLowerCase())
            })
            .map((svc) => {
              const sel = isSelected(carrier.id, svc.id)
              const disabled = !sel && selected.length >= maxSelections
              return (
                <Button
                  key={`${carrier.id}-${svc.id}`}
                  type="button"
                  variant={sel ? 'solid' : 'outline'}
                  size="sm"
                  disabled={disabled}
                  onClick={() => onToggle(carrier.id, svc.id)}
                  className={cn(
                    'justify-start gap-2 text-left text-xs',
                    disabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  <span className={cn('size-2 shrink-0 rounded-full', sel ? 'bg-white' : 'bg-gray-300')} />
                  <span className="min-w-0 truncate">
                    {svc.name}
                    <span className="ml-1 text-[10px] opacity-70">
                      ({carrier.name} · ÷{svc.volumetricDivisor})
                    </span>
                  </span>
                </Button>
              )
            })
        })}
      </div>
    </div>
  )
}
