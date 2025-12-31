<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-medical"></b-icon>
          <span class="backlink" @click="goBack">{{ $trans('Purchase orders') }}</span> /
          {{ purchaseOrder.purchase_order_id }} <span class="dimmed">{{ purchaseOrder.order_name }}</span>
        </h3>
        <div class="flex-columns">
          <b-button @click="goBack" class="btn btn-info" type="button" variant="secondary">
          {{ $trans('Back') }}</b-button>
          <router-link :to="{name: 'purchaseorder-edit', params: {pk: this.pk}}" class="btn">
            <b-icon icon="pencil"></b-icon>
            {{ $trans('Edit purchase order') }}
          </router-link>
        </div>
      </div>
    </header>
    <div class="page-detail flex-columns">
      <div class="panel">
        <h3><strong>{{ purchaseOrder.purchase_order_id }}</strong> <br/><small>{{ purchaseOrder.order_name }}</small>
        </h3>

          <dl>
            <dt>{{ $trans('Expected entry date') }}</dt>
            <dd>{{ purchaseOrder.expected_entry_date }}</dd>

            <dt>{{ $trans('Supplier') }}</dt>
            <dd>{{ purchaseOrder.order_name }}</dd>

            <dt>{{ $trans('Address') }}</dt>
            <dd>{{ purchaseOrder.order_address }}</dd>

            <dt>{{ $trans('Country/Postal/city') }}</dt>
            <dd>
              {{ purchaseOrder.order_country_code }}-
              {{ purchaseOrder.order_postal }} {{ purchaseOrder.order_city }}
            </dd>

            <dt>{{ $trans('Contact') }}</dt>
            <dd>{{ purchaseOrder.order_contact }}</dd>

            <dt>{{ $trans('Tel') }}</dt>
            <dd>{{ purchaseOrder.order_tel }}</dd>
          </dl>


          <dl>
            <dt>{{ $trans('Mobile') }}</dt>
            <dd>{{ purchaseOrder.order_mobile }}</dd>

            <dt>{{ $trans('Email') }}</dt>
            <dd>
              <b-link class="px-1" v-bind:href="`mailto:${purchaseOrder.order_email}`">
                {{ purchaseOrder.order_email }}
              </b-link>
            </dd>

            <dt>{{ $trans('Order reference') }}</dt>
            <dd>{{ purchaseOrder.order_reference }}</dd>

            <dt>{{ $trans('Supplier remarks') }}</dt>
            <dd>{{ purchaseOrder.supplier_remarks}}</dd>
          </dl>


        <h6>{{$trans('History')}}</h6>

          <ul class="listing">
            <li v-for="status in purchaseOrder.statuses" :key="status.id">
              <div class="listing-item">
                <small>{{ status.created }}</small> <span>{{ status.status }}</span>
              </div>
            </li>
          </ul>


      </div>

      <div class="panel col-2-3">
        <b-row v-if="purchaseOrder.materials.length">
        <b-col cols="12">
          <h6>{{ $trans('Products') }}</h6>
          <b-table
            id="purchaseorder-materials-table"
            :fields="materialFields"
            sort-by="material_view.name"
            :items="purchaseOrder.materials"
            responsive="sm"
          ></b-table>
          </b-col>
        </b-row>

        <b-row v-if="purchaseOrder.reservation_materials && purchaseOrder.reservation_materials.length">
          <b-col cols="12">
            <h6>{{ $trans('Reserved products') }}</h6>
            <b-table
              id="purchaseorder-reservation_materials-table"
              :fields="materialFields"
              sort-by="material_view.name"
              :items="purchaseOrder.reservation_materials"
              responsive="sm"
            ></b-table>
          </b-col>
        </b-row>

        <b-row v-if="purchaseOrder.entries && purchaseOrder.entries.length">
          <b-col cols="12">
            <h6>{{ $trans('Entries') }}</h6>
            <b-table
              id="purchaseorder-entries-table"
              sort-by="purchase_order_material_view.name"
              :fields="entryFields"
              :items="purchaseOrder.entries"
              responsive="sm"
            ></b-table>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
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
        { key: 'material_name', label: this.$trans('Product') },
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
        errorToast(create, this.$trans('Error fetching purchase order'))
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
