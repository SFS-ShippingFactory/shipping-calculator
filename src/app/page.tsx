'use client'

import { useEffect } from 'react'
import { Tab } from 'rizzui'
import {
  PiCalculatorBold,
  PiChartBarBold,
  PiCubeBold,
  PiTruckBold,
  PiSunBold,
  PiMoonBold,
} from 'react-icons/pi'
import { useTheme } from 'next-themes'
import { useShippingCalculatorStore } from '@/store/shipping-calculator-store'
import { fetchExchangeRate } from '@/lib/currency'
import { CurrencyBadge } from '@/components/shared/currency-badge'
import { CalculatorTab } from '@/components/calculator-tab'
import { CompareTab } from '@/components/compare-tab'
import { DesiTab } from '@/components/desi-tab'
import { CarriersTab } from '@/components/carriers-tab'

const tabs = [
  { key: 'calculator', label: 'Calculator', icon: PiCalculatorBold },
  { key: 'compare', label: 'Compare', icon: PiChartBarBold },
  { key: 'desi', label: 'Desi Compare', icon: PiCubeBold },
  { key: 'carriers', label: 'Carriers', icon: PiTruckBold },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      {theme === 'dark' ? <PiSunBold className="size-5" /> : <PiMoonBold className="size-5" />}
    </button>
  )
}

export default function ShippingCalculatorPage() {
  const { activeTab, setActiveTab, setExchangeRate } = useShippingCalculatorStore()

  useEffect(() => {
    const load = async () => {
      const fx = await fetchExchangeRate()
      setExchangeRate(fx.rate, fx.isFallback)
    }
    load()
  }, [setExchangeRate])

  return (
    <div className="@container">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Shipping Calculator</h1>
          <p className="mt-1 text-sm text-gray-500">
            Compare shipping costs across carriers and services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencyBadge />
          <ThemeToggle />
        </div>
      </div>

      <Tab>
        <Tab.List>
          {tabs.map((tab) => (
            <Tab.ListItem
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {({ selected }) => (
                <span className={`flex items-center gap-1.5 ${selected ? 'font-semibold' : ''}`}>
                  <tab.icon className="size-4" />
                  {tab.label}
                </span>
              )}
            </Tab.ListItem>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <CalculatorTab />
          </Tab.Panel>
          <Tab.Panel>
            <CompareTab />
          </Tab.Panel>
          <Tab.Panel>
            <DesiTab />
          </Tab.Panel>
          <Tab.Panel>
            <CarriersTab />
          </Tab.Panel>
        </Tab.Panels>
      </Tab>
    </div>
  )
}
