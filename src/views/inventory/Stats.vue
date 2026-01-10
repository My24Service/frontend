<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><IBiBarChartLineFill></IBiBarChartLineFill>{{ $trans('Total sales in ' + year ) }}</h3>
      </div>
    </header>
    <div class="app-detail panel">
      <b-row align-v="center">
        <b-col cols="1">
          <BLink @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
          </BLink>
        </b-col>
        <b-col cols="10" class="text-center">

          <b-row>
            <b-col cols="6">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Graph type')"
                label-for="graph-type"
              >
                <BFormSelect
                  id="graph-type"
                  v-model="currentMode"
                  :options="modes"
                  size="sm"
                ></BFormSelect>
              </BFormGroup>
            </b-col>
            <b-col cols="6">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Show')"
                label-for="graph-field"
              >
                <BFormRadioGroup
                  id="graph-field"
                  v-model="graphField"
                  :options="graphFieldOptions"
                  class="mb-3"
                  value-field="item"
                  text-field="name"
                ></BFormRadioGroup>
              </BFormGroup>
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

      <bar-chart
        v-if="loaded && !isLoading && isBarChart"
        :chart-data="chartdata"
        :options="options"
      />

      <b-table
        small
        id="year-table"
        :busy='isLoading'
        :fields="tableFields"
        :items="tableData"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(sum_amount)="data">
          {{ data.item.sum_amount }}
          <span>({{ data.item.amount_perc }}%)</span>
        </template>
        <template #cell(sum_price_selling)="data">
          &euro; {{ data.item.sum_price_selling.toFixed(2) }}
          <span>({{ data.item.amount_selling_perc }}%)</span>
        </template>
        <template #cell(sum_price_purchase)="data">
          &euro; {{ data.item.sum_price_purchase.toFixed(2) }}
        </template>
        <template #cell(profit)="data">
          &euro; {{ data.item.profit.toFixed(2) }}
        </template>
      </b-table>
    </div>
  </div>
</template>
<script>
import BarChart from "@/components/BarChart.vue"
import totalSalesModel from '@/models/inventory/TotalSales.js'
import totalSalesPerSupplierModel from '@/models/inventory/TotalSalesPerSupplier.js'
import totalSalesPerCustomerModel from '@/models/inventory/TotalSalesPerCustomer.js'
import totalSalesPerMaterialSupplierModel from '@/models/inventory/TotalSalesPerMaterialSupplier.js'
import totalSalesPerMaterialCustomerModel from '@/models/inventory/TotalSalesPerMaterialCustomer.js'
import {useToast} from "bootstrap-vue-next";
import componentMixin from "@/mixins/common";

const MODES = {
  TS: 'total-material-sales',
  TSPC: 'total-material-sales-per-customer',
  TSPS: 'total-sales-per-supplier',
  TSPMC: 'total-sales-per-material-customer',
  TSPMS: 'total-sales-per-material-supplier'
}

