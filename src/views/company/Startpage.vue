<!-- eslint-disable vue/multi-word-component-names -->
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
              <BranchPhotoCard
                v-if="branch"
                :title="branch.name"
                :image-url="branch.image"
                :building-name="branch.name"
                :street="branch.address"
                :zip-city="branch.postal + ' ' + branch.city"
                :info-items="[
                  { label: 'Tel.', value: branch.tel },
                  { label: 'Mobiel', value: branch.mobile },
                  { label: 'E-mail', value: branch.email },
                ]"
              />
            </div>
            <div class="col-lg-9">
              <LogComponent />
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('Office floor area gfa') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('Business space area') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('Parking spaces') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('m² gfa per workstation') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('Workstation per employee') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('Workstation per FTE') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('m² gfa per employee') }}</h6>
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
                                <h6 class="text-primary mt-2 fw-bold">{{ $trans('m² gfa per FTE') }}</h6>
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
              <DashboardBlock v-if="!isLoading" :title="$trans('New documents - Technical')" iconName="wrench-adjustable">
                <b-table
                  id="equipment-documents-table"
                  hover
                  small
                  :busy='isLoading'
                  :fields="documentFields"
                  :items="equipmentDocuments"
                  responsive="md"
                  class="data-table"
                  sort-icon-left
                >
                  <template #table-busy>
                    <div class="text-center my-2">
                      <br>
                      <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
                      <strong>{{ $trans('Loading...') }}</strong>
                      <br>
                    </div>
                  </template>
                  <template #cell(name)="data">
                    <span class="badge" v-if="data.item.is_new">{{ $trans('New') }}</span> {{ data.item.name }}
                  </template>
                  <template #cell(created)="data">
                    <small>{{  data.item.created }}</small>
                  </template>
                  <template #cell(file)="data">
                    <BLink :href="data.item.url" target="_blank">
                      <i :class="'fs-3 bi ' + getFileIcon(data.item.url)"></i>
                    </BLink>
                  </template>
                </b-table>
              </DashboardBlock>
            </div>
            <div class="col-lg-6">
              <DashboardBlock v-if="!isLoading" :title="$trans('New documents - Facility')" iconName="hand-index">
                <b-table
                  id="location-documents-table"
                  hover
                  small
                  :busy='isLoading'
                  :fields="documentFields"
                  :items="locationDocuments"
                  responsive="md"
                  class="data-table"
                  sort-icon-left>
                  <template #table-busy>
                    <div class="text-center my-2">
                      <br>
                      <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
                      <strong>{{ $trans('Loading...') }}</strong>
                      <br>
                    </div>
                  </template>
                  <template #cell(name)="data">
                    <span class="badge" v-if="data.item.is_new">{{ $trans('New') }}</span> {{ data.item.name }}
                  </template>
                  <template #cell(created)="data">
                    <small>{{  data.item.created }}</small>
                  </template>
                  <template #cell(file)="data">
                    <BLink :href="data.item.url" target="_blank">
                      <i :class="'fs-3 bi ' + getFileIcon(data.item.url)"></i>
                    </BLink>
                  </template>
                </b-table>
              </DashboardBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="section dashboard_section mt-2">
      <div class="row dashboard_row">
        <div class="col-8">
          <DashboardBlock :title="$trans('Work Orders')" iconName="tools" height="100%">
            <WorkOrdersTable />
          </DashboardBlock>
        </div>
        <div class="col-4">
          <DashboardBlock title="Order Types" iconName="pie-chart-fill" height="auto">
            <OrderTypesPie />
          </DashboardBlock>
        </div>
      </div>
    </div>
    <div class="section dashboard_section mt-2 pb-4">
      <div class="row dashboard_row">
        <div class="col-12">
          <DashboardBlock v-if="!isLoading" :title="$trans('Monthly cost overview')" iconName="bar-chart-fill">
            <bar-chart
              :chart-data="chartdataMonthBar"
              :options="chartOptions"
              :height="300"
            />
          </DashboardBlock>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import {BranchService} from '@/models/company/Branch'
import BarChart from "@/components/BarChart.vue"
import componentMixin from "@/mixins/common";
import {MemberService} from "@/models/member/Member";
import {OrderService} from '@/models/orders/Order.js'
import {DocumentService, LocationDocumentService} from "@/models/equipment/Document";
import {PurchaseInvoiceService} from "@/models/invoices/PurchaseInvoice";
import {useMainStore} from "@/stores/main";
import LogComponent from "./startpage/LogComponent.vue";

import BranchPhotoCard from "./startpage/BranchPhotoCard.vue"
import DashboardBlock from "./startpage/DashboardBlock.vue";
import WorkOrdersTable from "@/components/WorkOrdersTable.vue";
import OrderTypesPie from "./startpage/OrderTypesPie.vue";

