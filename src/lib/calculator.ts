import type {
  Carrier,
  Service,
  CalculationResult,
  CalculationWarning,
  ExceededReason,
  DesiResult,
  ComparisonSummary,
} from './types'
import { IN_TO_CM, DESI_VOLUME_DIVISOR } from './constants'

export function normalizeInputs(
  l: number,
  w: number,
  h: number,
  weight: number,
  dimUnit: 'cm' | 'in',
  weightUnit: 'kg' | 'g'
) {
  const factor = dimUnit === 'in' ? IN_TO_CM : 1
  return {
    l: l * factor,
    w: w * factor,
    h: h * factor,
    weight: weightUnit === 'g' ? weight / 1000 : weight,
  }
}

export function calculateService(
  carrier: Carrier,
  service: Service,
  lCm: number,
  wCm: number,
  hCm: number,
  weightKg: number
): CalculationResult {
  const warnings: CalculationWarning[] = []
  const exceededReasons: ExceededReason[] = []
  let exceeded = false

  const volumeM3 = (lCm * wCm * hCm) / 1_000_000
  const volWeight = (lCm * wCm * hCm) / service.volumetricDivisor
  const minChargeKg = service.rates[0]?.minCharge ?? 0.05
  let chargedWeight = Math.max(weightKg, volWeight, minChargeKg)

  const md = service.maxDimensions
  const dims = [lCm, wCm, hCm].sort((a, b) => b - a)
  const maxD = [md.l, md.w, md.h].sort((a, b) => b - a)

  if (lCm > 0 && wCm > 0 && hCm > 0) {
    if (dims[0] > maxD[0] || dims[1] > maxD[1] || dims[2] > maxD[2]) {
      warnings.push({
        type: 'dims_exceeded',
        message: `Dims exceed max ${md.l}x${md.w}x${md.h} cm`,
      })
      exceededReasons.push('dims_exceeded')
    }

    if (volumeM3 > service.maxVolume) {
      warnings.push({
        type: 'volume_exceeded',
        message: `Volume ${volumeM3.toFixed(4)} m³ > max ${service.maxVolume} m³`,
      })
      exceededReasons.push('volume_exceeded')
    }

    if (service.maxDimSum) {
      const dimSum = lCm + wCm + hCm
      if (dimSum > service.maxDimSum) {
        warnings.push({
          type: 'dim_sum_exceeded',
          message: `L+W+H ${dimSum.toFixed(1)} cm > max ${service.maxDimSum} cm`,
        })
        exceededReasons.push('dim_sum_exceeded')
      }
    }
  }

  if (chargedWeight > service.maxWeight) {
    warnings.push({
      type: 'weight_exceeded',
      message: `Weight ${chargedWeight.toFixed(2)} kg > max ${service.maxWeight} kg`,
    })
    exceededReasons.push('weight_exceeded')
    exceeded = true
  }

  let ratePerKg = 0
  let handlingFee = 0

  for (const tier of service.rates) {
    if (chargedWeight > tier.minWeight && chargedWeight <= tier.maxWeight) {
      ratePerKg = tier.ratePerKg
      handlingFee = tier.handlingFee
      break
    }
  }

  if (ratePerKg === 0 && !exceeded) {
    const last = service.rates[service.rates.length - 1]
    if (last && chargedWeight > last.maxWeight) {
      warnings.push({
        type: 'tier_exceeded',
        message: `Weight > max tier (${last.maxWeight} kg)`,
      })
      exceededReasons.push('tier_exceeded')
      exceeded = true
    } else if (service.rates[0]) {
      ratePerKg = service.rates[0].ratePerKg
      handlingFee = service.rates[0].handlingFee
    }
  }

  const shippingFee = chargedWeight * ratePerKg
  const hasOversize = exceededReasons.includes('dims_exceeded') || exceededReasons.includes('volume_exceeded')
  const oversizeFee = hasOversize ? service.oversizeSurcharge : 0

  return {
    carrierId: carrier.id,
    carrierName: carrier.name,
    serviceId: service.id,
    serviceName: service.name,
    code: service.code,
    type: service.type,
    country: service.country,
    zone: service.zone ?? '',
    deliveryDays: service.deliveryDays,
    divisor: service.volumetricDivisor,
    actualWeight: weightKg,
    volumetricWeight: volWeight,
    chargedWeight,
    shippingFee,
    handlingFee,
    oversizeFee,
    totalPerParcel: shippingFee + handlingFee + oversizeFee,
    maxCompensation: service.maxCompensation,
    warnings,
    exceeded,
    exceededReasons,
  }
}

