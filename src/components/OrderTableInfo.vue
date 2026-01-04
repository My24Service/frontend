<template>
  <div class="listing-item" v-if="statuscodes.length > 0">
    <!-- delete order modal -->
    <b-modal
      v-if="!isCustomer && !isBranchEmployee && withDelete"
      id="delete-order-modal"
      ref="delete-order-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this order?') }}</p>
    </b-modal>
    <router-link v-if="isLoaded" :to="{name: 'order-view', params: {pk: order.id}}" class="order-id">
        #{{ order.order_id }}<span v-if="mainStore.getOrderListMustIncludeReference && order.order_reference && order.order_reference.length > 0"> / {{ order.order_reference }}</span>
    </router-link>
    <router-link v-if="isLoaded" :to="{name: 'order-view', params: {pk: order.id}}" class="order-type">
      <strong>{{ order.order_type }}</strong>
    </router-link>

    <span class="order-company-name">{{ order.order_name }}</span>

    <span class="order-start-date" :title="`${order.start_date} ${order.start_time ? ' ' + order.start_time :'' }`">
      {{ order.start_date }}
      <b v-if="order.start_time !== null" :title="order.start_time">
        <IBiClock></IBiClock>
      </b>
    </span>

      <!-- fixme -->
      <span v-if="memberType === 'maintenance'" class="order-assignees">
        <span v-if="assignedUsers.length" :title="`assignees: ${assignedUsers.join(', ')}`">
          <strong>{{ assignedUsers.join(', ') }}</strong>
        </span>
        <span v-else :title="`$trans('Not assigned to anyone')`">&ndash;</span>
      </span>

      <span v-if="memberType === 'temps'" class="order-assignees">
        <span v-if="order.assigned_count" :title="`assignees: ${order.required_assigned}`">
          {{ $trans('Assigned to') }} {{ order.assigned_count }}
          <span v-if="order.assigned_count > 1">
            <span v-if="order.required_users"> / {{ order.required_users }}</span>
            {{ $trans("people") }}
          </span>
          <span v-else>{{ $trans("person") }}</span>
        </span>
        <span v-else :title="`$trans('Not assigned to anyone')`">&ndash;</span>
      </span>

      <span class="order-documents">
        <span v-if="order.documents.length" >
          <IBipaperclip></IBipaperclip>
          {{ order.documents.length && order.documents.length }} {{ $trans("document") }}{{ order.documents.length === 1 ? '' : 's' }}
        </span>
        <span v-else>&ndash;</span>
      </span>
      <span class="order-status">
        <IBiCircleFill v-bind:style="`color:${orderStatusColorCode}`" :title="order.last_status_full"></IBiCircleFill>
        <BFormSelect
          :title="orderStatusCodeComputed.statuscode"
          :id="order.id + '-change-status'"
          v-model="orderStatusCode"
          :options="statuscodes"
          size="sm"
          value-field="statuscode"
          text-field="statuscode"
          style="border-color: transparent;"
          @change="handleStatusChange(order.id, $event)"
        ></BFormSelect>
        <IconLinkDelete
          v-if="!isCustomer && !isBranchEmployee && withDelete"
          v-bind:title="$trans('Delete')"
          v-bind:method="showDeleteModal"
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

import {StatusService} from '@/models/orders/Status.js'
import IconLinkDelete from './IconLinkDelete.vue'
import {OrderService} from "@/models/orders/Order";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  components: {
    IconLinkDelete
  },
  async created() {
    this.memberType = await this.mainStore.getMemberType
    this.statuscodes = await this.mainStore.getStatuscodes
    this.assignedUsers = this.getAssignedUsersList()
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
      orderService: new OrderService(),
      statusService: new StatusService(),
      orderStatus: this.order.last_status,
      orderStatusCode: null,
      orderStatusColorCode: '#666',
      statuscodes: [],
      orderLineFields: [
        { key: 'product', label: $trans('Product'), thAttr: {width: '25%'} },
        { key: 'location', label: $trans('Location'), thAttr: {width: '25%'} },
        { key: 'remarks', label: $trans('Remarks'), thAttr: {width: '50%'} }
      ],
      infoLineFields: [
        { key: 'info', label: $trans('Infolines') }
      ],
      assignedUsers: []
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
    withDelete: {
      type: [Boolean],
      default: true
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
    showDeleteModal() {
      this.$refs['delete-order-modal'].show()
    },
    async doDelete() {
      try {
        await this.orderService.delete(this.order.id)
        infoToast(this.create, $trans('Deleted'), $trans('Order has been deleted'))
        this.$emit('reload-data')
      } catch(error) {
        console.log('Error deleting order', error)
        errorToast(this.create, $trans('Error deleting order'))
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
        await this.statusService.insert(status)
      } catch(error) {
        console.log('Error creating status', error)
        errorToast(this.create, $trans('Error creating status'))
      }
    }
  }
}
</script>