let d = new Date()

export default {
  setup() {
    const mainStore = useMainStore()
    return { mainStore }
  },
  components: {
    LogComponent,
    BranchPhotoCard,
    BarChart,
    DashboardBlock,
    WorkOrdersTable,
    OrderTypesPie,
  },
  mixins: [componentMixin],
  data() {
    return {
      member: null,
      branch: null,
      branchService: new BranchService(),
      memberService: new MemberService(),
      orderService: new OrderService(),
      equipmentDocumentService: new DocumentService(),
      locationDocumentService: new LocationDocumentService(),
      purchaseInvoiceService: new PurchaseInvoiceService(),
      equipmentDocuments: [],
      locationDocuments: [],
      monthlyCostOverview: [],
      documentFields: [
        {key: 'name', label: this.$trans('Document'), sortable: true},
        {key: 'created', label: this.$trans('Date'), sortable: true},
        {key: 'file', label: this.$trans('File')},
      ],
      companyLog: '',
      isLoading: false,
      year: d.getYear() + 1900,
      chartdataMonthBar: {
        labels: [],
        datasets: []
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      },
      gradient: ['#ff9933','#ff9c36','#fea03a','#fea33d','#fea741','#fdaa44','#fdae48','#fdb14b','#fdb54f','#fcb852','#fcbc56','#fcbf59','#fbc35d','#fbc660'],
    }
  },
  async created() {
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    await this.loadData()
  },
  methods: {
    getFileIcon(url) {
      // Default fallback icon if URL is missing or unparseable
      const fallbackIcon = 'bi-file-earmark';
      if (!url) return fallbackIcon;

      // Clean the URL by removing query parameters (?) and hashes (#)
      const cleanUrl = url.split('?')[0].split('#')[0];

      // Get the last string after the final dot
      const parts = cleanUrl.split('.');
      if (parts.length <= 1) return fallbackIcon; // No extension found

      const ext = parts.pop().toLowerCase();

      // These are the easiest matches:
      const extensionList = [
        'pdf', 'xls', 'xlsx', 'doc', 'docx',
        'txt', 'csv', 'png', 'jpg', 'jpeg',
        'gif', 'zip', 'odt', 'eml', 'msg'
      ];

      if (extensionList.includes(ext)) {
        return `bi-filetype-${ext}`;
      }

      // Map extensions to Bootstrap Icon classes
      const iconMap = {
        jpeg: 'bi-filetype-jpg', // Map jpeg to jpg icon
        odt: 'bi-file-earmark-word', // Close approximation for OpenDocument
        eml: 'bi-envelope-paper',    // Email format
        msg: 'bi-envelope-paper'     // Email format
      };

      // Add the 'bi' base class to the returned mapped icon, or use the fallback
      return iconMap[ext] || fallbackIcon;
    },
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

      try {
        this.member = await this.memberService.getMe();

        if (this.isBranchEmployee) {
          this.branch = await this.branchService.getMyBranch()
        } else {
          this.branch = await this.branchService.first()
        }

        this.equipmentDocumentService.setParentBranchId(this.branch.id)
        await this.equipmentDocumentService.loadCollection()
        this.equipmentDocuments = this.equipmentDocumentService.collection

        this.locationDocumentService.setParentBranchId(this.branch.id)
        await this.locationDocumentService.loadCollection()
        this.locationDocuments = this.locationDocumentService.collection

        this.monthlyCostOverview = await this.purchaseInvoiceService.getMonthlyOverview(this.year)

        // Process monthlyCostOverview for the bar chart
        const labels = this.$moment.monthsShort()
        const monthDataBar = []

        for (let i = 1; i <= 12; i++) {
          const monthEntry = this.monthlyCostOverview.find(item => item.month === i)
          monthDataBar.push(monthEntry ? parseFloat(monthEntry.total) : 0)
        }

        this.chartdataMonthBar = {
          labels,
          datasets: [{
            label: this.$trans('Monthly cost overview'),
            data: monthDataBar,
            backgroundColor: this.gradient
          }]
        }

        this.isLoading = false
      } catch(error) {
        console.error('error getting start page data', error)
        this.isLoading = false
      }
    }
  },
}
</script>


<style scoped>
.section.dashboard_section {
  padding-inline: 1.5rem;
}

/* Override default height for non-tabbed standard block */
.dashboard_row_expand .row .section_block {
  height: auto;
}

/* Text-only uppercase tabs style with active underline */
:deep(.tabs) {
  border-top: none;
}

:deep(.tabs ul.nav-pills) {
  margin: 8px 12px;
  height: auto;
  justify-content: center;
  border-bottom: 1px solid #eef2f5;
  padding-bottom: 8px;
}

:deep(.tabs ul.nav-pills .nav-item) {
  margin: 0 10px;
}