export function isHazmatService(service: Service): boolean {
  const t = service.type.toLowerCase()
  const n = service.name.toLowerCase()
  return t.includes('dg') || t.includes('hazmat') || n.includes('battery') || n.includes('dg')
}

export function calculateAll(
  carriers: Record<string, Carrier>,
  lCm: number,
  wCm: number,
  hCm: number,
  weightKg: number,
  selectedCarriers: string[],
  countryFilter: string,
  showHazmat: boolean = true
): CalculationResult[] {
  const results: CalculationResult[] = []

  Object.values(carriers).forEach((carrier) => {
    if (!carrier.isActive) return
    if (!selectedCarriers.includes(carrier.id)) return

    carrier.services.forEach((service) => {
      if (!service.isActive) return
      if (!showHazmat && isHazmatService(service)) return
      if (countryFilter !== 'all') {
        if (service.country && service.country !== countryFilter) return
        if (!service.country) return
      }
      results.push(calculateService(carrier, service, lCm, wCm, hCm, weightKg))
    })
  })

  return results
}

export function getComparisonSummary(results: CalculationResult[]): ComparisonSummary {
  const eligible = results.filter((r) => !r.exceeded)

  if (eligible.length === 0) {
    return { cheapest: null, fastest: null, mostExpensive: null, savingsRmb: 0, savingsPercent: 0 }
  }

  const cheapest = eligible.reduce((a, b) => (a.totalPerParcel < b.totalPerParcel ? a : b))
  const fastest = eligible.reduce((a, b) => (a.deliveryDays.min < b.deliveryDays.min ? a : b))
  const mostExpensive = eligible.reduce((a, b) => (a.totalPerParcel > b.totalPerParcel ? a : b))

  const savingsRmb = mostExpensive.totalPerParcel - cheapest.totalPerParcel
  const savingsPercent =
    mostExpensive.totalPerParcel > 0
      ? (savingsRmb / mostExpensive.totalPerParcel) * 100
      : 0

  return { cheapest, fastest, mostExpensive, savingsRmb, savingsPercent }
}

export function calculateDesi(service: Service, desiNum: number): DesiResult {
  const volumeCm3 = desiNum * DESI_VOLUME_DIVISOR
  const volWeight = volumeCm3 / service.volumetricDivisor
  const minChargeKg = service.rates[0]?.minCharge ?? 0.05
  const chargedWeight = Math.max(volWeight, minChargeKg)

  if (chargedWeight > service.maxWeight) {
    return { price: null, volWeight, chargedWeight, exceeded: true }
  }

  let ratePerKg = 0
  let handlingFee = 0

  for (const tier of service.rates) {
    if (chargedWeight > tier.minWeight && chargedWeight <= tier.maxWeight) {
      ratePerKg = tier.ratePerKg
      handlingFee = tier.handlingFee
      break
    }
  }

  if (ratePerKg === 0) {
    const last = service.rates[service.rates.length - 1]
    if (last && chargedWeight > last.maxWeight) {
      return { price: null, volWeight, chargedWeight, exceeded: true }
    }
    if (service.rates[0]) {
      ratePerKg = service.rates[0].ratePerKg
      handlingFee = service.rates[0].handlingFee
    }
  }

  return {
    price: chargedWeight * ratePerKg + handlingFee,
    volWeight,
    chargedWeight,
    exceeded: false,
  }
}

export function getDesiDimensions(desiNum: number) {
  const volumeCm3 = desiNum * DESI_VOLUME_DIVISOR
  const side = Math.cbrt(volumeCm3)
  const l = Math.round(side * 1.4 * 10) / 10
  const w = Math.round(side * 1.0 * 10) / 10
  const h = Math.round((volumeCm3 / (l * w)) * 10) / 10
  return { l, w, h, volumeCm3 }
}

export function rmbToUsd(rmb: number, exchangeRate: number): number {
  return rmb / exchangeRate
}

export function formatRMB(v: number): string {
  return `¥${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatUSD(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatWeight(kg: number): string {
  if (kg >= 100) return `${kg.toLocaleString('en-US', { maximumFractionDigits: 1 })} kg`
  if (kg >= 1) return `${kg.toLocaleString('en-US', { maximumFractionDigits: 2 })} kg`
  return `${(kg * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })} g`
}

export function getUniqueCountries(carriers: Record<string, Carrier>): string[] {
  const codes = new Set<string>()
  Object.values(carriers).forEach((c) =>
    c.services.forEach((s) => {
      if (s.country) codes.add(s.country)
    })
  )
  return [...codes].sort()
}
