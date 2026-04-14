'use client'

import { Button } from 'rizzui'
import { PRESETS } from '@/lib/constants'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { cn } from '@/lib/cn'

export function QuickPresets() {
  const { activePreset, setActivePreset, setPackageInput } = useShippingCalculatorStore()

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setActivePreset(preset.id)
    if (preset.l !== null && preset.w !== null && preset.h !== null && preset.weight !== null) {
      setPackageInput({
        length: preset.l,
        width: preset.w,
        height: preset.h,
        weight: preset.weight,
        dimUnit: 'cm',
        weightUnit: 'kg',
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant={activePreset === p.id ? 'solid' : 'outline'}
          size="sm"
          onClick={() => handlePreset(p)}
          className={cn(
            'text-xs',
            activePreset === p.id && 'shadow-sm'
          )}
          title={
            p.l !== null
              ? `${p.l}×${p.w}×${p.h} cm, ${p.weight} kg`
              : 'Custom dimensions'
          }
        >
          {p.id.charAt(0).toUpperCase() + p.id.slice(1)}
          {p.l !== null && (
            <span className="ml-1 text-[10px] opacity-70">
              {p.l}×{p.w}×{p.h}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}
