<template>
  <b-container v-if="isLoaded">
    <b-row v-if="!order.orderlines.length && !hasInfolines">
      <b-col>
        {{ $trans('Order') }}: <router-link :to="{name: 'order-view', params: {pk: order.id}}">
          {{ order.order_id }}
        </router-link><br/>
        <span v-if="!hasBranches">
          {{ $trans('Customer ID') }}: {{ order.customer_id }}<br/>
        </span>
        {{ order.order_name }}<br/>
        {{ order.order_address }}<br/>
        {{ order.order_country_code }}-{{ order.order_postal }} {{ order.order_city }}<br/>
        <br/>
        <p>
          {{ $trans('Order type') }}: <b>{{ order.order_type }}</b><br/>
          {{ $trans('Order reference') }}: <b>{{ order.order_reference }}</b>
        </p>
      </b-col>
      <b-col>
        <span v-if="order.order_contact">{{ $trans('Contact') }}: {{ order.order_contact }}<br/></span>
        <span v-if="order.order_mobile">{{ $trans('Mobile') }}: {{ order.order_mobile }}<br/></span>
        <span v-if="order.order_tel">{{ $trans('Tel.') }}: {{ order.order_tel }}<br/></span>
        <span v-if="order.order_email">{{ $trans('Email') }}: <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link><br/></span>
        {{ $trans('Date') }}: {{ order.order_date }}<br/>
        {{ $trans('Created') }}: {{ order.created }}<br/>

        <p v-if="memberType === 'temps'">
          {{ $trans('Required users') }}: {{ order.required_users }}<br/>
          {{ $trans('Users set available') }}: {{ order.user_order_available_set_count }}<br/>
          {{ $trans('Assigned users') }}: {{ order.assigned_count }}<br/>
        </p>
        <p v-if="memberType === 'maintenance'">
          <span v-if="assignedUsers.length">
            {{ $trans("Assigned users") }}: {{ assignedUsers.join(', ') }}<br/>
          </span>
          <span v-else><i>{{ $trans('Not assigned to anyone') }}</i></span><br/>
        </p>
      </b-col>
    </b-row>
    <b-row v-if="order.orderlines.length || hasInfolines" >
      <b-col>
        {{ $trans('Order') }}: <router-link :to="{name: 'order-view', params: {pk: order.id}}">
          {{ order.order_id }}
        </router-link><br/>
        <span v-if="!hasBranches">
          {{ $trans('Customer ID') }}: {{ order.customer_id }}<br/>
        </span>
        {{ order.order_name }}<br/>
        {{ order.order_address }}<br/>
        {{ order.order_country_code }}-{{ order.order_postal }} {{ order.order_city }}<br/>
        <br/>
        <p>
          {{ $trans('Order type') }}: <b>{{ order.order_type }}</b><br/>
          {{ $trans('Order reference') }}: <b>{{ order.order_reference }}</b>
        </p>

        <span v-if="order.order_contact">{{ $trans('Contact') }}: {{ order.order_contact }}<br/></span>
        <span v-if="order.order_mobile">{{ $trans('Mobile') }}: {{ order.order_mobile }}<br/></span>
        <span v-if="order.order_tel">{{ $trans('Tel.') }}: {{ order.order_tel }}<br/></span>
        <span v-if="order.order_email">{{ $trans('Email') }}: <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link><br/></span>
        {{ $trans('Date') }}: {{ order.order_date }}<br/>
        {{ $trans('Created') }}: {{ order.created }}<br/>

        <p v-if="memberType === 'temps'">
          {{ $trans('Required users') }}: {{ order.required_users }}<br/>
          {{ $trans('Users set available') }}: {{ order.user_order_available_set_count }}<br/>
          {{ $trans('Assigned users') }}: {{ order.assigned_count }}<br/>
        </p>
        <p v-if="memberType === 'maintenance'">
          <span v-if="assignedUsers.length">
            {{ $trans("Assigned users") }}: {{ assignedUsers.join(', ') }}<br/>
          </span>
          <span v-else><i>{{ $trans('Not assigned to anyone') }}</i></span><br/>
          <span v-if="order.materials">
            {{ $trans('Used materials') }}: {{ order.materials.length }}<br/>
          </span>
        </p>
      </b-col>
      <b-col>
        <b-table v-if="order.orderlines.length" dark borderless small :fields="orderLineFields" :items="order.orderlines" responsive="sm"></b-table>
        <b-table
          v-if="!isCustomer && !hasBranches && order.infolines.length"
          dark borderless small :fields="infoLineFields" :items="order.infolines" responsive="sm"
        ></b-table>
      </b-col>
    </b-row>
    <b-row v-if="order.workorder_pdf_url">
      <b-col cols="12">
        <p>
          {{ $trans('Workorder PDF') }}
          <b-link :href="order.workorder_pdf_url" target="_blank">
            {{ $trans('Order') }} {{ order.order_id }}
          </b-link>
        </p>
      </b-col>
    </b-row>
    <b-row v-if="order.workorder_pdf_url_partner && order.workorder_pdf_url_partner.length">
      <b-col cols="12">
        <p>
          {{ $trans('Workorder PDF partners') }}
          <span v-for="pdf_data in order.workorder_pdf_url_partner" :key="pdf_data.companycode">
            <b-link :href="pdf_data.url" target="_blank">
              {{ pdf_data.companycode }} {{ $trans('Order') }} {{ order.order_id }}
            </b-link>
          </span>
        </p>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" v-if="order.remarks && order.remarks !== ''">
        {{ $trans('Remarks') }}: {{ order.remarks }}
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12" v-if="order.customer_remarks && order.customer_remarks !== ''">
        {{ $trans('Customer remarks') }}: {{ order.customer_remarks }}
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <h6>
          <b-badge>{{ $trans('Status') }}</b-badge>
          <span v-if="order.last_status_full" class="info">{{ order.last_status_full }}</span>
          <span v-if="!order.last_status_full" class="info">{{ order.last_status.created }} {{ order.last_status.status }}</span>
        </h6>
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
import { componentMixin } from '../utils.js'

export default {
  mixins: [componentMixin],
  async created() {
    this.assignedUsers = this.getAssignedUsersList()
    this.memberType = await this.$store.dispatch('getMemberType')
    this.isLoaded = true
  },
  computed: {
    hasInfolines() {
      if (!this.order.infolines) {
        return false
      }

      return this.order.infolines.length > 0
    }
  },
  data() {
    return {
      isLoaded: false,
      memberType: null,
      orderLineFields: [
        { key: 'product', label: this.$trans('Product'), thAttr: {width: '25%'} },
        { key: 'location', label: this.$trans('Location'), thAttr: {width: '25%'} },
        { key: 'remarks', label: this.$trans('Remarks'), thAttr: {width: '50%'} }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
      ],
      assignedUsers: []
    }
  },
  methods: {
    getAssignedUsersList() {
      let users = []

      for (const userInfo of this.order.assigned_user_info) {
        if (userInfo.license_plate) {
          users.push(`${userInfo.full_name} (${userInfo.license_plate})`)
        } else {
          users.push(userInfo.full_name)
        }
      }

      return users
    },
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
