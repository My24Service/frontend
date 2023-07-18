<template>
  <div class="listing-item">
    <router-link v-if="isLoaded" :to="{name: 'order-view', params: {pk: order.id}}" class="order-id">
        #{{ order.order_id }}
    </router-link>
    <router-link v-if="isLoaded" :to="{name: 'order-view', params: {pk: order.id}}" class="order-type">
      <strong>{{ order.order_type }}</strong>
    </router-link>

    <span class="order-company-name">{{ order.order_name }}</span>

    <span class="order-start-date" :title="`${order.start_date} ${order.start_time ? ' ' + order.start_time :'' }`">
      {{ order.start_date }}
      <b v-if="order.start_time !== null" :title="order.start_time"><b-icon icon="clock"></b-icon></b>
    </span>

      <!-- fixme -->
      <span v-if="memberType === 'temps'">
        {{ $trans('Required users') }}: {{ order.required_users }}<br/>
        {{ $trans('Users set available') }}: {{ order.user_order_available_set_count }}<br/>
        {{ $trans('Assigned people') }}: {{ order.assigned_count }}<br/>
      </span>

      <!-- fixme -->
      <span v-if="memberType === 'maintenance'" class="order-assignees">
        <span v-if="order.assigned_count" :title="`assignees: ${order.required_assigned}`">
          {{ $trans('Assigned to') }} {{ order.assigned_count }}
          <span v-if="order.assigned_count > 1">
            <span v-if="order.required_users"> / {{ order.required_users }}</span>
            people
          </span>
          <span v-else>person</span>
        </span>
        <span v-else title="Not assigned to anyone">&ndash;</span>
      </span>

      <span class="order-status">
        <b v-bind:style="status2color(orderStatus)" :title="order.last_status">&#9679;</b>&nbsp;
        <b-form-select
          :id="order.id + 'change-status-status'"
          v-model="orderStatus"
          :options="statuscodes"
          size="sm"
          value-field="statuscode"
          text-field="statuscode"
          style="border-color: transparent;"
          @change="handleStatusChange(order.id, $event)"
        ></b-form-select>
      </span>

  </div>

    <!-- documents
    <div>
      <span v-if="order.documents.length > 0">
        <router-link :to="{name: 'order-documents', params: {pk: order.id}}">{{ order.documents.length }} documents {{ order.id }}</router-link>
      </span>
    </div>
    -->

</template>

<script>
import my24 from '../services/my24.js'
import { componentMixin } from '../utils.js'
import statusModel from '@/models/orders/Status.js'

export default {
  mixins: [componentMixin],
  async created() {
    this.memberType = await this.$store.dispatch('getMemberType')
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
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
      orderStatus: this.order.last_status,
      orderLineFields: [
        { key: 'product', label: this.$trans('Product'), thAttr: {width: '25%'} },
        { key: 'location', label: this.$trans('Location'), thAttr: {width: '25%'} },
        { key: 'remarks', label: this.$trans('Remarks'), thAttr: {width: '50%'} }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
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
  },
  methods: {
    status2color(status) {
      return `color: ${my24.status2color(this.statuscodes, status)}`;
    },
    handleStatusChange(id, value) {
      this.changeStatus(id, value);
    },
    async changeStatus(id, value) {
      const status = {
        order: id,
        status: value
      }

      try {
        await statusModel.insert(status)
      } catch(error) {
        console.log('Error creating status', error)
        this.errorToast(this.$trans('Error creating status'))
      }
    }
  }
}
</script>

