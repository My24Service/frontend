<template>
  <div class="app-page start-page">
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
      <div class="row dashboard_row">
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

    <div class="section dashboard_section row dashboard_row start_page_row2 pb-2 align-items-stretch pt-4">

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                              <i class="bi bi-building-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Kantoor&shy;oppervlak vvo</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">1400 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-building-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Bedrijfs&shy;ruimte oppervlak</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary ">2000 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-p-square-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Parkeerplaatsen</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary ">48</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-pc-display-horizontal"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">m² vvo per werkplek</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">18 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-people-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Werkplek per medewerker</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">1</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-pc-display-horizontal"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">Werkplek per FTE</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">1</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">m² vvo per mede&shy;werker</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">12 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6 pb-3">
            <div class="card d-flex flex-column h-100" style="cursor: pointer">
                <div class="card-body">
                    <div class="d-flex justify-content-between p-md-1">
                        <div class="d-flex flex-row card-left">
                            <div class="align-self-center">
                                <i class="bi bi-square-fill"></i>
                            </div>
                            <div>
                                <h6 class="text-primary mt-2 fw-bold">m² vvo per FTE</h6>
                            </div>
                        </div>
                        <div class="align-self-center">
                            <h6 class="mb-0 fw-bold text-secondary">10 m²</h6>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section dashboard_section mt-2">
      <div class="row dashboard_row">
        <div class="col-lgl-6">
          <div class="row">
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" title="Nieuwe documenten - Techniek" iconName="wrench-adjustable">
                <div class="table_scroll table-responsive-md data-table pt-2 pl-2 pr-2">
                  <table class="table b-table table-sm table-docs">
                    <thead>
                    <tr>
                      <th>Document</th>
                      <th>Van</th>
                      <th>Datum</th>
                      <th>Bestand</th>
                    </tr>
                    </thead>
                    <tbody>

                    <tr>
                      <td class="align-middle"><span class="badge">Nieuw</span> Servicecontract liften</td>
                      <td class="align-middle">Otis B.V. </td>
                      <td class="align-middle">10-05-23 </td>
                      <td class="align-middle">
                        <i class="bi bi-filetype-pdf fs-3"></i>
                      </td>
                    </tr>
                    <tr>
                      <td class="align-middle"><span class="badge">Nieuw</span> Contract WTW onderhoud </td>
                      <td class="align-middle">Feenstra B.V. </td>
                      <td class="align-middle">07-04-23 </td>
                      <td class="align-middle">
                        <i class="bi bi-filetype-pdf fs-3"></i>
                      </td>
                    </tr>
                    <tr>
                      <td class="align-middle"><span class="badge">Nieuw</span> Service Zonnepanelen</td>
                      <td class="align-middle">Solar GMBH </td>
                      <td class="align-middle">05-07-23 </td>
                      <td class="align-middle">
                        <i class="bi bi-filetype-pdf fs-3"></i>
                      </td>
                    </tr>

                    </tbody>
                  </table>
                </div>
              </DashboardBlock>
            </div>
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" title="Nieuwe documenten - Facilitair" iconName="hand-index">
                <div class="table_scroll table-responsive-md data-table pt-2 pl-2 pr-2">
                  <table class="table b-table table-sm table-docs">
                    <thead>
                    <tr>
                      <th>Document</th>
                      <th>Van</th>
                      <th>Datum</th>
                      <th>Bestand</th>
                    </tr>
                    </thead>
                    <tbody>

                    <tr>
                      <td class="align-middle"><span class="badge">Nieuw</span> Contract Schoonmaak</td>
                      <td class="align-middle">Feenstra B.V.</td>
                      <td class="align-middle">10-05-23</td>
                      <td class="align-middle">
                        <i class="bi bi-filetype-pdf fs-3"></i>
                      </td>
                    </tr>
                    <tr>
                      <td class="align-middle"><span class="badge">Nieuw</span> Beveiliging (meldkamer)</td>
                      <td class="align-middle">Secure B.V.</td>
                      <td class="align-middle">07-04-23</td>
                      <td class="align-middle">
                        <i class="bi bi-filetype-pdf fs-3"></i>
                      </td>
                    </tr>
                    <tr>
                      <td class="align-middle"><span class="badge">Nieuw</span> Contract Groenvoorziening</td>
                      <td class="align-middle">Green Blue B.V.</td>
                      <td class="align-middle">05-07-23</td>
                      <td class="align-middle">
                        <i class="bi bi-filetype-pdf fs-3"></i>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </DashboardBlock>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section dashboard_section mt-4">
      <DashboardBlock v-if="!isLoading" title="Schedule" iconName="calendar">
        <div class="p-1">
        <OrdersSchedule />
        </div>
      </DashboardBlock>
    </div>

    <div class="section dashboard_section mt-4">
      <StartpageOrderStats
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
import StartpageOrderStats from "@/components/StartpageOrderStats.vue";
import dashboardModel from '../../models/company/Dashboard.js'
import {OrderService} from "@/models/orders/Order";
import componentMixin from "@/mixins/common";
import {$trans} from "../../utils";
import {NO_IMAGE_URL} from "../../constants";
import memberModel from "../../models/member/Member";
import activityModel from '@/models/company/Activity.js'
import OrdersSchedule from "../orders/Schedule.vue";

