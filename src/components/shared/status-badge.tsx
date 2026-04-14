'use client'

import { Badge } from 'rizzui'

type StatusType = 'cheapest' | 'fastest' | 'exceeded' | 'ok'

const config: Record<StatusType, { label: string; color: 'success' | 'info' | 'danger' | 'secondary' }> = {
  cheapest: { label: 'Cheapest', color: 'success' },
  fastest: { label: 'Fastest', color: 'info' },
  exceeded: { label: 'Exceeds Limits', color: 'danger' },
  ok: { label: 'OK', color: 'secondary' },
}

export function StatusBadge({ status }: { status: StatusType }) {
  const { label, color } = config[status]
  return (
    <Badge variant="flat" color={color} className="text-xs font-semibold">
      {label}
    </Badge>
  )
}
