<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3>
          <IBiBookshelf></IBiBookshelf>
          <span class="backlink" @click="goBack">{{ $trans('Stock Locations') }}</span> /
          {{ stockLocation.name }} <small class="dimmed">({{ stockLocation.identifier }})</small>
        </h3>
        <router-link :to="{name: 'stock-location-edit', params: {pk: this.pk}}" class="btn">{{ `${$trans('Edit')} ${$trans('stock location')}` }}</router-link>
      </div>
    </header>

      <div class="page-detail">
        <!--
        <div class="col-1-3">
          <b-row>
            <b-col cols="6">
              <b-table-simple>
                <b-tr>
                  <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
                  <b-td>{{ stockLocation.name }}</b-td>
                </b-tr>
              </b-table-simple>
            </b-col>
            <b-col cols="6">
              <b-table-simple>
                <b-tr>
                  <b-td><strong>{{ $trans('Identifier') }}:</strong></b-td>
                  <b-td>{{ stockLocation.identifier }}</b-td>
                </b-tr>
              </b-table-simple>
            </b-col>
          </b-row>
        </div>
        -->
        <div class="panel col-2-3">
          <h6>{{ $trans('Inventory') }} &middot; {{ stockLocation.name }}</h6>
          <b-row>
            <b-col cols="12">
              <b-table
                small
                id="location-materials-table"
                :fields="inventoryFields"
                :items="inventory"
                responsive="sm"
              ></b-table>
            </b-col>
          </b-row>
        </div>
      </div>

  </div>
</template>

<script>
import stockLocationModel from '@/models/inventory/StockLocation.js'
import inventoryModel from '@/models/inventory/Inventory.js'

export default {
  data() {
    return {
      isLoading: false,
      stockLocation: stockLocationModel.getFields(),
      inventory: [],
      inventoryFields: [
        { key: 'material_name', label: $trans('Material') },
        { key: 'total_amount', label: $trans('Total amount') },
      ]
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    async loadData() {
      this.isLoading = true

      try {
        this.stockLocation = await stockLocationModel.detail(this.pk)
        this.inventory = await inventoryModel.getMaterialsForLocation(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching stock location/inventory', error)
        errorToast(create, $trans('Error fetching stock location/inventory'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
</style>
