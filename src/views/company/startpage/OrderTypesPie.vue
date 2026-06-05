<script setup>
import {onMounted, ref} from "vue";
import {OrderService} from "@/models/orders/Order.js";
import PieChart from "@/components/PieChart.vue"
// import ChartJsPluginDataLabels from "chartjs-plugin-datalabels";

const chartdataOrderTypesPie = ref({})
const orderService = new OrderService()
const options = {
  responsive: true,
    maintainAspectRatio: false,
    plugins: {
    datalabels: {
      formatter: (value, _ctx) => {
        return `${value}%`
      },
        color: '#fff',
    }
  }
}
const colorsOrderTypes = {}
const orderTypesDataPie = []
const orderTypesLabels = []
const orderTypesColors = []
const leftOutOrderTypes = {}

function getRandomColorOrderType(txt) {
  if (!(txt in colorsOrderTypes)) {
    colorsOrderTypes[txt] = `#${Math.floor(Math.random()*16777215).toString(16)}`
  }

  return colorsOrderTypes[txt]
}

async function fillPieData() {
  const orderTypeStatsData = await orderService.getOrderTypesStatsBranch()
  const thresholdOrderType = .15
  for (const [orderType, _data] of Object.entries(orderTypeStatsData.order_types)) {
    if (parseFloat(_data.perc) > thresholdOrderType) {
      orderTypesLabels.push(orderType)
      orderTypesColors.push(getRandomColorOrderType(orderType))
      orderTypesDataPie.push(_data.perc)
    } else {
      if (!(orderType in leftOutOrderTypes.data)) {
        leftOutOrderTypes.data[orderType] = []
      }
      leftOutOrderTypes.count++;
      leftOutOrderTypes.data[orderType].push({
        order_type: orderType,
        data: _data
      })
    }
  }

  chartdataOrderTypesPie.value = {
    labels: orderTypesLabels,
    datasets: [{
      data: orderTypesDataPie,
      backgroundColor: orderTypesColors,
    }]
  }
}

onMounted(async () => {
  await fillPieData()
})
</script>

<template>
  <pie-chart
    v-if="chartdataOrderTypesPie"
    id="pie-chart-order-types"
    :chart-data="chartdataOrderTypesPie"
    :options="options"
  />
</template>

<style scoped>

</style>