let d = new Date()

export default {
  components: {
    OrdersSchedule,
    BarChart,
    PieChart,
    StartpageOrderStats,
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
            content: '<img src="'+(this.member.companylogo ?? NO_IMAGE_URL)+'" alt="logo"/>'
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
  border-bottom: 0.1rem solid #eee;
  background: #eee;
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
}

.myss_box ul li:last-child {
  border-bottom: 0;
}

.myss_box ul li:first-child {
  color: var(--hoverC);
  font-weight: 900;
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

.dashboard_row .row .section_block {
  height: 20rem;
}

.dashboard_row_expand .row .section_block {
  height: min-content !important;
}

.dashboard_row .row .section_block .tabs ul.nav-pills {
  margin: 4px;
  justify-content: center;
}

.dashboard_row .row .section_block .tab-content iframe {
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
  outline: none;
  border: none;
}

.dashboard_row .row .section_block .tabs .nav-item .nav-link {
  border-radius: 4px;
  padding: 4px 9px;
}

div.section.dashboard_section div.row.dashboard_row div.section_block div.tabs div.tab-content div img.section-image,
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

table#activity-table thead {
  position: sticky;
  top: 0;
}

table#activity-table tr {
  background-color: #ff0000 !important;
}

.section.dashboard_section .card {
  margin-top: 0.2em;
}

.section.dashboard_section .card .card-body {
  padding: 0.2em;
}

.card-left > div.align-self-center {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  border-radius: 10rem;
  border: 0.1rem solid var(--greyC);
  flex: 0 0 auto;
  justify-content: center;
  background: var(--bs-secondary);
  margin-top: 0.4rem;
}

.card-left {
  align-items: center;
  gap: 1rem;
}

.card-left i.bi {
  color: white;
  font-size: 1.5em;
}

.section.dashboard_section .card {
  box-shadow: 0 0.65rem 0.8rem 0 rgba(0, 0, 0, 0.2);
}

.section.dashboard_section .card .card-body .card-left h6.text-primary {
  color: #000000 !important;
}

.card-body h6.text-secondary {
  text-align: right;
  font-size: 0.9rem;
  margin-left: 2rem;
  white-space: nowrap;
  color: #828282 !important;
}

span.badge {
  background-color: var(--bs-secondary);
}

table.table-docs tr td {
  height: 2em;
}

.app-page {
  background-image: none !important;
  background-color: #fff !important;
}

.app-page > header {
  padding: 0;
  min-height: 3rem !important;
}

.main-menu nav .page-subnav ul.nav a:hover,
.main-menu nav .page-subnav ul.nav a:focus,
.main-menu nav .page-subnav ul.nav a:active,
.main-menu nav .page-subnav ul.nav a.router-link-active,
.main-menu nav .page-subnav ul.nav a.active {
  background-color: $my24 !important;
  color: white !important;
}

.main-menu nav .page-subnav ul.nav a:hover,.main-menu nav .page-subnav ul.nav a:focus,.main-menu nav .page-subnav ul.nav a:active,.main-menu nav .page-subnav ul.nav a.router-link-active,.main-menu nav .page-subnav ul.nav a.active {
  background-color: $my24 !important;
  color: $white !important;
}

.app-page header div.page-title .button, html .app-page header div.page-title .btn {
  color: $white !important;
  background-color: $my24 !important;
}

.nav-pills .nav-link.active,.nav-pills .show>.nav-link {
  color: #ffffff !important;
  background-color: $my24 !important;
}


</style>
