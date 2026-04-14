import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Carrier, Service, PackageInput, CalculationResult } from '@/lib/types'
import { DEFAULT_CARRIERS, DEFAULT_EXCHANGE_RATE } from '@/lib/constants'

interface ShippingCalculatorStore {
  carriers: Record<string, Carrier>
  selectedServices: string[]
  exchangeRate: number
  exchangeRateUpdatedAt: string | null
  isExchangeRateFallback: boolean
  lastResults: CalculationResult[]

  packageInput: PackageInput
  activePreset: string
  carrierFilter: string
  countryFilter: string
  activeTab: string

  addCarrier: (carrier: Carrier) => void
  updateCarrier: (id: string, updates: Partial<Carrier>) => void
  deleteCarrier: (id: string) => void
  toggleCarrierActive: (id: string) => void
  rateCarrier: (id: string, rating: number) => void

  addService: (carrierId: string, service: Service) => void
  updateService: (carrierId: string, serviceId: string, updates: Partial<Service>) => void
  deleteService: (carrierId: string, serviceId: string) => void
  toggleServiceActive: (carrierId: string, serviceId: string) => void

  toggleServiceSelection: (serviceId: string) => void
  selectAllServices: () => void
  deselectAllServices: () => void

  setExchangeRate: (rate: number, isFallback: boolean) => void
  setLastResults: (results: CalculationResult[]) => void
  setPackageInput: (input: Partial<PackageInput>) => void
  setActivePreset: (preset: string) => void
  setCarrierFilter: (filter: string) => void
  setCountryFilter: (filter: string) => void
  setActiveTab: (tab: string) => void

  importCarriers: (data: Record<string, Carrier>) => void
  resetToDefaults: () => void
}

function getAllServiceIds(carriers: Record<string, Carrier>): string[] {
  const ids: string[] = []
  Object.values(carriers).forEach((c) => c.services.forEach((s) => ids.push(s.id)))
  return ids
}

export const useShippingCalculatorStore = create<ShippingCalculatorStore>()(
  persist(
    (set, get) => ({
      carriers: structuredClone(DEFAULT_CARRIERS),
      selectedServices: getAllServiceIds(DEFAULT_CARRIERS),
      exchangeRate: DEFAULT_EXCHANGE_RATE,
      exchangeRateUpdatedAt: null,
      isExchangeRateFallback: true,
      lastResults: [],

      packageInput: {
        length: 0, width: 0, height: 0, weight: 0,
        dimUnit: 'cm', weightUnit: 'kg', quantity: 1, frequency: 'once',
      },
      activePreset: 'custom',
      carrierFilter: 'all',
      countryFilter: 'all',
      activeTab: 'calculator',

      addCarrier: (carrier) =>
        set((state) => ({
          carriers: { ...state.carriers, [carrier.id]: carrier },
          selectedServices: [...state.selectedServices, ...carrier.services.map((s) => s.id)],
        })),

      updateCarrier: (id, updates) =>
        set((state) => {
          const existing = state.carriers[id]
          if (!existing) return state
          return {
            carriers: { ...state.carriers, [id]: { ...existing, ...updates, updatedAt: new Date().toISOString() } },
          }
        }),

      deleteCarrier: (id) =>
        set((state) => {
          const carrier = state.carriers[id]
          if (!carrier) return state
          const serviceIds = new Set(carrier.services.map((s) => s.id))
          const { [id]: _, ...rest } = state.carriers
          return {
            carriers: rest,
            selectedServices: state.selectedServices.filter((sid) => !serviceIds.has(sid)),
          }
        }),

      toggleCarrierActive: (id) =>
        set((state) => {
          const carrier = state.carriers[id]
          if (!carrier) return state
          return {
            carriers: { ...state.carriers, [id]: { ...carrier, isActive: !carrier.isActive, updatedAt: new Date().toISOString() } },
          }
        }),

      rateCarrier: (id, rating) =>
        set((state) => {
          const carrier = state.carriers[id]
          if (!carrier) return state
          return {
            carriers: { ...state.carriers, [id]: { ...carrier, rating: carrier.rating === rating ? 0 : rating, updatedAt: new Date().toISOString() } },
          }
        }),

      addService: (carrierId, service) =>
        set((state) => {
          const carrier = state.carriers[carrierId]
          if (!carrier) return state
          return {
            carriers: { ...state.carriers, [carrierId]: { ...carrier, services: [...carrier.services, service], updatedAt: new Date().toISOString() } },
            selectedServices: [...state.selectedServices, service.id],
          }
        }),

      updateService: (carrierId, serviceId, updates) =>
        set((state) => {
          const carrier = state.carriers[carrierId]
          if (!carrier) return state
          return {
            carriers: {
              ...state.carriers,
              [carrierId]: { ...carrier, services: carrier.services.map((s) => (s.id === serviceId ? { ...s, ...updates } : s)), updatedAt: new Date().toISOString() },
            },
          }
        }),

      deleteService: (carrierId, serviceId) =>
        set((state) => {
          const carrier = state.carriers[carrierId]
          if (!carrier) return state
          return {
            carriers: { ...state.carriers, [carrierId]: { ...carrier, services: carrier.services.filter((s) => s.id !== serviceId), updatedAt: new Date().toISOString() } },
            selectedServices: state.selectedServices.filter((id) => id !== serviceId),
          }
        }),

      toggleServiceActive: (carrierId, serviceId) =>
        set((state) => {
          const carrier = state.carriers[carrierId]
          if (!carrier) return state
          return {
            carriers: {
              ...state.carriers,
              [carrierId]: { ...carrier, services: carrier.services.map((s) => (s.id === serviceId ? { ...s, isActive: !s.isActive } : s)), updatedAt: new Date().toISOString() },
            },
          }
        }),

      toggleServiceSelection: (serviceId) =>
        set((state) => ({
          selectedServices: state.selectedServices.includes(serviceId)
            ? state.selectedServices.filter((id) => id !== serviceId)
            : [...state.selectedServices, serviceId],
        })),

      selectAllServices: () => set((state) => ({ selectedServices: getAllServiceIds(state.carriers) })),
      deselectAllServices: () => set({ selectedServices: [] }),

      setExchangeRate: (rate, isFallback) =>
        set({ exchangeRate: rate, exchangeRateUpdatedAt: new Date().toISOString(), isExchangeRateFallback: isFallback }),

      setLastResults: (results) => set({ lastResults: results }),
      setPackageInput: (input) => set((state) => ({ packageInput: { ...state.packageInput, ...input } })),
      setActivePreset: (preset) => set({ activePreset: preset }),
      setCarrierFilter: (filter) => set({ carrierFilter: filter }),
      setCountryFilter: (filter) => set({ countryFilter: filter }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      importCarriers: (data) =>
        set((state) => {
          const merged = { ...state.carriers, ...data }
          return { carriers: merged, selectedServices: getAllServiceIds(merged) }
        }),

      resetToDefaults: () =>
        set({ carriers: structuredClone(DEFAULT_CARRIERS), selectedServices: getAllServiceIds(DEFAULT_CARRIERS) }),
    }),
    {
      name: 'shipping-calculator',
      partialize: (state) => ({
        carriers: state.carriers,
        selectedServices: state.selectedServices,
        packageInput: state.packageInput,
        activePreset: state.activePreset,
        carrierFilter: state.carrierFilter,
        countryFilter: state.countryFilter,
        activeTab: state.activeTab,
      }),
    }
  )
)
