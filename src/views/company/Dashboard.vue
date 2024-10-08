<template>
  <div class="app-page">
    <header>
      <h3>{{ $trans('Overall statistics')}}</h3>
    </header>
    <div class="panel">
      <OrderStats
        :data-in="statsData"
        ref="order-stats"
      />
    </div>

    <div class="panel app-grid">
      <b-row align-v="center">
        <b-col cols="1">
          <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="10" class="text-center">
          <h4>{{ $trans(`Dashboard for ${year}`) }}</h4>
          <b-row>
            <b-col cols="6">
            </b-col>
            <b-col cols="6">
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="1">
          <div class="float-right">
            <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="12">
          <bar-chart
            id="bar-chart-customers"
            v-if="!isLoading"
            :chart-data="chartdataCustomers"
            :options="options"
          />
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="12">
          <bar-chart
            id="bar-chart-sales-customers"
            v-if="!isLoading && chartdataSalesCustomers.labels && chartdataSalesCustomers.labels.length"
            :chart-data="chartdataSalesCustomers"
            :options="options"
          />
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="12">
          <bar-chart
            id="bar-chart-sales-materials"
            v-if="!isLoading && chartdataSalesCustomers.labels && chartdataSalesCustomers.labels.length"
            :chart-data="chartdataSalesMaterials"
            :options="options"
          />
        </b-col>
      </b-row>

      <b-row v-if="barChartdataOrderTypes.labels && barChartdataOrderTypes.labels.length <= orderTypeDisplayThreshold">
        <b-col cols="6">
          <bar-chart
            id="bar-chart-order-types-3"
            v-if="!isLoading"
            :chart-data="barChartdataOrderTypes"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-order-types-4"
            v-if="!isLoading"
            :chart-data="pieChartdataOrderTypes"
            :options="pieOptions"
          />
        </b-col>
      </b-row>

      <b-row v-if="barChartdataOrderStatuses.labels">
        <b-col cols="6">
          <bar-chart
            id="bar-chart-order-statuses-1"
            v-if="!isLoading"
            :chart-data="barChartdataOrderStatuses"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-order-statuses-2"
            v-if="!isLoading"
            :chart-data="pieChartdataOrderStatuses"
            :options="pieOptions"
          />
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="12">
          <bar-chart
            id="bar-chart-assigned-count"
            v-if="!isLoading && chartdataAssignedCount.labels && chartdataAssignedCount.labels.length"
            :chart-data="chartdataAssignedCount"
            :options="options"
          />
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="12">
          <bar-chart
            id="bar-chart-top-materials"
            v-if="!isLoading && chartdataTopMaterials.labels && chartdataTopMaterials.labels.length"
            :chart-data="chartdataTopMaterials"
            :options="options"
          />
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="6">
          <bar-chart
            id="bar-chart-transactions"
            v-if="!isLoading"
            :chart-data="barChartdataTransactions"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-transactions"
            v-if="!isLoading"
            :chart-data="pieChartdataTransactions"
            :options="pieOptions"
          />
        </b-col>
      </b-row>

    </div>
  </div>
</template>

<script>
import BarChart from "../../components/BarChart.vue"
import PieChart from "../../components/PieChart.vue"
import OrderStats from "../../components/OrderStats.vue"
import dashboardModel from '../../models/company/Dashboard.js'
import {OrderService} from "@/models/orders/Order";

let d = new Date()

