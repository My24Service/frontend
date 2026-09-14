import type { MonthListResponse, Statuscode, YearListResponse } from '@/api/types.gen'
import { statusColor } from '../order/status-color'

/** The bar-and-pie pair every block on the stats pages draws. */
export interface ChartPair {
  bar: ChartData
  pie: ChartData
}

export interface ChartData {
  labels: string[]
  datasets: Array<{label?: string; data: Array<number | string>; backgroundColor: string | string[]}>
}

/** The counts-and-percentages dict both endpoints return per bucket. */
type Buckets = Record<string, {count: number; perc: number | string}>

/** The year page's month gradient, as the legacy drew it. */
const YEAR_GRADIENT = [
  '#ff9933', '#ff9c36', '#fea03a', '#fea33d', '#fea741', '#fdaa44', '#fdae48',
  '#fdb14b', '#fdb54f', '#fcb852', '#fcbc56', '#fcbf59', '#fbc35d', '#fbc660',
]

/**
 * A stable colour for the n-th series of a chart: a golden-angle hue walk,
 * so neighbours differ and the same index draws the same colour on every
 * load. The legacy rolled a random colour per label and remembered it for
 * the page's lifetime.
 */
export function seriesColor(index: number): string {
  return `hsl(${Math.round((index * 137.508) % 360)} 70% 55%)`
}

function pair(labels: string[], counts: number[], percentages: Array<number | string>, colors: string | string[], label: string): ChartPair {
  return {
    bar: {labels, datasets: [{label, data: counts, backgroundColor: colors}]},
    pie: {labels, datasets: [{data: percentages, backgroundColor: colors}]},
  }
}

/** One pair per bucket of statuses, coloured by the tenant's statuscodes. */
function statusPairs(
  statusesData: Record<string, {items: Buckets; total: number}>,
  statuscodes: Statuscode[],
  labelFor: (bucket: string, total: number) => string,
): Record<string, ChartPair> {
  const pairs: Record<string, ChartPair> = {}
  for (const [bucket, data] of Object.entries(statusesData)) {
    const labels = Object.keys(data.items)
    pairs[bucket] = pair(
      labels,
      labels.map((code) => data.items[code].count),
      labels.map((code) => data.items[code].perc),
      labels.map((code) => statusColor(statuscodes, code)),
      labelFor(bucket, data.total),
    )
  }
  return pairs
}

export function yearCharts(response: YearListResponse, orderType: string, monthLabels: string[], statuscodes: Statuscode[]) {
  const counts: number[] = []
  const percentages: Array<number | string> = []
  for (let month = 1; month <= 12; month++) {
    const key = String(month).padStart(2, '0')
    const item = response.year_data.items[key]
    counts.push(item?.count ?? 0)
    percentages.push(item?.perc ?? '0.00')
  }
  return {
    year: pair(
      monthLabels,
      counts,
      percentages,
      YEAR_GRADIENT,
      `Total orders for order type: ${orderType} (Total: ${response.year_data.total})`,
    ),
    months: statusPairs(response.statuses_data, statuscodes,
      (month, total) => `Order statuses in month ${month} (Total: ${total})`),
  }
}

export function monthCharts(response: MonthListResponse, orderType: string, weekLabel: (week: string) => string, statuscodes: Statuscode[]) {
  const weeks = Object.keys(response.month_data.items)
  const assigned: Record<string, ChartPair> = {}
  for (const [week, data] of Object.entries(response.assigned_orders_data)) {
    const keys = Object.keys(data.items)
    if (!keys.length) continue
    assigned[week] = pair(
      keys.map((n) => `${n} x`),
      keys.map((n) => data.items[n].count),
      keys.map((n) => data.items[n].perc),
      keys.map((_, index) => seriesColor(index)),
      `Assigned orders in week ${week} (Total: ${data.total})`,
    )
  }
  return {
    month: pair(
      weeks.map(weekLabel),
      weeks.map((week) => response.month_data.items[week].count),
      weeks.map((week) => response.month_data.items[week].perc),
      weeks.map((_, index) => seriesColor(index)),
      `Total orders for order type: ${orderType} (Total: ${response.month_data.total})`,
    ),
    weeks: statusPairs(response.statuses_data, statuscodes,
      (week, total) => `Order statuses in week ${week} (Total: ${total})`),
    assigned,
  }
}
