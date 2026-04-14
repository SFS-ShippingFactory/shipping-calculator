export type CountryCode = 'US' | 'AU' | 'CA' | 'MX' | (string & {})

export type ServiceType =
  | 'Express'
  | 'Standard'
  | 'Economy'
  | 'DDP'
  | 'DDP-DG'
  | (string & {})

export type DimensionUnit = 'cm' | 'in'
export type WeightUnit = 'kg' | 'g'
export type Frequency = 'once' | 'daily' | 'monthly'

export interface Dimensions {
  l: number
  w: number
  h: number
}

export interface RateTier {
  minWeight: number
  maxWeight: number
  ratePerKg: number
  handlingFee: number
  minCharge?: number
}

export interface MaxCompensation {
  beforeTracking: number
  afterTracking: number
}

export interface Service {
  id: string
  name: string
  code: string
  country: CountryCode
  zone?: string
  deliveryDays: { min: number; max: number }
  type: ServiceType
  isActive: boolean
  volumetricDivisor: number
  maxWeight: number
  maxDimensions: Dimensions
  maxVolume: number
  maxDimSum?: number
  oversizeSurcharge: number
  maxCompensation: MaxCompensation
  rates: RateTier[]
}

export interface Carrier {
  id: string
  name: string
  effectiveDate: string
  rating: number
  notes: string
  isActive: boolean
  services: Service[]
  createdAt: string
  updatedAt: string
}

export type ExceededReason =
  | 'weight_exceeded'
  | 'dims_exceeded'
  | 'volume_exceeded'
  | 'dim_sum_exceeded'
  | 'tier_exceeded'

export interface CalculationWarning {
  type: ExceededReason | 'oversize'
  message: string
}

export interface CalculationResult {
  carrierId: string
  carrierName: string
  serviceId: string
  serviceName: string
  code: string
  type: ServiceType
  country: CountryCode
  zone: string
  deliveryDays: { min: number; max: number }
  divisor: number
  actualWeight: number
  volumetricWeight: number
  chargedWeight: number
  shippingFee: number
  handlingFee: number
  oversizeFee: number
  totalPerParcel: number
  maxCompensation: MaxCompensation
  warnings: CalculationWarning[]
  exceeded: boolean
  exceededReasons: ExceededReason[]
}

export interface DesiResult {
  price: number | null
  volWeight: number
  chargedWeight: number
  exceeded: boolean
}

export interface PackageInput {
  length: number
  width: number
  height: number
  weight: number
  dimUnit: DimensionUnit
  weightUnit: WeightUnit
  quantity: number
  frequency: Frequency
}

export interface ParcelPreset {
  id: string
  labelKey: string
  l: number | null
  w: number | null
  h: number | null
  weight: number | null
}

export interface ComparisonSummary {
  cheapest: CalculationResult | null
  fastest: CalculationResult | null
  mostExpensive: CalculationResult | null
  savingsRmb: number
  savingsPercent: number
}
