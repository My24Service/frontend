<template>
  <div class="listing-item" v-if="statuscodes.length > 0">
    <!-- delete order modal -->
    <b-modal
      v-if="!isCustomer && !isBranchEmployee"
      id="delete-order-modal"
      ref="delete-order-modal"
      v-bind:title="$trans('Delete?')"
      @ok="this.doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this order?') }}</p>
    </b-modal>
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
      <span class="order-documents">
        <span v-if="order.documents.length" >
          <b-icon icon="paperclip"></b-icon>
        </span>
        <router-link
          v-if="isLoaded && order.documents.length"
          :to="{name: 'order-documents', params: {orderPk: order.id}}"
          class="order-type">{{ order.documents.length && order.documents.length }} document{{ order.documents.length == 1 ? '' : 's' }}</router-link>
        <span v-else>&ndash;</span>
      </span>
      <span class="order-status">
        <b-icon icon="circle-fill" v-bind:style="`color:${orderStatusColorCode}`" :title="order.last_status_full"></b-icon>
        <b-form-select
          :title="orderStatusCodeComputed.statuscode"
          :id="order.id + '-change-status'"
          v-model="orderStatusCode"
          :options="statuscodes"
          size="sm"
          value-field="statuscode"
          text-field="statuscode"
          style="border-color: transparent;"
          @change="handleStatusChange(order.id, $event)"
        ></b-form-select>
        <IconLinkDelete
          v-if="!isCustomer && !isBranchEmployee"
          v-bind:title="$trans('Delete')"
          v-bind:method="this.showDeleteModal"
        />
      </span>
  </div>
</template>

<style scope>
.order-status {
  display: flex;
  gap: 1ex;
  align-items: center;
}
</style>

<script>
import my24 from '../services/my24.js'
import { componentMixin } from '../utils.js'
import statusModel from '@/models/orders/Status.js'
import IconLinkDelete from './IconLinkDelete.vue'

export default {
  mixins: [componentMixin],
  components: {
    IconLinkDelete
  },
  async created() {
    this.memberType = await this.$store.dispatch('getMemberType')
    this.statuscodes = await this.$store.dispatch('getStatuscodes')
    this.isLoaded = true;
    this.orderStatusCode = this.orderStatusCodeComputed
    this.orderStatusColorCode = my24.status2color(this.statuscodes, this.orderStatusCode);
  },
  computed: {
    hasInfolines() {
      if (!this.order.infolines) {
        return false
      }

      return this.order.infolines.length > 0
    },
    orderStatusCodeComputed() {
      let statusCode = my24.getStatuscode(this.statuscodes, this.order.last_status);
      if (statusCode) {
        return statusCode.statuscode;
      }
      return {}
    },

  },
  data() {
    return {
      isLoaded: false,
      memberType: null,
      orderStatus: this.order.last_status,
      orderStatusCode: null,
      orderStatusColorCode: '#666',
      statuscodes: [],
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
    },
    model: {
      type: [Object],
    }
  },
  methods: {
    showDeleteModal() {
      console.info('show modal')
      this.$refs['delete-order-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.order.id)
        this.infoToast(this.$trans('Deleted'), this.$trans('Order has been deleted'))
        this.$emit('reload-data')
      } catch(error) {
        console.log('Error deleting order', error)
        this.errorToast(this.$trans('Error deleting order'))
      }
    },
    handleStatusChange(id, value) {
      this.changeStatus(id, value);
      this.orderStatusColorCode = my24.status2color(this.statuscodes, value);
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