:deep(.tabs ul.nav-pills .nav-link) {
  background: transparent;
  color: #828282;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-radius: 0;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

:deep(.tabs ul.nav-pills .nav-link:hover) {
  color: #179da0;
}

:deep(.tabs ul.nav-pills .nav-link.active) {
  color: #179da0;
  border-bottom: 2px solid #179da0;
}

/* Tab content and list layouts */
:deep(.section_block_content) {
  border-top: none;
  padding: 0.75rem;
}

.myss_box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.myss_box ul li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f5f7f8;
  font-size: 0.85rem;
  color: #2b2b2b;
  text-align: center;
}

.myss_box ul li:last-child {
  border-bottom: 0;
}

.myss_box ul li:first-child {
  color: #179da0;
  font-weight: 700;
  font-size: 0.9rem;
}

.myss-logo {
  height: 4.5rem;
  padding: 0;
  margin: 0.5rem auto 1rem auto;
  display: block;
}

/* Image content inside tabs */
:deep(img.section-image),
:deep(.tab-pane img) {
  border-radius: 4px;
  object-fit: cover;
  height: 180px;
  width: 100%;
  border: 1px solid #eef2f5;
}

:deep(.tab-content iframe.mijnKaart) {
  height: 180px;
  width: 100%;
  border-radius: 4px;
  outline: none;
  border: 1px solid #eef2f5;
  filter: grayscale(1) contrast(105%);
  transition: filter 0.3s ease;
}

:deep(.tab-content iframe.mijnKaart:hover) {
  filter: grayscale(0) contrast(100%);
}

/* Modern Premium Stats Cards */
.section.dashboard_section .card {
  border-radius: 4px;
  border: 1px solid #eef2f5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 0.2rem;
}

.section.dashboard_section .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.section.dashboard_section .card .card-body {
  padding-block: 0.8rem;
}

.card-left {
  align-items: center;
  gap: 0.75rem;
}

.card-left > div.align-self-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-left i.bi {
  color: #1b4f72;
  font-size: 1.5rem;
}

.section.dashboard_section .card .card-body .card-left h6.text-primary {
  color: #1b4f72 !important;
  font-size: 0.85rem;
  font-weight: 600 !important;
  margin-bottom: 0;
  line-height: 1.3;
}

.card-body h6.text-secondary {
  text-align: right;
  font-size: 1.05rem;
  color: #179da0 !important;
  margin-left: 1.5rem;
  white-space: nowrap;
}

/* Premium Tables styling */
:deep(.data-table table thead th) {
  background-color: #f3f3f3;
  border-top: 1px solid #eef2f5 !important;
  border-bottom: 1px solid #eef2f5;
  color: #2b2b2b;
  font-weight: 600;
  font-size: 0.85rem;
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom: none;
}

:deep(.data-table table tbody td) {
  padding: 12px 12px;
  font-size: 0.85rem;
  /* color: #2b2b2b; */
  vertical-align: middle !important;
}

:deep(.data-table table tbody td small) {
  color: #828282;
  font-size: 0.75rem;
}

:deep(.data-table table tbody tr) {
  border-bottom: 1px solid #f5f7f8;
}

/* Smooth row hover transition as requested by the user */
:deep(.data-table .table) {
  --bs-table-hover-bg: #179DA0;
  --bs-table-hover-color: #fff;
}

/* Ensure all child elements inside the hovered row also transition to white smoothly */
:deep(.data-table > .table-hover > tbody > tr:hover td),
:deep(.data-table > .table-hover > tbody > tr:hover td small),
:deep(.data-table > .table-hover > tbody > tr:hover td span),
:deep(.data-table > .table-hover > tbody > tr:hover td a),
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi) {
  color: #ffffff;
}

/* Hover effect on file badges inside hovered row */
:deep(.data-table > .table-hover > tbody > tr:hover span.badge) {
  background-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Document type icons */
:deep(.bi-filetype-pdf) {
  color: #179da0;
}

:deep(.bi-file-earmark-word),
:deep(.bi-filetype-doc),
:deep(.bi-filetype-docx) {
  color: #2b579a;
}

:deep(.bi-filetype-xls),
:deep(.bi-filetype-xlsx) {
  color: #217346;
}

/* Ensure document type icons also turn white on hover with correct specificity */
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-pdf),
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi-file-earmark-word),
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-doc),
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-docx),
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-xls),
:deep(.data-table > .table-hover > tbody > tr:hover td i.bi-filetype-xlsx) {
  color: #ffffff;
}

/* Premium Badge */
span.badge {
  background-color: rgba(23, 157, 160, 0.1);
  color: #179da0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 6px;
  border-radius: 4px;
  margin-right: 6px;
}

.app-page {
  background-image: none !important;
  background-color: #fbfbfb;
}

.app-page > header {
  padding: 0;
  min-height: 1rem;
}
</style>

