<script setup lang="ts">

import {OrderService} from "@/models/orders/Order";
import { PieChart } from '@/features/shared'
import {
  type ChartData,
  type SliceTally,
  buildOrderTypeTotals,
  createLabelColors,
  percentPieOptions,
} from '@/features/order'
// import ChartJsPluginDataLabels from "chartjs-plugin-datalabels";

const props = defineProps<{
  equipmentPk?: number | string
  locationPk?: number | string
}>()

const chartdataOrderTypesPie = ref<ChartData | null>(null)
const isLoading = ref(false)
const orderService = new OrderService()
const options = percentPieOptions
const getColor = createLabelColors()

/**
 * The order-types stats payload, narrowed off the wire. The stats service is
 * shared with untyped callers, so its answer arrives untyped; tallies that
 * are missing or misshapen are dropped rather than crashing the pie.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toOrderTypeStats(data: unknown): { order_types: Record<string, SliceTally> } {
  if (!isRecord(data) || !isRecord(data.order_types)) {
    return { order_types: {} }
  }

  const tallies: Record<string, SliceTally> = {}
  for (const [orderType, tally] of Object.entries(data.order_types)) {
    if (!isRecord(tally) || typeof tally.count !== 'number') {
      continue
    }
    if (typeof tally.perc !== 'number' && typeof tally.perc !== 'string') {
      continue
    }
    tallies[orderType] = { count: tally.count, perc: tally.perc }
  }
  return { order_types: tallies }
}

async function fillPieData() {
  isLoading.value = true
  try {
    let orderTypeStatsData: {order_types: Record<string, SliceTally>}
    if (props.equipmentPk) {
      orderTypeStatsData = toOrderTypeStats(await orderService.getOrderTypesStatsEquipment(props.equipmentPk))
    } else if (props.locationPk) {
      orderTypeStatsData = toOrderTypeStats(await orderService.getOrderTypesStatsLocation(props.locationPk))
    } else {
      orderTypeStatsData = toOrderTypeStats(await orderService.getOrderTypesStatsBranch())
    }
    const totals = buildOrderTypeTotals(orderTypeStatsData.order_types, getColor)

    chartdataOrderTypesPie.value = {
      labels: totals.labels,
      datasets: [{
        data: totals.percentages,
        backgroundColor: totals.colors,
      }]
    }
    isLoading.value = false
  } catch (e) {
    isLoading.value = false
    console.error('error loading order types status', e)
  }
}

onMounted(async () => {
  await fillPieData()
})
</script>

<template>
  <BOverlay :show="isLoading" rounded="sm">
    <pie-chart
      v-if="chartdataOrderTypesPie"
      id="pie-chart-order-types"
      :chart-data="chartdataOrderTypesPie"
      :options="options"
    />
  </BOverlay>
</template>

<style scoped>

</style>
