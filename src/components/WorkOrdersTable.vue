<template>
  <b-overlay :show="isLoading" rounded="sm">
    <p v-if="!workOrders.length">
      <i>{{ $trans("No work orders") }}</i>
    </p>
    <b-table
      v-else
      id="workorders-table"
      hover
      small
      :fields="workOrderFields"
      :items="workOrders"
      responsive="md"
      :sticky-header="true"
      class="data-table"
      sort-icon-left
    >
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
        <BLink :to="{ name: 'workorder-view', params: { uuid: data.item.order.uuid } }" target="_blank">
          <i class="bi bi-box-arrow-up-right"></i>
        </BLink>
      </template>
    </b-table>
  </b-overlay>
</template>

<script>
import componentMixin from '@/mixins/common.js'
import moment from 'moment/min/moment-with-locales'
import {useMainStore} from "@/stores/main/index.js";
import orderlineService, {OrderlineService} from '@/models/orders/Orderline.js'
import {integer} from "@vuelidate/validators";

export default {
  mixins: [componentMixin],
  setup() {
    return {
      mainStore: useMainStore()
    }
  },
  props: {
    equipmentPk: {
      type: integer,
      default: undefined
    },
    hideColumns: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      isLoading: false,
      orderlineService: new OrderlineService(),
      workOrders: [],
    }
  },
  computed: {
    workOrderFields() {
      const allFields = [
        { key: 'id', label: this.$trans('Workorder'), sortable: true },
        { key: 'equipment', label: this.$trans('Equipment'), sortable: true },
        { key: 'location', label: this.$trans('Location'), sortable: true },
        { key: 'start_date', label: this.$trans('Date'), sortable: true },
        { key: 'link', label: '' },
      ]
      return allFields.filter(field => !this.hideColumns.includes(field.key))
    },
  },
  async created() {
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)
    this.isLoading = true
    try {
      this.workOrders = await this.orderlineService.getLatestWorkordersEquipment(this.equipmentPk)
      this.isLoading = false
    } catch (e) {
      this.isLoading = false
      console.error('error getting latest workorders', e)
    }
  },
  methods: {
    isVisible(column) {
      return !this.hideColumns.includes(column)
    }
  },
}
</script>
