

/** The golden-angle step both colour helpers walk. */
const GOLDEN_ANGLE = 137.508

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
  '#fdb14b', '#fdb54f', '#fcb852', '#fcbc56', '#fcbf59',
]

/**
 * A stable colour for the n-th series of a chart: a golden-angle hue walk,
 * so neighbours differ and the same index draws the same colour on every
 * load. The legacy rolled a random colour per label and remembered it for
 * the page's lifetime.
 */
export function seriesColor(index: number): string {
  const hue = (index * GOLDEN_ANGLE) % 360
  return `oklch(0.78 0.14 ${hue})`
}

function pair(labels: string[], counts: number[], percentages: Array<number | string>, colors: string[], label: string, barColor?: string | string[]): ChartPair {
  return {
    bar: {labels, datasets: [{label, data: counts, backgroundColor: barColor ?? colors}]},
    pie: {labels, datasets: [{data: percentages, backgroundColor: colors}]},
  }
}

/**
 * The colour for a status bucket. Buckets are keyed by the statuscode name
 * the server tallied the row under, so the colour is that code's — looked
 * up by exact name, never fuzzy-matched. Grey when the tally outlived its
 * code or the code has no colour.
 */
function bucketColor(statuscodes: Api.Statuscode[], code: string): string {
  const color = statuscodes.find((item) => item.statuscode === code)?.color
  if (!color) return '#ccc'
  return color.startsWith('#') ? color : `#${color}`
}

/** One pair per bucket of statuses, coloured by the tenant's statuscodes. */
function statusPairs(
  statusesData: Record<string, {items: Buckets; total: number}>,
  statuscodes: Api.Statuscode[],
  labelFor: (bucket: string, total: number) => string,
): Record<string, ChartPair> {
  const pairs: Record<string, ChartPair> = {}
  for (const [bucket, data] of Object.entries(statusesData)) {
    const labels = Object.keys(data.items)
    pairs[bucket] = pair(
      labels,
      labels.map((code) => data.items[code].count),
      labels.map((code) => data.items[code].perc),
      labels.map((code) => bucketColor(statuscodes, code)),
      labelFor(bucket, data.total),
    )
  }
  return pairs
}

export function yearCharts(response: Api.YearListResponse, orderType: string, monthLabels: string[], statuscodes: Api.Statuscode[]) {
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

export function monthCharts(response: Api.MonthListResponse, orderType: string, weekLabel: (week: string) => string, statuscodes: Api.Statuscode[]) {
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

/* The legacy company/branch insights charts (`OrderStats`, `OrderTypesPie`).
 *
 * Both drew the same four graphs from the same four payloads, with the same
 * small-slice thresholds, but each carried its own colour roll - random hex
 * in `OrderStats`, the golden-angle walk in `OrderTypesPie` - and its own
 * copy of the chart options. The builders below are the one copy both
 * delegate to now.
 */

/** A stable colour per label: the first label takes series 0, the next new label series 1, and so on. */
export function createLabelColors(): (label: string) => string {
  const assigned = new Map<string, string>()
  return (label: string) => {
    let color = assigned.get(label)
    if (!color) {
      color = seriesColor(assigned.size)
      assigned.set(label, color)
    }
    return color
  }
}

/** A stacked series is dropped when any of its slices falls below this share. */
export const STACKED_SERIES_THRESHOLD = 0.07

/** An order-type slice is dropped from the fourth graph below this share. */
export const ORDER_TYPE_SLICE_THRESHOLD = 0.15

/** The long month name the legacy drew with moment, e.g. `januari`. */
export function monthName(month: number, locale = 'nl'): string {
  return new Intl.DateTimeFormat(locale, {month: 'long'}).format(new Date(2022, month - 1, 1))
}

/** A bar chart with no datalabels, as the legacy totals bars drew. */
export const hiddenLabelBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      formatter: () => '',
      color: '#fff',
    },
  },
}

/** A pie chart labelling every slice with its percentage, in white. */
export const percentPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      formatter: (value: unknown) => `${value}%`,
      color: '#fff',
    },
  },
}

/** One count-and-percentage tally, as every legacy stats payload carries them. */
export interface SliceTally {
  count: number
  perc: number | string
}

/**
 * One stacked dataset per order type over the given buckets.
 *
 * A series is dropped wholesale when any of its slices falls below
 * `threshold` - the legacy drew it that way rather than zeroing the slice,
 * so a dropped series keeps its bucket's stack comparable across types.
 */
export function buildStackedDatasets(
  orderTypes: string[],
  buckets: string[],
  counts: Record<string, Record<string, SliceTally>>,
  getColor: (label: string) => string,
  threshold: number = STACKED_SERIES_THRESHOLD,
): {datasets: Array<{label: string; backgroundColor: string; data: number[]}>} {
  const datasets: Array<{label: string; backgroundColor: string; data: number[]}> = []
  for (const orderType of orderTypes) {
    let dataOk = true
    const data: number[] = []
    for (const bucket of buckets) {
      const bucketCounts = counts[bucket]
      if (bucketCounts && orderType in bucketCounts) {
        if (parseFloat(String(bucketCounts[orderType].perc)) < threshold) {
          dataOk = false
          break
        }
        data.push(bucketCounts[orderType].count)
      } else {
        data.push(0)
      }
    }
    if (dataOk) {
      datasets.push({label: orderType, backgroundColor: getColor(orderType), data})
    }
  }
  return {datasets}
}

/** The totals bar-and-pie pair over the twelve months. */
export function buildMonthTotals(
  orderCounts: Record<string, SliceTally>,
  getColor: (label: string) => string,
  locale = 'nl',
  // The legacy drew the totals bar in one flat blue and only the pie
  // per-month, so the bar colour stays a parameter rather than a series.
  barColor: string | string[] = 'blue',
): ChartPair {
  const labels = Array.from({length: 12}, (_, index) => monthName(index + 1, locale))
  const counts: number[] = []
  const percentages: Array<number | string> = []
  const colors: string[] = []
  for (let month = 1; month <= 12; month++) {
    const key = `${month}`
    colors.push(getColor(key))
    const item = orderCounts[key]
    counts.push(item?.count ?? 0)
    percentages.push(item?.perc ?? '0.00')
  }
  return pair(labels, counts, percentages, colors, '', barColor)
}

/**
 * The fourth graph: the order types above the slice threshold, as the bar of
 * counts and the pie of percentages `OrderStats` and `OrderTypesPie` share.
 */
export function buildOrderTypeTotals(
  orderTypes: Record<string, SliceTally>,
  getColor: (label: string) => string,
  threshold: number = ORDER_TYPE_SLICE_THRESHOLD,
): {
  labels: string[]
  colors: string[]
  counts: number[]
  percentages: Array<number | string>
} {
  const labels: string[] = []
  const colors: string[] = []
  const counts: number[] = []
  const percentages: Array<number | string> = []
  for (const [orderType, tally] of Object.entries(orderTypes)) {
    if (parseFloat(String(tally.perc)) > threshold) {
      labels.push(orderType)
      colors.push(getColor(orderType))
      counts.push(tally.count)
      percentages.push(tally.perc)
    }
  }
  return {labels, colors, counts, percentages}
}
