import { toDinero } from '@/utils'

export function rowDinero(row: { tariff?: string | null; tariff_currency?: string | null; tariff_dinero?: ReturnType<typeof toDinero> | null }, fallbackCurrency: string) {
  const d = (row as { tariff_dinero?: ReturnType<typeof toDinero> | null }).tariff_dinero
  if (d) return d
  return toDinero(row.tariff || '0.00', row.tariff_currency || fallbackCurrency)
}
