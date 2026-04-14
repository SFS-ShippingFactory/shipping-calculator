import { DEFAULT_EXCHANGE_RATE } from './constants'

interface FxState {
  rate: number
  lastUpdated: Date | null
  isFallback: boolean
}

let cachedFx: FxState = {
  rate: DEFAULT_EXCHANGE_RATE,
  lastUpdated: null,
  isFallback: true,
}

export async function fetchExchangeRate(): Promise<FxState> {
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY')
    if (!res.ok) throw new Error('Primary API error')
    const data = await res.json()
    if (data.rates?.CNY) {
      cachedFx = { rate: data.rates.CNY, lastUpdated: new Date(), isFallback: false }
      return cachedFx
    }
    throw new Error('No CNY in response')
  } catch {
    try {
      const res2 = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!res2.ok) throw new Error('Backup API error')
      const data2 = await res2.json()
      if (data2.rates?.CNY) {
        cachedFx = { rate: data2.rates.CNY, lastUpdated: new Date(), isFallback: false }
        return cachedFx
      }
      throw new Error('No CNY in backup')
    } catch {
      cachedFx = { rate: DEFAULT_EXCHANGE_RATE, lastUpdated: null, isFallback: true }
      return cachedFx
    }
  }
}

export function getCachedFx(): FxState {
  return cachedFx
}
