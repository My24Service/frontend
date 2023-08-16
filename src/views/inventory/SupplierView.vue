<template>
  
  <div class="app-page">
    <header>
      <h3>{{ $trans('Supplier info') }}</h3>
    </header>
    <div class="panel app-detail">
    <b-row>
      <b-col cols="6">
        <b-table-simple>
          <b-tr>
            <b-td><strong>{{ $trans('Identifier') }}:</strong></b-td>
            <b-td>{{ supplier.identifier }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Name') }}:</strong></b-td>
            <b-td>{{ supplier.name }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
            <b-td>{{ supplier.address }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Country/Postal/city') }}:</strong></b-td>
            <b-td>
              {{ supplier.country_code }}-
              {{ supplier.postal }} {{ supplier.city }}
            </b-td>
          </b-tr>
        </b-table-simple>
      </b-col>
      <b-col cols="6">
        <b-table-simple>
          <b-tr>
            <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
            <b-td>{{ supplier.order_contact }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Tel.') }}:</strong></b-td>
            <b-td>{{ supplier.order_tel }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
            <b-td>{{ supplier.order_mobile }}</b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
            <b-td>
              <b-link class="px-1" v-bind:href="`mailto:${supplier.order_email}`">
                {{ supplier.order_email }}
              </b-link>
            </b-td>
          </b-tr>
          <b-tr>
            <b-td><strong>{{ $trans('Remarks') }}:</strong></b-td>
            <b-td>{{ supplier.remarks }}</b-td>
          </b-tr>
        </b-table-simple>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <h4>{{ $trans('Materials') }}</h4>
        <b-table
          dark
          borderless
          small
          id="materials-table"
          :fields="materialFields"
          :items="materials"
          responsive="sm"
        ></b-table>
        </b-col>
    </b-row>
    <footer class="modal-footer">
      <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
        {{ $trans('Back') }}</b-button>
    </footer>
    </div>
  </div>
  
</template>

<script>
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'

export default {
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      supplier: supplierModel.getFields(),
      materials: [],
      materialFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'unit', label: this.$trans('Unit') },
        { key: 'modified', label: this.$trans('Modified') }
      ],
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
        this.supplier = await supplierModel.detail(this.pk)
        this.materials = await materialModel.getForSupplier(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching supplier/materials', error)
        this.errorToast(this.$trans('Error fetching supplier/materials'))
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
