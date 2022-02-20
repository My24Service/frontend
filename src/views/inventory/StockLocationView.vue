<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Stock location details') }}</h3>
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
      <b-row>
        <b-col cols="12">
          <h4>{{ $trans('Inventory') }}</h4>
          <b-table
            dark
            borderless
            small
            id="location-materials-table"
            :fields="inventoryFields"
            :items="inventory"
            responsive="sm"
          ></b-table>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}
        </b-button>
      </footer>
    </div>
  </b-overlay>
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
        { key: 'material_name', label: this.$trans('Material') },
        { key: 'total_amount', label: this.$trans('Total amount') },
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
    loadData() {
      this.isLoading = true

      stockLocationModel.detail(this.pk).then((stockLocation) => {
        this.stockLocation = stockLocation

        inventoryModel.getMaterialsForLocation(this.pk).then((inventory) => {
          this.inventory = inventory
          this.isLoading = false
        }).catch((error) => {
          console.log('error fetching stock location', error)
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error fetching stock location')
          })

          this.isLoading = false
        })
      }).catch((error) => {
        console.log('error fetching stock location', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching stock location')
        })

        this.isLoading = false
      })
    }
  },
  created() {
    this.loadData()
  }
}
</script>

<style scoped>
</style>
