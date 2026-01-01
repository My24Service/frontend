<template>
  <div class='app-page'>

    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkTextFill></IBiFileEarmarkTextFill>
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <span>#<strong>{{ pk }}</strong></span>
        </h3>
        <div class="flex-columns">
          <router-link class="btn button" :to="{name:'order-edit', pk: pk}">
            <IBiPencil font-scale="0.95"></IBiPencil> &nbsp; {{ $trans('Edit order') }}
          </router-link>
        </div>
      </div>
    </header>

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
                <BLink class="px-1" v-bind:href="`mailto:${order.order_email}`">
                  {{ order.order_email }}
                </BLink>
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
          <div v-for="status in order.statuses" :key="status.id">
            {{ status.created }} {{ status.status }}<br/>
          </div>
        </b-col>
      </b-row>
      <b-row class="my-2">
        <b-col cols="2"><strong>{{ $trans('Workorder online') }}</strong></b-col>
        <b-col cols="9">
          <BLink class="px-1" :href="order.workorder_url" target="_blank">
            {{ order.order_id }}
          </BLink>
        </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.workorder_pdf_url != ''">
        <b-col cols="2"><strong>{{ $trans('Download PDF') }}</strong></b-col>
        <b-col cols="9">
          <BLink class="px-1" :href="order.workorder_pdf_url" target="_blank">
            {{ $trans('Order') }} {{ order.order_id }}
          </BLink>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import orderModel from '@/models/orders/Order.js'

export default {
  data() {
    return {
      isLoading: true,
      order: orderModel.getFields(),
      orderLineFields: [
        { key: 'product', label: $trans('Product') },
        { key: 'location', label: $trans('Location') },
        { key: 'remarks', label: $trans('Remarks') }
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
    async loadOrder() {
      this.isLoading = true

      try {
        this.order = await orderModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching order', error)
        errorToast(create, $trans('Error fetching order'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadOrder()
  }
}
</script>

<style scoped>
</style>
