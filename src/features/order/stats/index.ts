export { default as ChartPairRow } from './ChartPairRow.vue'
export { default as MonthStats } from './MonthStats.vue'
export { default as StatsPage } from './StatsPage.vue'
export { default as YearStats } from './YearStats.vue'
export {
  seriesColor,
  yearCharts,
  monthCharts,
  createLabelColors,
  STACKED_SERIES_THRESHOLD,
  ORDER_TYPE_SLICE_THRESHOLD,
  monthName,
  hiddenLabelBarOptions,
  percentPieOptions,
  buildStackedDatasets,
  buildMonthTotals,
  buildOrderTypeTotals,
  type ChartPair,
  type ChartData,
  type SliceTally,
} from './chart-data'
export { useOrderStatsQuery } from './use-order-stats-query'
