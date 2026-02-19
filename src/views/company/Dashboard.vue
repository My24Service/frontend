<template>
  <div class="app-page">
    <header><!--
      <div class="page-title">
        <h3>
          <IBiSpeedometer></IBiSpeedometer>
          <span>{{ $trans('Overall statistics')}}</span>
        </h3>
      </div> -->
    </header>

    <div class="section dashboard_section">
      <!-- ROW 1 -->
      <div class="row start_page_row1">
        <div class="col-lgl-6">
          <div class="row">
            <div class="col-lg-3">
              <DashboardTabbedBlock v-if="!isLoading" :tab-list="companyTabs" :title="member.name" pills />
            </div>
            <div class="col-lg-3">
              <DashboardTabbedBlock v-if="!isLoading" :tab-list="companyInfoTabs" :title="$trans('Gegevens')" pills />
            </div>
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" title="Logboek" iconName="card-list">
                <b-table
                    id="activity-table"
                    small
                    :busy='isLoading'
                    :fields="activityFields"
                    :items="activity"
                    responsive="md"
                    class="data-table pt-2 pl-2 pr-2"
                    sort-icon-left>
                    <template #table-busy>
                      <div class="text-center my-2">
                        <br>
                        <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
                        <strong>{{ $trans('Loading...') }}</strong>
                        <br>
                      </div>
                    </template>
                    <template #cell(created)="data">
                      <small>{{  data.item.created }}</small>
                    </template>
                </b-table>
                <!-- <div v-html="companyLog"></div> -->
              </DashboardBlock>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section dashboard_section mt-4">
      <OrderStats
        v-if="statsData"
        :data-in="statsData"
        ref="order-stats"
      />
    </div>

    <div class="panel app-grid">
      <b-row align-v="center">
        <b-col cols="1">
          <BLink @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
          </BLink>
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
            <BLink @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <IBiArrowRight font-scale="1.8"></IBiArrowRight>
            </BLink>
          </div>
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="12">
          <bar-chart
            id="bar-chart-customers"
            v-if="!isLoading && chartdataCustomers"
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
            v-if="!isLoading && pieChartdataOrderTypes"
            :chart-data="pieChartdataOrderTypes"
            :options="pieOptions"
          />
        </b-col>
      </b-row>

      <b-row v-if="barChartdataOrderStatuses.labels">
        <b-col cols="6">
          <bar-chart
            id="bar-chart-order-statuses-1"
            v-if="!isLoading && barChartdataOrderStatuses"
            :chart-data="barChartdataOrderStatuses"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-order-statuses-2"
            v-if="!isLoading && pieChartdataOrderStatuses"
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
            v-if="!isLoading && barChartdataTransactions"
            :chart-data="barChartdataTransactions"
            :options="options"
          />
        </b-col>
        <b-col cols="6">
          <pie-chart
            id="pie-chart-transactions"
            v-if="!isLoading && pieChartdataTransactions"
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
import componentMixin from "@/mixins/common";
import {$trans} from "../../utils";
import {NO_IMAGE_URL} from "../../constants";
import memberModel from "../../models/member/Member";
import activityModel from '@/models/company/Activity.js'

let d = new Date()

