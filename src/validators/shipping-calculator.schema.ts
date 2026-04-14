import { z } from 'zod'

export const rateTierSchema = z.object({
  minWeight: z.number().min(0, { message: 'Min weight must be >= 0' }),
  maxWeight: z.number().positive({ message: 'Max weight must be > 0' }),
  ratePerKg: z.number().min(0, { message: 'Rate must be >= 0' }),
  handlingFee: z.number().min(0, { message: 'Handling fee must be >= 0' }),
  minCharge: z.number().min(0).optional(),
})

export const dimensionsSchema = z.object({
  l: z.number().positive({ message: 'Length required' }),
  w: z.number().positive({ message: 'Width required' }),
  h: z.number().positive({ message: 'Height required' }),
})

export const deliveryDaysSchema = z.object({
  min: z.number().int().min(1, { message: 'Min days >= 1' }),
  max: z.number().int().min(1, { message: 'Max days >= 1' }),
})

export const maxCompensationSchema = z.object({
  beforeTracking: z.number().min(0),
  afterTracking: z.number().min(0),
})

export const serviceSchema = z.object({
  id: z.string().min(1, { message: 'Service ID required' }),
  name: z.string().min(1, { message: 'Service name required' }),
  code: z.string().min(1, { message: 'Service code required' }),
  country: z.string().min(1, { message: 'Country required' }),
  zone: z.string().optional(),
  deliveryDays: deliveryDaysSchema,
  type: z.string().min(1, { message: 'Service type required' }),
  isActive: z.boolean(),
  volumetricDivisor: z.number().positive({ message: 'Divisor must be > 0' }),
  maxWeight: z.number().positive({ message: 'Max weight must be > 0' }),
  maxDimensions: dimensionsSchema,
  maxVolume: z.number().positive({ message: 'Max volume must be > 0' }),
  maxDimSum: z.number().positive().optional(),
  oversizeSurcharge: z.number().min(0),
  maxCompensation: maxCompensationSchema,
  rates: z.array(rateTierSchema).min(1, { message: 'At least one rate tier required' }),
})

export const carrierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { message: 'Carrier name required' }),
  effectiveDate: z.string().min(1, { message: 'Effective date required' }),
  rating: z.number().min(0).max(5),
  notes: z.string(),
  isActive: z.boolean(),
  services: z.array(serviceSchema).min(1, { message: 'At least one service required' }),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const carrierFormSchema = z.object({
  name: z.string().min(1, { message: 'Carrier name required' }),
  effectiveDate: z.string().min(1, { message: 'Effective date required' }),
  rating: z.number().min(0).max(5),
  notes: z.string(),
  isActive: z.boolean(),
})

export const serviceFormSchema = z.object({
  name: z.string().min(1, { message: 'Service name required' }),
  code: z.string().min(1, { message: 'Service code required' }),
  country: z.string().min(1, { message: 'Country required' }),
  zone: z.string().optional(),
  deliveryDays: z.object({
    min: z.number().int().min(1, { message: 'Min days >= 1' }),
    max: z.number().int().min(1, { message: 'Max days >= 1' }),
  }),
  type: z.string().min(1, { message: 'Service type required' }),
  isActive: z.boolean(),
  volumetricDivisor: z.number().positive({ message: 'Divisor must be > 0' }),
  maxWeight: z.number().positive({ message: 'Max weight must be > 0' }),
  maxDimensions: z.object({
    l: z.number().positive({ message: 'Length required' }),
    w: z.number().positive({ message: 'Width required' }),
    h: z.number().positive({ message: 'Height required' }),
  }),
  maxVolume: z.number().positive({ message: 'Max volume must be > 0' }),
  maxDimSum: z.number().positive().optional(),
  oversizeSurcharge: z.number().min(0),
  maxCompensation: z.object({
    beforeTracking: z.number().min(0),
    afterTracking: z.number().min(0),
  }),
  rates: z.array(z.object({
    minWeight: z.number().min(0, { message: 'Min weight must be >= 0' }),
    maxWeight: z.number().positive({ message: 'Max weight must be > 0' }),
    ratePerKg: z.number().min(0, { message: 'Rate must be >= 0' }),
    handlingFee: z.number().min(0, { message: 'Handling fee must be >= 0' }),
    minCharge: z.number().min(0).optional(),
  })).min(1, { message: 'At least one rate tier required' }),
})

export const importCarriersSchema = z.record(z.string(), carrierSchema)

export type CarrierFormValues = z.infer<typeof carrierFormSchema>
export type ServiceFormValues = z.infer<typeof serviceFormSchema>
export type RateTierFormValues = z.infer<typeof rateTierSchema>
