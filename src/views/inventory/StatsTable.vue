<template>
  <div class="app-grid">
    <b-row align-v="center">
      <b-col cols="1">
        <b-link @click.prevent="backYear" v-bind:title="$trans('Year back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
      </b-col>
      <b-col cols="10" class="text-center">
        <h4>{{ $trans('Stats in ' + year ) }}</h4>
      </b-col>
      <b-col cols="1">
        <div class="float-right">
          <b-link @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
            <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
          </b-link>
        </div>
      </b-col>
    </b-row>

    <b-table
      small
      id="stats-table"
      :busy='isLoading'
      :fields="tableFields"
      :items="tableData"
      responsive="md"
      class="data-table"
    >
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
      <template #cell(num_sales)="data">
        {{ data.item.num_sales }} ({{ data.item.sales_perc }}%)
      </template>
      <template #cell(turnover)="data">
        {{ data.item.turnover.toFixed(2) }} EUR
      </template>
      <template #cell(profit)="data">
        {{ data.item.profit.toFixed(2) }} EUR
      </template>
      <template #cell(margin_product)="data">
        {{ data.item.margin_product.toFixed(2) }} %
      </template>
      <template #cell(sum_inventory)="data">
        <p v-for="(value, key, index) in data.item.sum_inventory" :key="index">
        {{ inventoryHeaders[key] }}: {{ value }}
        </p>
      </template>
    </b-table>
  </div>
</template>

<script>
import materialModel from '../../models/inventory/Material.js'

let d = new Date();

export default {
  name: "StatsTable",
  data() {
    return {
      model: materialModel,
      isLoading: false,
      tableFields: [
        {thAttr: {width: '20%'}, key: 'supplier.name', label: this.$trans('Supplier'), sortable: true},
        {thAttr: {width: '20%'}, key: 'name', label: this.$trans('Product'), sortable: true},
        // {thAttr: {width: '10%'}, key: 'num_entries', label: this.$trans('Total purchase'), sortable: true},
        {thAttr: {width: '10%'}, key: 'num_sales', label: this.$trans('Total sales'), sortable: true},
        {thAttr: {width: '10%'}, key: 'turnover', label: this.$trans('Turnover'), sortable: true},
        {thAttr: {width: '10%'}, key: 'profit', label: this.$trans('Profit'), sortable: true},
        {thAttr: {width: '10%'}, key: 'margin_product', label: this.$trans('Margin product'), sortable: true},
        {thAttr: {width: '10%'}, key: 'current_stock', label: this.$trans('Stock'), sortable: true},
        {thAttr: {width: '10%'}, key: 'sum_inventory', label: this.$trans('Locations'), sortable: false},
      ],
      tableData: [],
      loaded: false,
      year: d.getYear() + 1900,
      cachedData: {},
    }
  },
  components: {
  },
  watch: {
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
    maxLengthText(text) {
      if(text.length > 15) {
        return `${text.substr(0, 14)}...`
      }
      return text
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.getStatsTable(this.year)
        this.tableData = data.results
        this.inventoryHeaders = data.inventory_keys
        this.isLoading = false
      } catch(error) {
        console.log(error)
        this.isLoading = false
      }

    }
  },
}
</script>

<style scoped>

</style>
