import { toDinero } from '@/services/money'
import type Dinero from 'dinero.js'

interface TariffRow {
  tariff?: string | null
  tariff_currency?: string | null
  tariff_dinero?: Dinero.Dinero | null
}

export function rowDinero(row: TariffRow, fallbackCurrency: string) {
  if (row.tariff_dinero) return row.tariff_dinero
  return toDinero(row.tariff || '0.00', row.tariff_currency || fallbackCurrency)
}

export function zeroDinero(currency: string) {
  return toDinero('0.00', currency)
}

export function tryToDinero(value: unknown, currency: string): Dinero.Dinero | null {
  if (value === null || value === undefined || value === '') return null
  try {
    return toDinero(String(value), currency)
  } catch {
    return null
  }
}
