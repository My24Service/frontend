<script setup>
import {onMounted, ref} from "vue";
import {OrderService} from "@/models/orders/Order";
import PieChart from "@/features/shared/charts/PieChart.vue"
import {
  buildOrderTypeTotals,
  createLabelColors,
  percentPieOptions,
} from "@/features/order/stats/chart-data"
// import ChartJsPluginDataLabels from "chartjs-plugin-datalabels";

const props = defineProps({
  equipmentPk: {
    type: [Number, String],
    required: false
  },
  locationPk: {
    type: [Number, String],
    required: false
  }
})

const chartdataOrderTypesPie = ref({})
const isLoading = ref(false)
const orderService = new OrderService()
const options = percentPieOptions
const getColor = createLabelColors()

async function fillPieData() {
  isLoading.value = true
  try {
    let orderTypeStatsData
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
  <b-overlay :show="isLoading" rounded="sm">
    <pie-chart
      v-if="Object.keys(chartdataOrderTypesPie).length"
      id="pie-chart-order-types"
      :chart-data="chartdataOrderTypesPie"
      :options="options"
    />
  </b-overlay>
</template>

<style scoped>

</style>
