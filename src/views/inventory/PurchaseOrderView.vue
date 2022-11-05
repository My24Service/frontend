<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Purchase order info') }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Supplier') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.order_name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.order_address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Country/Postal/city') }}:</strong></b-td>
              <b-td>
                {{ purchaseOrder.order_country_code }}-
                {{ purchaseOrder.order_postal }} {{ purchaseOrder.order_city }}
              </b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.order_contact }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Tel') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.order_tel }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.order_mobile }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
              <b-td>
                <b-link class="px-1" v-bind:href="`mailto:${purchaseOrder.order_email}`">
                  {{ purchaseOrder.order_email }}
                </b-link>
              </b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Expected entry date') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.expected_entry_date }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Order reference') }}:</strong></b-td>
              <b-td>{{ purchaseOrder.order_reference }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="2"><strong>{{ $trans('Supplier remarks') }}</strong></b-col>
        <b-col cols="10">{{ purchaseOrder.supplier_remarks}}</b-col>
      </b-row>
      <b-row class="my-2">
        <b-col cols="2"><strong>{{ $trans('Status') }}</strong></b-col>
        <b-col cols="10">
          <div v-for="status in purchaseOrder.statuses" :key="status.id">
            {{ status.created }} {{ status.status }}<br/>
          </div>
        </b-col>
      </b-row>
      <b-row v-if="purchaseOrder.materials.length">
        <b-col cols="12">
          <h4>{{ $trans('Materials') }}</h4>
          <b-table
            dark
            borderless
            small
            id="purchaseorder-materials-table"
            :fields="materialFields"
            sort-by="material_view.name"
            :items="purchaseOrder.materials"
            responsive="sm"
          ></b-table>
          </b-col>
      </b-row>
      <b-row v-if="purchaseOrder.reservation_materials.length">
        <b-col cols="12">
          <h4>{{ $trans('Reserved products') }}</h4>
          <b-table
            dark
            borderless
            small
            id="purchaseorder-reservation_materials-table"
            :fields="materialFields"
            sort-by="material_view.name"
            :items="purchaseOrder.reservation_materials"
            responsive="sm"
          ></b-table>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <h4>{{ $trans('Entries') }}</h4>
          <b-table
            dark
            borderless
            small
            id="purchaseorder-entries-table"
            sort-by="purchase_order_material_view.name"
            :fields="entryFields"
            :items="purchaseOrder.entries"
            responsive="sm"
          ></b-table>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}</b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'

export default {
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      purchaseOrder: purchaseOrderModel.getFields(),
      materialFields: [
        { key: 'material_view.name', label: this.$trans('Name') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      entryFields: [
        { key: 'material_view.name', label: this.$trans('Material') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'entry_date', label: this.$trans('Date') },
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
        this.purchaseOrder = await purchaseOrderModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching purchase order', error)
        this.errorToast(this.$trans('Error fetching purchase order'))
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