export default {
  components: {
    BarChart,
    PieChart,
    OrderStats,
  },
  data() {
    return {
      chartdataCustomers: {},

      orderTypeDisplayThreshold: 15,
      pieChartdataOrderTypes: {},
      barChartdataOrderTypes: {},

      orderStatusDisplayThreshold: 50,
      pieChartdataOrderStatuses: {},
      barChartdataOrderStatuses: {},

      pieChartdataTransactions: {},
      barChartdataTransactions: {},

      chartdataSalesCustomers: {},
      chartdataSalesMaterials: {},

      chartdataAssignedCount: {},

      chartdataTopMaterials: {},

      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
      pieOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
         datalabels: {
            formatter: (value, ctx) => {
              let datasets = ctx.chart.data.datasets;
              if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
                let sum = datasets[0].data.reduce((a, b) => a + b, 0);
                return Math.round((value / sum) * 100) + '%';
              } else {
                return "";
              }
            },
            color: '#fff',
          }
        }
      },
      isLoading: false,
      year: d.getYear() + 1900,
      statsData: null,
      orderService: new OrderService()
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    nextYear() {
      this.year = this.year + 1
      this.loadData()
    },
    backYear() {
      this.year = this.year - 1
      this.loadData()
    },
    async loadData() {
      this.isLoading = true

      dashboardModel.setListArgs(`year=${this.year}`)
      try {
        const data = await dashboardModel.list()

        // CUSTOMERS: bar graph top customers
        let graphDataCustomers = [], labelsCustomers = [];
        for (let i=0; i<data.top_50_customers.length; i++) {
          if (data.top_50_customers[i].count === 0) {
            continue;
          }

          graphDataCustomers.push(data.top_50_customers[i].count)
          labelsCustomers.push(data.top_50_customers[i].customer_name)
        }

        this.chartdataCustomers = {
          labels: labelsCustomers,
          datasets: [{
            label: `Top # orders by customer in ${this.year}`,
            data: graphDataCustomers,
            backgroundColor: '#f87979',
          }]
        }

        // STATUSES: pie & bar graph, percentages
        let pieGraphDataOrderStatuses = [], barGraphDataOrderStatuses = [], labelsOrderStatuses = [];
        if (data.order_status_counts) {
          for (const [orderStatus, _data] of Object.entries(data.order_status_counts)) {
            if (orderStatus === 'total') {
              continue;
            }

            if (_data.total === 0) {
              continue;
            }

            labelsOrderStatuses.push(_data.text)
            pieGraphDataOrderStatuses.push(_data.perc)
            barGraphDataOrderStatuses.push(_data.total)
          }
        }

        this.pieChartdataOrderStatuses = {
          labels: labelsOrderStatuses,
          datasets: [{
            label: `Order statuses in ${this.year}`,
            data: pieGraphDataOrderStatuses,
            backgroundColor: [
              '#4dc9f6',
              '#f67019',
              '#f53794',
              '#537bc4',
              '#acc236',
              '#166a8f',
              '#00a950',
              '#58595b',
              '#8549ba'
            ],
          }]
        }

        this.barChartdataOrderStatuses = {
          labels: labelsOrderStatuses,
          datasets: [{
            label: `Order statuses in ${this.year}`,
            data: barGraphDataOrderStatuses,
            backgroundColor: '#f87979',
          }]
        }

        // ORDER TYPES: pie & bar graph, percentages
        let pieGraphDataOrderTypes = [], barGraphDataOrderTypes = [], labelsOrderTypes = [];
        if (data.order_type_counts) {
          for (const [orderType, _data] of Object.entries(data.order_type_counts)) {
            if (orderType === 'total') {
              continue;
            }

            if (_data.total === 0) {
              continue;
            }

            labelsOrderTypes.push(_data.text)
            pieGraphDataOrderTypes.push(_data.perc)
            barGraphDataOrderTypes.push(_data.total)
          }
        }

        this.pieChartdataOrderTypes = {
          labels: labelsOrderTypes,
          datasets: [{
            label: `Order types in ${this.year}`,
            data: pieGraphDataOrderTypes,
            backgroundColor: [
              '#4dc9f6',
              '#f67019',
              '#f53794',
              '#537bc4',
              '#acc236',
              '#166a8f',
              '#00a950',
              '#58595b',
              '#8549ba'
            ],
          }]
        }

        this.barChartdataOrderTypes = {
          labels: labelsOrderTypes,
          datasets: [{
            label: `Order types in ${this.year}`,
            data: barGraphDataOrderTypes,
            backgroundColor: '#f87979',
          }]
        }

        // top customers by profit: bar graph
        let graphDataSalesCustomers = [], labelsSalesCustomers = [];
        for (let i=0; i<data.top_customer_sales_by_profit.length; i++) {
          if (data.top_customer_sales_by_profit[i].profit === 0) {
            continue;
          }

          graphDataSalesCustomers.push(data.top_customer_sales_by_profit[i].profit)
          labelsSalesCustomers.push(data.top_customer_sales_by_profit[i].customer_name)
        }

        this.chartdataSalesCustomers = {
          labels: labelsSalesCustomers,
          datasets: [{
            label: `Sales profit by customer in ${this.year} in EUR`,
            data: graphDataSalesCustomers,
            backgroundColor: '#f87979',
          }]
        }

        // assigned count: bar graph
        let graphDataAssignedCount = [], labelsAssignedCount = [];
        if (data.assigned_count.length > 1) {
          for (let i=0; i<data.assigned_count.length; i++) {
            if (data.assigned_count[i].assigned_count === 0) {
              continue;
            }

            graphDataAssignedCount.push(data.assigned_count[i].assigned_count)
            labelsAssignedCount.push(`${data.assigned_count[i].first_name} ${data.assigned_count[i].last_name}`)
          }
        }

        this.chartdataAssignedCount = {
          labels: labelsAssignedCount,
          datasets: [{
            label: `Assigned count in ${this.year}`,
            data: graphDataAssignedCount,
            backgroundColor: '#f87979',
          }]
        }

        // top materials used: bar graph
        let graphDataTopMaterials = [], labelsTopMaterials = [];
        for (let i=0; i<data.top_materials_used.length; i++) {
          if (data.top_materials_used[i].num_used === 0) {
            continue;
          }

          graphDataTopMaterials.push(data.top_materials_used[i].num_used)
          labelsTopMaterials.push(data.top_materials_used[i].materialname)
        }

        this.chartdataTopMaterials = {
          labels: labelsTopMaterials,
          datasets: [{
            label: `Top materials used in ${this.year}`,
            data: graphDataTopMaterials,
            backgroundColor: '#f87979',
          }]
        }


        // top materials by profit: bar graph
        let graphDataSalesMaterials = [], labelsSalesMaterials = [];
        for (let i=0; i<data.top_material_sales_by_profit.length; i++) {
          if (data.top_material_sales_by_profit[i].profit === 0) {
            continue;
          }

          graphDataSalesMaterials.push(data.top_material_sales_by_profit[i].profit)
          labelsSalesMaterials.push(data.top_material_sales_by_profit[i].material_name)
        }

        this.chartdataSalesMaterials = {
          labels: labelsSalesMaterials,
          datasets: [{
            label: `Sales profit by material in ${this.year} in EUR`,
            data: graphDataSalesMaterials,
            backgroundColor: '#f87979',
          }]
        }


        // transactions: pie & bar graph, percentages
        let pieGraphDataTransactions = [], barGraphDataTransactions = [], labelsTransactions = [];
        if (data.transactions) {
          for (const [transaction, _data] of Object.entries(data.transactions)) {
            if (transaction === 'total') {
              continue;
            }

            if (_data.total === 0) {
              continue;
            }

            labelsTransactions.push(_data.text)
            pieGraphDataTransactions.push(_data.perc)
            barGraphDataTransactions.push(_data.total)
          }
        }

        this.pieChartdataTransactions = {
          labels: labelsTransactions,
          datasets: [{
            label: `Transactions in ${this.year}`,
            data: pieGraphDataTransactions,
            backgroundColor: [
              '#4dc9f6',
              '#f67019',
              '#f53794',
              '#537bc4',
              '#acc236',
              '#166a8f',
              '#00a950',
              '#58595b',
              '#8549ba'
            ],
          }]
        }

        this.barChartdataTransactions = {
          labels: labelsTransactions,
          datasets: [{
            label: `Transactions in ${this.year}`,
            data: barGraphDataTransactions,
            backgroundColor: '#f87979',
          }]
        }

        if (this.hasBranches) {
          const orderTypeStatsData = await this.orderService.getOrderTypesStatsBranch()
          const monthsStatsData = await this.orderService.getMonthsStatsBranch()
          const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsBranch()
          const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsBranch()

          this.statsData = {
            orderTypeStatsData,
            monthsStatsData,
            orderTypesMonthStatsData,
            countsYearOrdertypeStats
          }

          this.isLoading = false

          return
        }

        const orderTypeStatsData = await this.orderService.getOrderTypesStatsCustomer()
        const monthsStatsData = await this.orderService.getMonthsStatsCustomer()
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsCustomer()
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsCustomer()

        this.statsData = {
          orderTypeStatsData,
          monthsStatsData,
          orderTypesMonthStatsData,
          countsYearOrdertypeStats
        }

        this.isLoading = false
      } catch(error) {
        console.log('error getting dashboard data', error)
        this.isLoading = false
      }
    }
  },
}
</script>