let d = new Date();

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  mixins: [componentMixin],
  data() {
    return {
      modes: [
        {
          'value': MODES.TS,
          'text': this.$trans('Total material sales')
        },
        {
          'value': MODES.TSPS,
          'text': this.$trans('Total sales per supplier')
        },
        {
          'value': MODES.TSPC,
          'text': this.$trans('Total material sales per customer')
        },
        {
          'value': MODES.TSPMC,
          'text': this.$trans('Total sales per material per customer')
        },
        {
          'value': MODES.TSPMS,
          'text': this.$trans('Total sales per material per supplier')
        }
      ],
      currentMode: MODES.TS,
      isLoading: false,
      chartdata: [],
      tableFields: [],
      tableData: [],
      isBarChart: false,
      graphField: 'sum_amount',
      graphFieldOptions: [
        { item: 'sum_amount', name: this.$trans('Amount') },
        { item: 'sum_price_selling', name: this.$trans('Selling price') },
        { item: 'profit', name: this.$trans('Profit') },
      ],
      TD_fields: [
        {key: 'material_name', label: this.$trans('Material'), sortable: true},
        {key: 'sum_amount', label: this.$trans('Total amount'), sortable: true},
        {key: 'sum_price_selling', label: this.$trans('Total selling'), sortable: true},
        {key: 'sum_price_purchase', label: this.$trans('Total purchase'), sortable: true},
        {key: 'profit', label: this.$trans('Profit'), sortable: true},
      ],
      TSPS_fields: [
        {key: 'supplier_name', label: this.$trans('Supplier'), sortable: true},
        {key: 'sum_amount', label: this.$trans('Total amount'), sortable: true},
        {key: 'sum_price_selling', label: this.$trans('Total selling'), sortable: true},
        {key: 'sum_price_purchase', label: this.$trans('Total purchase'), sortable: true},
        {key: 'profit', label: this.$trans('Profit'), sortable: true},
      ],
      TSPC_fields: [
        {key: 'customer_name', label: this.$trans('Supplier'), sortable: true},
        {key: 'sum_amount', label: this.$trans('Total amount'), sortable: true},
        {key: 'sum_price_selling', label: this.$trans('Total selling'), sortable: true},
        {key: 'sum_price_purchase', label: this.$trans('Total purchase'), sortable: true},
        {key: 'profit', label: this.$trans('Profit'), sortable: true},
      ],
      TSPMS_fields: [
        {key: 'supplier_name', label: this.$trans('Supplier'), sortable: true},
        {key: 'material_name', label: this.$trans('Material'), sortable: true},
        {key: 'sum_amount', label: this.$trans('Total amount'), sortable: true},
        {key: 'sum_price_selling', label: this.$trans('Total selling'), sortable: true},
        {key: 'sum_price_purchase', label: this.$trans('Total purchase'), sortable: true},
        {key: 'profit', label: this.$trans('Profit'), sortable: true},
      ],
      TSPMC_fields: [
        {key: 'customer_name', label: this.$trans('Customer'), sortable: true},
        {key: 'material_name', label: this.$trans('Material'), sortable: true},
        {key: 'sum_amount', label: this.$trans('Total amount'), sortable: true},
        {key: 'sum_price_selling', label: this.$trans('Total selling'), sortable: true},
        {key: 'sum_price_purchase', label: this.$trans('Total purchase'), sortable: true},
        {key: 'profit', label: this.$trans('Profit'), sortable: true},
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
      loaded: false,
      year: d.getYear() + 1900,
      cachedData: {},
    }
  },
  components: {
    BarChart,
  },
  watch: {
    currentMode: function(val) {
      this.loadData()
    },
    graphField: function(val) {
      this.loadData()
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    nextYear() {
      this.year = this.year + 1
      delete this.cachedData[this.currentMode]
      this.loadData()
    },
    backYear() {
      this.year = this.year - 1
      delete this.cachedData[this.currentMode]
      this.loadData()
    },
    maxLengthText(text) {
      if(text.length > 15) {
        return `${text.substr(0, 14)}...`
      }
      return text
    },
    renderLabel(item) {
      if (this.currentMode === MODES.TS) {
        return this.maxLengthText(item.material_name)
      }

      if (this.currentMode === MODES.TSPS) {
        return this.maxLengthText(item.supplier_name)
      }

      if (this.currentMode === MODES.TSPC) {
        return this.maxLengthText(item.customer_name)
      }

      if (this.currentMode === MODES.TSPMS) {
        return `${this.maxLengthText(item.supplier_name)} / ${this.maxLengthText(item.material_name)}`
      }

      if (this.currentMode === MODES.TSPMC) {
        return `${this.maxLengthText(item.customer_name)} / ${this.maxLengthText(item.material_name)}`
      }

    },
    renderGraph(data, label, fields) {
      let graphData = [], labels = [];

      for(let i=0; i<data.length; i++) {
        graphData.push(data[i][this.graphField])
        labels.push(this.renderLabel(data[i]))
      }

      this.chartdata = {
        labels,
        datasets: [{
          label: label,
          data: graphData,
          backgroundColor: '#f87979',
        }]
      }

      this.tableData = data
      this.tableFields = fields
      this.isBarChart = true

      this.loaded = true
      this.isLoading = false
    },
    async doFetchRender(model, label, fields) {
      if (this.cachedData[this.currentMode]) {
        this.renderGraph(this.cachedData[this.currentMode], label, fields)
      } else {

        try {
          model.setListArgs(`year=${this.year}`)
          const data = await model.list()
          this.cachedData[this.currentMode] = data.result

          this.renderGraph(data.result, label, fields)
        } catch(error) {
          console.log(error)
        }
      }
    },
    loadData() {
      this.isLoading = true

      if (this.currentMode === MODES.TS) {
        this.doFetchRender(
          totalSalesModel,
          `Total sales in : ${this.year}`,
          this.TD_fields)
      }

      if (this.currentMode === MODES.TSPS) {
        this.doFetchRender(
          totalSalesPerSupplierModel,
          `Total sales per supplier in : ${this.year}`,
          this.TSPS_fields)
      }

      if (this.currentMode === MODES.TSPC) {
        this.doFetchRender(
          totalSalesPerCustomerModel,
          `Total sales per customer in : ${this.year}`,
          this.TSPC_fields)
      }

      if (this.currentMode === MODES.TSPMS) {
        this.doFetchRender(
          totalSalesPerMaterialSupplierModel,
          `Total sales per supplier per material in : ${this.year}`,
          this.TSPMS_fields)
      }

      if (this.currentMode === MODES.TSPMC) {
        this.doFetchRender(
          totalSalesPerMaterialCustomerModel,
          `Total sales per customer per material in : ${this.year}`,
          this.TSPMC_fields)
      }
    }
  },
}
</script>
