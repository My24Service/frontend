<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3><b-icon icon="file-earmark-lock"></b-icon>
          <router-link :to="{name:'supplier-reservation-list'}">Reservations</router-link> / {{this.pk}}
        </h3>
        <div class="flex-columns">
          <b-button @click="goBack" class="btn btn-info" type="button" variant="secondary">
            {{ $trans('Back') }}</b-button>
          <router-link class="btn primary" :to="{name: 'supplier-reservation-edit', params: {pk:this.pk}}">Edit</router-link>
        </div>
      </div>
    </header>
    <div class="page-details panel">
      <b-overlay :show="isLoading" rounded="sm">
        
        <h3>{{ $trans('Reservation info') }}</h3>
        <b-row>
          <b-col cols="6">
            <b-table-simple>
              <b-tr>
                <b-td><strong>{{ $trans('Supplier') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.name }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.address }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Country/Postal/city') }}:</strong></b-td>
                <b-td>
                  {{ reservation.supplier_view.country_code }}-
                  {{ reservation.supplier_view.postal }} {{ reservation.supplier_view.city }}
                </b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.contact }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Tel') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.tel }}</b-td>
              </b-tr>
            </b-table-simple>
          </b-col>
          <b-col cols="6">
            <b-table-simple>
              <b-tr>
                <b-td><strong>{{ $trans('Created') }}:</strong></b-td>
                <b-td>{{ reservation.created }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Modified') }}:</strong></b-td>
                <b-td>{{ reservation.modified }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.mobile }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
                <b-td>
                  <b-link class="px-1" v-bind:href="`mailto:${reservation.supplier_view.email}`">
                    {{ reservation.supplier_view.email }}
                  </b-link>
                </b-td>
              </b-tr>
            </b-table-simple>
          </b-col>
        </b-row>
        <b-row v-if="reservation.materials.length">
          <b-col cols="12">
            <h4>{{ $trans('Products') }}</h4>
            <b-table
              dark
              borderless
              small
              id="reservation-materials-table"
              :fields="materialFields"
              sort-by="material_view.name"
              :items="reservation.materials"
              responsive="sm"
            ></b-table>
            </b-col>
        </b-row>
      </b-overlay>
    </div>
  </div>
</template>

<script>
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'

export default {
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      reservation: supplierReservationModel.getFields(),
      materialFields: [
        { key: 'material_view.name', label: this.$trans('Name') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'remarks', label: this.$trans('Remarks') }
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
        this.reservation = await supplierReservationModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching reservation', error)
        this.errorToast(this.$trans('Error fetching reservation'))
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
