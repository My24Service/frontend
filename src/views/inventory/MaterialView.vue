<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Material details') }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Identifier') }}:</strong></b-td>
              <b-td>{{ material.identifier }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
              <b-td>{{ material.name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Name short') }}:</strong></b-td>
              <b-td>{{ material.name_short }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Unit') }}:</strong></b-td>
              <b-td>{{ material.unit }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Supplier') }}:</strong></b-td>
              <b-td>{{ material.supplier_name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Product type') }}:</strong></b-td>
              <b-td>{{ material.product_type }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Purchase price') }}:</strong></b-td>
              <b-td>{{ material.price_purchase }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Selling price') }}:</strong></b-td>
              <b-td>{{ material.price_selling }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Alt. selling price') }}:</strong></b-td>
              <b-td>{{ material.price_selling_alt }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Purchase price ex.') }}:</strong></b-td>
              <b-td>{{ material.price_purchase_ex }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Selling price ex.') }}:</strong></b-td>
              <b-td>{{ material.price_selling_ex }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Alt. selling price ex.') }}:</strong></b-td>
              <b-td>{{ material.price_selling_alt_ex }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12" class="text-center">
          <h4>{{ $trans('Image') }}</h4>
          <img :src="material.image || NO_IMAGE_URL"  alt=""/>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <h4>{{ $trans('Inventory') }}</h4>
          <b-table dark borderless small :fields="inventoryFields" :items="inventory" responsive="sm"></b-table>
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
import materialModel from '../../models/inventory/Material.js'
import inventoryModel from '../../models/inventory/Inventory.js'
import {NO_IMAGE_URL} from "../../utils";

export default {
  data() {
    return {
      isLoading: false,
      material: materialModel.getFields(),
      inventory: [],
      inventoryFields: [
        { key: 'location_name', label: this.$trans('Location') },
        { key: 'total_amount', label: this.$trans('Total amount') },
      ],
      NO_IMAGE_URL
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
        this.material = await materialModel.detail(this.pk)
        this.inventory = await inventoryModel.getLocationsForMaterial(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching inventory', error)
        this.errorToast(this.$trans('Error fetching inventory'))
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
