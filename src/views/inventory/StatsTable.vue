<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><b-icon icon="bar-chart-line-fill"></b-icon>{{ $trans('Stats in ' + year ) }}</h3>
      </div>
    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />
    <div class='app-detail panel'>
      <b-row align-v="center">
        <b-col cols="1">
          <BLink @click.prevent="backYear" v-bind:title="$trans('Year back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </BLink>
        </b-col>

        <b-col cols="1">
          <div class="float-right">
            <BLink @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </BLink>
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
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ButtonLinkSearch
                  v-bind:method="function() { showSearchModal() }"
                />
                <ButtonLinkDownload
                  v-bind:method="function() { downloadList() }"
                  v-bind:title="$trans('Download')"
                />
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(num_sales)="data">
          {{ data.item.num_sales }}
        </template>
        <template #cell(turnover)="data">
          &euro; {{ data.item.turnover.toFixed(2) }}
        </template>
        <template #cell(profit)="data">
          &euro; {{ data.item.profit.toFixed(2) }}
        </template>
        <template #cell(margin_product)="data">
          {{ data.item.margin_product.toFixed(2) }} %
        </template>
        <template #cell(sum_inventory)="data">
          <span v-for="(value, key, index) in data.item.sum_inventory" :key="index">
          {{ inventoryHeaders[key] }}: {{ value }}
          </span>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import materialModel from '../../models/inventory/Material.js'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import ButtonLinkDownload from '../../components/ButtonLinkDownload.vue'
import my24 from "../../services/my24";

let d = new Date();

export default {
  name: "StatsTable",
  components: {
    ButtonLinkSearch,
    ButtonLinkDownload,
    SearchModal,
  },
  data() {
    return {
      model: materialModel,
      inventoryHeaders: null,
      isLoading: false,
      tableFields: [
        {thAttr: {width: '20%'}, key: 'supplier.name', label: $trans('Supplier'), sortable: true},
        {thAttr: {width: '20%'}, key: 'name', label: $trans('Product'), sortable: true},
        // {thAttr: {width: '10%'}, key: 'num_entries', label: $trans('Total purchase'), sortable: true},
        {thAttr: {width: '10%'}, key: 'num_sales', label: $trans('Total sales'), sortable: true},
        {thAttr: {width: '10%'}, key: 'turnover', label: $trans('Turnover'), sortable: true},
        {thAttr: {width: '10%'}, key: 'profit', label: $trans('Profit'), sortable: true},
        {thAttr: {width: '10%'}, key: 'margin_product', label: $trans('Margin product'), sortable: true},
        {thAttr: {width: '10%'}, key: 'current_stock', label: $trans('Stock'), sortable: true},
        {thAttr: {width: '10%'}, key: 'sum_inventory', label: $trans('Locations'), sortable: false},
        {key: 'icons'},
      ],
      tableData: [],
      loaded: false,
      year: d.getYear() + 1900,
      cachedData: {},
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    // download
    downloadList() {
      const url = this.model.getStatsTableUrl(this.year)
      my24.downloadItem(url, 'stats_table.xlsx')
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
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
