<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-detail">
      <h3>{{ $trans('Order info') }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Customer ID') }}:</strong></b-td>
              <b-td>{{ order.customer_id }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Customer') }}:</strong></b-td>
              <b-td>{{ order.order_name }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ order.order_address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Country/Postal/city') }}:</strong></b-td>
              <b-td>
                {{ order.order_country_code }}-
                {{ order.order_postal }} {{ order.order_city }}
              </b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
              <b-td>{{ order.order_contact }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Tel') }}:</strong></b-td>
              <b-td>{{ order.order_tel }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
              <b-td>{{ order.order_mobile }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Order id') }}:</strong></b-td>
              <b-td>{{ order.order_id }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Date') }}:</strong></b-td>
              <b-td>{{ order.order_date }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Order reference') }}:</strong></b-td>
              <b-td>{{ order.order_reference }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Required users') }}:</strong></b-td>
              <b-td>{{ order.required_users }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Order type') }}:</strong></b-td>
              <b-td>{{ order.order_type }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
              <b-td>
                <b-link class="px-1" v-bind:href="`mailto:${order.order_email}`">
                  {{ order.order_email }}
                </b-link>
              </b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <b-row v-if="order.orderlines.length">
        <b-col cols="12">
          <h4>{{ $trans('Orderlines') }}</h4>
          <b-table
            dark
            borderless
            small
            id="orderline-table"
            :fields="orderLineFields"
            :items="order.orderlines"
            responsive="sm"
          ></b-table>
        </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.customer_remarks != ''">
        <b-col cols="2"><strong>{{ $trans('Customer remarks') }}</strong></b-col>
        <b-col cols="9">{{ order.customer_remarks }}</b-col>
      </b-row>
      <b-row class="my-2">
        <b-col cols="2"><strong>{{ $trans('Status') }}</strong></b-col>
        <b-col cols="9">
          <div v-for="status in order.statusses" :key="status.id">
            {{ status.created }} {{ status.status }}<br/>
          </div>
        </b-col>
      </b-row>
      <b-row class="my-2">
        <b-col cols="2"><strong>{{ $trans('Workorder online') }}</strong></b-col>
        <b-col cols="9">
          <b-link class="px-1" :href="order.workorder_url" target="_blank">
            {{ order.order_id }}
          </b-link>
        </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.workorder_pdf_url != ''">
        <b-col cols="2"><strong>{{ $trans('Download PDF') }}</strong></b-col>
        <b-col cols="9">
          <b-link class="px-1" :href="order.workorder_pdf_url" target="_blank">
            {{ $trans('Order') }} {{ order.order_id }}
          </b-link>
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
import orderModel from '@/models/orders/Order'

export default {
  data() {
    return {
      isLoading: true,
      order: orderModel.getFields(),
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    past: {
      type: [Boolean],
      default: false
    },
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    loadOrder() {
      this.isLoading = true

      orderModel.detail(this.pk).then((order) => {
        this.order = order
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching order', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching order')
        })

        this.isLoading = false
      })
    }
  },
  created() {
    this.loadOrder()
  }
}
</script>

<style scoped>
</style>
