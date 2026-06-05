<template>
  <b-table
    id="workorders-table"
    hover
    small
    :busy="isLoading"
    :fields="workOrderFields"
    :items="workOrders"
    responsive="md"
    class="data-table"
    sort-icon-left
  >
    <template #table-busy>
      <div class="text-center my-2">
        <br>
        <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
        <strong>{{ $trans('Loading...') }}</strong>
        <br>
      </div>
    </template>
    <template v-if="isVisible('id')" #cell(id)="data">
      <BLink :to="{ name: 'order-view', params: { pk: data.item.order.id } }">
        <span>{{ data.item.order.order_id }}</span>
      </BLink>
    </template>
    <template v-if="isVisible('equipment')" #cell(equipment)="data">
      <BLink :to="{ name: 'equipment-equipment-view', params: { pk: data.item.equipment.id } }">
        {{ data.item.equipment.name }}
      </BLink>
    </template>
    <template v-if="isVisible('location')" #cell(location)="data">
      <BLink :to="{ name: 'equipment-location-view', params: { pk: data.item.location.id } }">
        {{ data.item.location.name }}
      </BLink>
    </template>
    <template v-if="isVisible('start_date')" #cell(start_date)="data">
      <small>{{ this.$moment(data.item.order.start_date).format('L') }}</small>
    </template>
    <template v-if="isVisible('link')" #cell(link)="data">
      <BLink :to="{ name: 'workorder-view', params: { uuid: data.item.order.id } }" target="_blank">
        <i class="bi bi-box-arrow-up-right"></i>
      </BLink>
    </template>
  </b-table>
</template>

<script>
import componentMixin from '@/mixins/common'
import moment from 'moment/min/moment-with-locales'
import {useMainStore} from "@/stores/main";

export default {
  mixins: [componentMixin],
  setup() {
    return {
      mainStore: useMainStore()
    }
  },
  props: {
    workOrders: {
      type: Array,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    hideColumns: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    workOrderFields() {
      const allFields = [
        { key: 'id', label: this.$trans('Work Order'), sortable: true },
        { key: 'equipment', label: this.$trans('Equipment'), sortable: true },
        { key: 'location', label: this.$trans('Location'), sortable: true },
        { key: 'start_date', label: this.$trans('Date'), sortable: true },
        { key: 'link', label: '' },
      ]
      return allFields.filter(field => !this.hideColumns.includes(field.key))
    },
  },
  created() {
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)
  },
  methods: {
    isVisible(column) {
      return !this.hideColumns.includes(column)
    }
  },
}
</script>
