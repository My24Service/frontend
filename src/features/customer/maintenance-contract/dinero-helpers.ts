import { toDinero } from '@/services/money'
import type Dinero from 'dinero.js'

/** The fields a tariffed row carries: a staged dinero wins, else tariff + currency. */
interface TariffRow {
  tariff?: string | null
  tariff_currency?: string | null
  tariff_dinero?: Dinero.Dinero | null
}

export function rowDinero(row: TariffRow, fallbackCurrency: string) {
  if (row.tariff_dinero) return row.tariff_dinero
  return toDinero(row.tariff || '0.00', row.tariff_currency || fallbackCurrency)
}

/** The zero of a currency: where a total starts before anything is added to it. */
export function zeroDinero(currency: string) {
  return toDinero('0.00', currency)
}

/**
 * A backend money value as dinero, or null when it is absent or unparseable —
 * callers render nothing (a cell) or the zero total (a summary) instead of
 * throwing mid-render.
 */
export function tryToDinero(value: unknown, currency: string): Dinero.Dinero | null {
  if (value === null || value === undefined || value === '') return null
  try {
    return toDinero(String(value), currency)
  } catch {
    return null
  }
}
