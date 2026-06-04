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
    :sort-compare="sortWorkOrders"
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
      <BLink :to="{ name: 'order-view', params: { pk: data.item.id } }">
        <span>{{ data.item.order_id }}</span>
      </BLink>
    </template>
    <template v-if="isVisible('equipment')" #cell(equipment)="data">
      <BLink :to="{ name: 'equipment-equipment-view', params: { pk: data.item.equipment.id } }" target="_blank">
        {{ data.item.equipment.name }}
      </BLink>
    </template>
    <template v-if="isVisible('date')" #cell(date)="data">
      <small>{{ data.item.order_date }}</small>
    </template>
    <template v-if="isVisible('link')" #cell(link)="data">
      <BLink :to="{ name: 'workorder-view', params: { uuid: data.item.id } }" target="_blank">
        <i class="bi bi-box-arrow-up-right"></i>
      </BLink>
    </template>
  </b-table>
</template>

<script>
import componentMixin from '@/mixins/common'

export default {
  mixins: [componentMixin],
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
        { key: 'date', label: this.$trans('Date'), sortable: true },
        { key: 'link', label: this.$trans('Link') },
      ]
      return allFields.filter(field => !this.hideColumns.includes(field.key))
    },
  },
  methods: {
    sortWorkOrders(a, b, key) {
      const getValOf = {
        id: row => row["order_id"],
        equipment: row => row["equipment"]["name"],
        date: row => row["order_date"]
      }

      let aVal = getValOf[key](a)
      let bVal = getValOf[key](b)

      // Parse DD/MM/YYYY dates for proper chronological sorting
      if (key === 'date') {
        const parseDate = (str) => {
          if (!str) return 0
          const parts = str.split('/')
          if (parts.length !== 3) return 0
          // Convert to YYYYMMDD number for comparison
          return parseInt(parts[2] + parts[1] + parts[0], 10)
        }

        aVal = parseDate(aVal)
        bVal = parseDate(bVal)
      }

      return aVal < bVal ? -1 : (aVal > bVal ? 1 : 0)
    },
    isVisible(column) {
      return !this.hideColumns.includes(column)
    }
  },
}
</script>
