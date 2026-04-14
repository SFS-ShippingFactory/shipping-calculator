'use client'

import { useState, useCallback, useRef } from 'react'
import { Button, Modal, Text, Badge, ActionIcon, Switch, Tooltip, Title } from 'rizzui'
import {
  PiPlusBold,
  PiPencilSimpleBold,
  PiTrashBold,
  PiExportBold,
  PiUploadSimpleBold,
  PiCaretDownBold,
  PiStarFill,
  PiStar,
  PiPackageBold,
  PiArrowCounterClockwiseBold,
} from 'react-icons/pi'
import toast from 'react-hot-toast'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { CarrierForm } from './carrier-form'
import { ServiceForm } from './carrier-form/service-form'
import { importCarriersSchema, type CarrierFormValues, type ServiceFormValues } from '@/validators/shipping-calculator.schema'
import type { Carrier, Service } from '@/lib/types'
import { formatRMB, formatUSD, rmbToUsd } from '@/lib/calculator'
import { cn } from '@/lib/cn'

export function CarriersTab() {
  const {
    carriers,
    exchangeRate,
    addCarrier,
    updateCarrier,
    deleteCarrier,
    toggleCarrierActive,
    rateCarrier,
    addService,
    updateService,
    deleteService,
    toggleServiceActive,
    importCarriers,
    resetToDefaults,
  } = useShippingCalculatorStore()

  const [carrierModalOpen, setCarrierModalOpen] = useState(false)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<{ carrierId: string; service?: Service } | null>(null)
  const [expandedCarriers, setExpandedCarriers] = useState<Set<string>>(new Set())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleExpand = useCallback((id: string) => {
    setExpandedCarriers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleAddCarrier = useCallback(
    (values: CarrierFormValues) => {
      const id = values.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
      const now = new Date().toISOString()
      addCarrier({
        id,
        ...values,
        services: [],
        createdAt: now,
        updatedAt: now,
      })
      setCarrierModalOpen(false)
      toast.success('Carrier added')
    },
    [addCarrier]
  )

  const handleEditCarrier = useCallback(
    (values: CarrierFormValues) => {
      if (!editingCarrier) return
      updateCarrier(editingCarrier.id, values)
      setEditingCarrier(null)
      setCarrierModalOpen(false)
      toast.success('Carrier updated')
    },
    [editingCarrier, updateCarrier]
  )

  const handleDeleteCarrier = useCallback(
    (id: string) => {
      deleteCarrier(id)
      setDeleteConfirmId(null)
      toast.success('Carrier deleted')
    },
    [deleteCarrier]
  )

  const handleAddService = useCallback(
    (values: ServiceFormValues) => {
      if (!editingService) return
      const id =
        editingService.carrierId + '_svc_' + values.code.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
      addService(editingService.carrierId, { id, ...values } as Service)
      setServiceModalOpen(false)
      setEditingService(null)
      toast.success('Service added')
    },
    [editingService, addService]
  )

  const handleEditService = useCallback(
    (values: ServiceFormValues) => {
      if (!editingService?.service) return
      updateService(editingService.carrierId, editingService.service.id, values)
      setServiceModalOpen(false)
      setEditingService(null)
      toast.success('Service updated')
    },
    [editingService, updateService]
  )

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(carriers, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `shipcalc_carriers_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Carriers exported')
  }, [carriers])

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string)
          const parsed = importCarriersSchema.safeParse(raw)
          if (!parsed.success) {
            toast.error('Invalid format: ' + parsed.error.issues[0]?.message)
            return
          }
          importCarriers(parsed.data)
          toast.success(`Imported ${Object.keys(parsed.data).length} carrier(s)`)
        } catch {
          toast.error('Invalid JSON file')
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    },
    [importCarriers]
  )

  const carrierList = Object.values(carriers)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Title as="h5" className="text-base font-semibold">
            Carriers ({carrierList.length})
          </Title>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetToDefaults()}
            className="gap-1.5"
          >
            <PiArrowCounterClockwiseBold className="size-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5"
          >
            <PiExportBold className="size-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <PiUploadSimpleBold className="size-4" />
            Import
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingCarrier(null)
              setCarrierModalOpen(true)
            }}
            className="gap-1.5"
          >
            <PiPlusBold className="size-4" />
            Add Carrier
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {carrierList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 dark:border-gray-600">
          <PiPackageBold className="mb-3 size-12 text-gray-300" />
          <Text className="text-gray-500">No carriers yet. Add one to get started.</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {carrierList.map((carrier) => {
            const isExpanded = expandedCarriers.has(carrier.id)
            return (
              <div
                key={carrier.id}
                className={cn(
                  'rounded-lg border transition-all',
                  carrier.isActive
                    ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                    : 'border-gray-200/60 bg-gray-50 opacity-70 dark:border-gray-800 dark:bg-gray-900/50'
                )}
              >
                {/* Carrier header */}
                <div
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
                  onClick={() => toggleExpand(carrier.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Text className="truncate font-semibold">{carrier.name}</Text>
                        {!carrier.isActive && (
                          <Badge variant="flat" color="secondary" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <Text className="text-xs text-gray-500">
                        {carrier.effectiveDate} · {carrier.services.length} service(s)
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex" onClick={(e) => e.stopPropagation()}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => rateCarrier(carrier.id, star)}
                          className="p-0.5 text-lg"
                        >
                          {carrier.rating >= star ? (
                            <PiStarFill className="text-amber-400" />
                          ) : (
                            <PiStar className="text-gray-300 dark:text-gray-600" />
                          )}
                        </button>
                      ))}
                    </div>
                    <PiCaretDownBold
                      className={cn(
                        'size-4 text-gray-500 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
                    {/* Carrier controls */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Switch
                        label="Active"
                        checked={carrier.isActive}
                        onChange={() => toggleCarrierActive(carrier.id)}
                      />
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCarrier(carrier)
                            setCarrierModalOpen(true)
                          }}
                          className="gap-1"
                        >
                          <PiPencilSimpleBold className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          color="danger"
                          onClick={() => setDeleteConfirmId(carrier.id)}
                          className="gap-1"
                        >
                          <PiTrashBold className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Notes */}
                    {carrier.notes && (
                      <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {carrier.notes}
                      </div>
                    )}

                    {/* Services */}
                    <div className="mb-3 flex items-center justify-between">
                      <Text className="text-sm font-semibold">Services</Text>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingService({ carrierId: carrier.id })
                          setServiceModalOpen(true)
                        }}
                        className="gap-1"
                      >
                        <PiPlusBold className="size-3.5" />
                        Add Service
                      </Button>
                    </div>

                    {carrier.services.length === 0 ? (
                      <Text className="py-4 text-center text-sm text-gray-400">
                        No services. Add one to start calculating.
                      </Text>
                    ) : (
                      <div className="space-y-3">
                        {carrier.services.map((svc) => (
                          <div
                            key={svc.id}
                            className={cn(
                              'rounded-lg border p-3',
                              svc.isActive
                                ? 'border-gray-200 dark:border-gray-700'
                                : 'border-gray-100 opacity-60 dark:border-gray-800'
                            )}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div>
                                <Text className="text-sm font-medium">
                                  {svc.name}{' '}
                                  <span className="text-gray-400">({svc.code})</span>
                                </Text>
                                <Text className="text-xs text-gray-500">
                                  {svc.type} · {svc.deliveryDays.min}-{svc.deliveryDays.max} days ·{' '}
                                  {svc.country}
                                  {svc.zone ? ` ${svc.zone}` : ''} · ÷{svc.volumetricDivisor} ·
                                  max {svc.maxWeight}kg
                                </Text>
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={svc.isActive}
                                  onChange={() => toggleServiceActive(carrier.id, svc.id)}
                                  className="mr-2"
                                />
                                <Tooltip content="Edit Service" placement="top">
                                  <ActionIcon
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingService({ carrierId: carrier.id, service: svc })
                                      setServiceModalOpen(true)
                                    }}
                                  >
                                    <PiPencilSimpleBold className="size-4" />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip content="Delete Service" placement="top">
                                  <ActionIcon
                                    variant="outline"
                                    size="sm"
                                    color="danger"
                                    onClick={() => deleteService(carrier.id, svc.id)}
                                  >
                                    <PiTrashBold className="size-4" />
                                  </ActionIcon>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Rate table */}
                            <div className="overflow-x-auto rounded-md border border-gray-100 dark:border-gray-800">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                                    <th className="px-3 py-1.5 text-left font-medium text-gray-500">Weight Range (kg)</th>
                                    <th className="px-3 py-1.5 text-right font-medium text-gray-500">Rate (RMB/kg)</th>
                                    <th className="px-3 py-1.5 text-right font-medium text-gray-500">Handling (RMB)</th>
                                    <th className="px-3 py-1.5 text-right font-medium text-gray-500">Rate (USD/kg)</th>
                                    <th className="px-3 py-1.5 text-right font-medium text-gray-500">Handling (USD)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {svc.rates.map((r, i) => (
                                    <tr
                                      key={i}
                                      className="border-b border-gray-50 last:border-0 dark:border-gray-800/50"
                                    >
                                      <td className="px-3 py-1.5">
                                        {r.minWeight} – {r.maxWeight}
                                        {r.minCharge ? ` (min ${r.minCharge * 1000}g)` : ''}
                                      </td>
                                      <td className="px-3 py-1.5 text-right">{formatRMB(r.ratePerKg)}</td>
                                      <td className="px-3 py-1.5 text-right">{formatRMB(r.handlingFee)}</td>
                                      <td className="px-3 py-1.5 text-right text-gray-500">
                                        {formatUSD(rmbToUsd(r.ratePerKg, exchangeRate))}
                                      </td>
                                      <td className="px-3 py-1.5 text-right text-gray-500">
                                        {formatUSD(rmbToUsd(r.handlingFee, exchangeRate))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-2 text-[11px] text-gray-400">
                              Max: {svc.maxDimensions.l}×{svc.maxDimensions.w}×{svc.maxDimensions.h} cm ·
                              Vol: {svc.maxVolume} m³ ·
                              Oversize: {formatRMB(svc.oversizeSurcharge)} ·
                              Comp: {formatRMB(svc.maxCompensation.beforeTracking)}
                              {svc.maxDimSum ? ` · DimSum: ${svc.maxDimSum} cm` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Carrier Modal */}
      <Modal isOpen={carrierModalOpen} onClose={() => { setCarrierModalOpen(false); setEditingCarrier(null) }} size="md">
        <div className="p-6">
          <Title as="h4" className="mb-4 text-lg font-semibold">
            {editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
          </Title>
          <CarrierForm
            carrier={editingCarrier ?? undefined}
            onSubmit={editingCarrier ? handleEditCarrier : handleAddCarrier}
            onCancel={() => { setCarrierModalOpen(false); setEditingCarrier(null) }}
          />
        </div>
      </Modal>

      {/* Add/Edit Service Modal */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => { setServiceModalOpen(false); setEditingService(null) }}
        size="xl"
        customSize="800px"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <Title as="h4" className="mb-4 text-lg font-semibold">
            {editingService?.service ? 'Edit Service' : 'Add New Service'}
          </Title>
          {editingService && (
            <ServiceForm
              service={editingService.service}
              onSubmit={editingService.service ? handleEditService : handleAddService}
              onCancel={() => { setServiceModalOpen(false); setEditingService(null) }}
            />
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} size="sm">
        <div className="p-6 text-center">
          <Title as="h4" className="mb-2 text-lg font-semibold">
            Delete Carrier?
          </Title>
          <Text className="mb-6 text-gray-500">
            This will permanently remove &quot;{deleteConfirmId && carriers[deleteConfirmId]?.name}&quot; and all its services.
          </Text>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button color="danger" onClick={() => deleteConfirmId && handleDeleteCarrier(deleteConfirmId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
