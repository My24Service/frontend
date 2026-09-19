<script setup lang="ts">

import {OrderService} from "@/models/orders/Order";
import PieChart from "@/features/shared/charts/PieChart.vue"
import type {ChartData, SliceTally} from "@/features/order/stats/chart-data"
import {
  buildOrderTypeTotals,
  createLabelColors,
  percentPieOptions,
} from "@/features/order/stats/chart-data"
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

async function fillPieData() {
  isLoading.value = true
  try {
    let orderTypeStatsData: {order_types: Record<string, SliceTally>}
    if (props.equipmentPk) {
      orderTypeStatsData = await orderService.getOrderTypesStatsEquipment(props.equipmentPk)
    } else if (props.locationPk) {
      orderTypeStatsData = await orderService.getOrderTypesStatsLocation(props.locationPk)
    } else {
      orderTypeStatsData = await orderService.getOrderTypesStatsBranch()
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
