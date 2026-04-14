'use client'

import { cn } from '@/lib/cn'

interface UnitToggleProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function UnitToggle({ options, value, onChange, className }: UnitToggleProps) {
  return (
    <div className={cn('inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-all',
            value === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
