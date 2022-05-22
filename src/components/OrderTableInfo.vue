<template>
  <b-container v-if="isLoaded">
    <b-row v-if="!order.orderlines.length && !order.infolines.length">
      <b-col>
        {{ $trans('Order') }}: <router-link :to="{name: 'order-view', params: {pk: order.id}}">
          {{ order.order_id }}
        </router-link><br/>
        {{ $trans('Customer ID') }}: {{ order.customer_id }}<br/>
        {{ order.order_name }}<br/>
        {{ order.order_address }}<br/>
        {{ order.order_country_code }}-{{ order.order_postal }} {{ order.order_city }}<br/>
        <br/>
        <p>
          {{ $trans('Order type') }}: <b>{{ order.order_type }}</b><br/>
          {{ $trans('Order reference') }}: <b>{{ order.order_reference }}</b></p>
      </b-col>
      <b-col>
        <span v-if="order.order_contact">{{ $trans('Contact') }}: {{ order.order_contact }}<br/></span>
        <span v-if="order.order_mobile">{{ $trans('Mobile') }}: {{ order.order_mobile }}<br/></span>
        <span v-if="order.order_tel">{{ $trans('Tel.') }}: {{ order.order_tel }}<br/></span>
        <span v-if="order.order_email">{{ $trans('Email') }}: <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link><br/></span>
        {{ $trans('Date') }}: {{ order.order_date }}<br/>
        {{ $trans('Created') }}: {{ order.created }}

        <p v-if="memberType === 'temps'">
          {{ $trans('Required users') }}: {{ order.required_users }}<br/>
          {{ $trans('Users set available') }}: {{ order.user_order_available_set_count }}<br/>
          {{ $trans('Assigned users') }}: {{ order.assigned_count }}<br/>
        </p>
      </b-col>
    </b-row>
    <b-row v-if="order.orderlines.length || order.infolines.length || order.maintenance_product_lines.length" >
      <b-col>
        {{ $trans('Order') }}: <router-link :to="{name: 'order-view', params: {pk: order.id}}">
          {{ order.order_id }}
        </router-link><br/>
        {{ $trans('Customer ID') }}: {{ order.customer_id }}<br/>
        {{ order.order_name }}<br/>
        {{ order.order_address }}<br/>
        {{ order.order_country_code }}-{{ order.order_postal }} {{ order.order_city }}<br/>
        <br/>
        <p><b>{{ order.order_type }}</b></p>

        <span v-if="order.order_contact">{{ $trans('Contact') }}: {{ order.order_contact }}<br/></span>
        <span v-if="order.order_mobile">{{ $trans('Mobile') }}: {{ order.order_mobile }}<br/></span>
        <span v-if="order.order_tel">{{ $trans('Tel.') }}: {{ order.order_tel }}<br/></span>
        <span v-if="order.order_email">{{ $trans('Email') }}: <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link><br/></span>
        {{ $trans('Date') }}: {{ order.order_date }}<br/>
        {{ $trans('Created') }}: {{ order.created }}<br/>
        memberType: {{ memberType }}

        <p v-if="memberType === 'temps'">
          {{ $trans('Required users') }}: {{ order.required_users }}<br/>
          {{ $trans('Users set available') }}: {{ order.user_order_available_set_count }}<br/>
          {{ $trans('Assigned users') }}: {{ order.assigned_count }}<br/>
        </p>
      </b-col>
      <b-col>
        <b-table v-if="order.orderlines.length" dark borderless small :fields="orderLineFields" :items="order.orderlines" responsive="sm"></b-table>
        <b-table v-if="order.maintenance_product_lines.length" dark borderless small :fields="maintenanceProductLineFields" :items="order.maintenance_product_lines" responsive="sm"></b-table>
        <b-table v-if="!isCustomer && order.infolines.length" dark borderless small :fields="infoLineFields" :items="order.infolines" responsive="sm"></b-table>
      </b-col>
    </b-row>
    <b-row v-if="order.workorder_pdf_url || order.workorder_pdf_url_partner">
      <b-col cols="6">
        <p v-if="order.workorder_pdf_url">
          {{ $trans('Workorder PDF') }}
          <b-link :href="order.workorder_pdf_url" target="_blank">
            {{ $trans('Order') }} {{ order.order_id }}
          </b-link>
        </p>
        <p v-if="order.workorder_pdf_url_partner">
          {{ $trans('Workorder PDF partner') }}
          <b-link :href="order.workorder_pdf_url_partner" target="_blank">
            {{ $trans('Order') }} {{ order.order_id }}
          </b-link>
        </p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" v-if="order.customer_remarks && order.customer_remarks != ''">
        {{ $trans('Customer remarks') }}: {{ order.customer_remarks }}
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <h6><b-badge>{{ $trans('Status') }}</b-badge><span class="info">{{ order.last_status_full }}</span></h6>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" v-if="order.documents.length > 0">
        <h5 class="my-2">{{ $trans('Documents') }}</h5>
        <p v-for="item in order.documents" :key="item.filename">
          <b-link v-bind:href="item.url" target="_blank">
            {{ item.name }} <b-icon-download font-scale=".8"></b-icon-download>
          </b-link>
        </p>
      </b-col>
    </b-row>
    <b-row>
      <b-col v-if="order.workorder_documents.length > 0" cols="12">
        <h5 class="my-2">{{ $trans('Workorder documents') }}</h5>
        <p v-for="item in order.workorder_documents" :key="item.filename">
          <b-link v-bind:href="item.url" target="_blank">
            {{ item.name }} <b-icon-download font-scale=".8"></b-icon-download>
          </b-link>
        </p>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { componentMixin } from '@/utils.js'

export default {
  mixins: [componentMixin],
  created() {
    // get member type
    this.$store.dispatch('getMemberType').then((memberType) => {
      this.memberType = memberType
      this.isLoaded = true
    }).catch((error) => {
      this.memberType = 'maintenance'
      this.isLoaded = true
      console.log('getMemberType error', error)
    })
  },
  data() {
    return {
      isLoaded: false,
      memberType: null,
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
      ],
      maintenanceProductLineFields: [
        { key: 'product_name', label: this.$trans('Maintenance product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'amount', label: this.$trans('Amount') },
        { key: 'remarks', label: this.$trans('Remarks') },
      ],
    }
  },
  props: {
    dispatch: {
      type: [Boolean],
      default: false
    },
    order: {
      type: [Object],
      required: true
    }
  }
}
</script>
<style scoped>
  span.info {
    padding-left: 6px;
  }
</style>