export default {
  components: {
    BarChart,
    PieChart,
    OrderStats,
  },
  mixins: [componentMixin],
  data() {
    return {
        member: memberModel.getFields(),

        activity: [],
        activityFields: [
          {key: 'text', label: this.$trans('Activity'), sortable: true},
          {key: 'created', label: this.$trans('Date'), sortable: true},
          {key: 'icons', label: ''},
        ],
        companyTabs: [
        {
          title: 'Foto',
          content: '<img class="section-image" src="'+NO_IMAGE_URL+'"/>'
        },
        {
          title: 'Locate',
          content: '' // <iframe class="mijnKaart" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2439.2961422762787!2d4.810294182413494!3d52.310628559294734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5e1ac04c45af3%3A0xdf35ceb7e66721a7!2sMYSS!5e0!3m2!1snl!2snl!4v1686299469567!5m2!1snl!2snl" width="100%" height="auto" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
        }
      ],
      companyLog: '',
      companyInfoTabs: [
        {
          title: $trans('Address'),
          content: '<div class="myss_box"></div>'
        },
        {
          title: $trans('Contacts'),
          content: ''
        },
      ],
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
    try {
      this.loadData()
    } catch (e) {
      console.error(`error loading data: ${e}`)
    }
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
        //
        this.member = await memberModel.getMe();

        const activityData = await activityModel.list()
        this.activity = activityData.results
        this.companyTabs=[
          {
            title: 'Foto',
            content: '<img class="section-image" src="'+NO_IMAGE_URL+'"/>'
          },
          {
            title: 'Locate',
            content: '<iframe class="mijnKaart" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2439.2961422762787!2d4.810294182413494!3d52.310628559294734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5e1ac04c45af3%3A0xdf35ceb7e66721a7!2sMYSS!5e0!3m2!1snl!2snl!4v1686299469567!5m2!1snl!2snl" width="100%" height="auto" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
          }
        ];

        // this.companyLog = '<table><tr><td><br/><strong>Data kon niet worden geladen</strong></td></tr></table>';
        const contactsHtml = this.member.contacts
          .split(/\r?\n/)
          .filter(line => line.trim() !== "")
          .map(line => `<p>${line}</p>`)
          .join("");

        this.companyInfoTabs = [
            {
              title: $trans('Address'),
              content: '<div class="myss_box">'+
                (!this.member ? '' : '<img src="'+(this.member.companylogo ?? NO_IMAGE_URL)+'" class="myss-logo" alt="Logo"/><ul><li>Gebouw ELM</li><li>'+this.member.address+'</li><li>'+this.member.postal+' '+this.member.city+'</li></ul>')
                +' </div>'
            },
            {
              title: $trans('Contacts'),
              content: contactsHtml,
            },
        ];

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


<style>
.section.dashboard_section {
  padding: 0 1.5rem
}

.section_head {
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 0.1rem solid var(--greyC);
  background: var(--mainC);
}

.section_head h5 {
  font-size: 1rem;
}

.section_block {
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0.65rem 0.8rem 0 rgba(0, 0, 0, 0.2);
}

.myss_box ul {
  list-style: none;
  padding: 0;
}

.myss_box ul li {
  padding: 0.35rem 0;
  border-bottom: 0.1rem solid var(--greyC);
  /*font-size: 1.45rem;*/
}

.myss_box ul li:last-child {
  border-bottom: 0;
}

.myss_box ul li:first-child {
  color: var(--hoverC);
  font-weight: 900;
  /*font-size: 1.5rem;*/
}

.myss-logo {
    height: 5rem;
    padding: 0;
    margin: 0 auto;
    display: block;
}

.row .section_block .tabs .tab-content.mt-3 {
  margin-top: 0;
  /* padding: 8px; */
  /* justify-content: center; */
}

.start_page_row1 .row .section_block {
  height: 20rem;
}

.start_page_row1 .row .section_block .tabs ul.nav-pills {
  margin: 4px;
  justify-content: center;
}

.start_page_row1 .row .section_block .tab-content iframe {
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
  outline: none;
  border: none;
}

.start_page_row1 .row .section_block .tabs .nav-item .nav-link {
  border-radius: 4px;
  padding: 4px 9px;
}

div.section.dashboard_section div.row.start_page_row1 div.section_block div.tabs div.tab-content div img.section-image,
div.section_block div.tabs div.tab-content.mt-3 div.tab-pane div img.section-image {
  border-radius: 0.5rem;
  object-fit: cover;
  max-height: 180px;
  width: 100%;
}

div.section.dashboard_section div.row div div.section_block div.tabs div.tab-content.section_block_content {
  border-top: 0.1rem solid var(--greyC) !important;
  padding: 0.7rem !important;
}

div.section.dashboard_section div.row div.section_block div.section_content div.table-responsive-md.data-table {
  padding: 0.5rem !important;
}

</style>
