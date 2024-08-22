<template>
  <b-table
    small
    id="document-table"
    :fields="tableFields"
    :items="collection"
    responsive="md"
    class="data-table"
  >
    <template #cell(price)="data">
      {{ data.item.price_dinero.toFormat('$0.00') }} ({{ data.item.use_price }})
    </template>
    <template #cell(vat)="data">
      {{ data.item.vat_dinero.toFormat('$0.00') }} ({{ data.item.vat_type }}%)
    </template>
    <template #cell(total)="data">
      {{ data.item.total_dinero.toFormat('$0.00') }}
    </template>
  </b-table>
</template>

<script>
import {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_CALL_OUT_COSTS,
  COST_TYPE_DISTANCE,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_USED_MATERIALS,
  COST_TYPE_WORK_HOURS
} from "../../../models/orders/Cost";

export default {
  name: "CostsTable",
  props: {
    type: {
      type: [String],
      default: null
    },
    collection: {
      type: [Array],
      default: null
    },
  },
  data() {
    return {
      tableFields: null,
      tableFieldsUsedMaterials: [
        {key: 'user_full_name', label: this.$trans('User')},
        {key: 'material_name', label: this.$trans('Name')},
        {key: 'amount_decimal', label: this.$trans('Amount')},
        {key: 'price', label: this.$trans('Price')},
        {key: 'vat', label: this.$trans('VAT')},
        {key: 'total', label: this.$trans('Total')},
      ],
      tableFieldsHours: [
        {key: 'user_full_name', label: this.$trans('User')},
        {key: 'amount_duration_read', label: this.$trans('Amount')},
        {key: 'price', label: this.$trans('Price')},
        {key: 'vat', label: this.$trans('VAT')},
        {key: 'total', label: this.$trans('Total')},
      ],
      tableFieldsDistance: [
        {key: 'amount_int', label: this.$trans('Amount')},
        {key: 'price', label: this.$trans('Price')},
        {key: 'vat', label: this.$trans('VAT')},
        {key: 'total', label: this.$trans('Total')},
      ],

      tableFieldsCallOutCosts: [
        {key: 'amount_int', label: this.$trans('Amount')},
        {key: 'price', label: this.$trans('Price')},
        {key: 'vat', label: this.$trans('VAT')},
        {key: 'total', label: this.$trans('Total')},
      ],

    }
  },
  created() {
    switch (this.type) {
      case COST_TYPE_USED_MATERIALS:
        this.tableFields = this.tableFieldsUsedMaterials
        break
      case COST_TYPE_WORK_HOURS:
      case COST_TYPE_TRAVEL_HOURS:
      case COST_TYPE_EXTRA_WORK:
      case COST_TYPE_ACTUAL_WORK:
        this.tableFields = this.tableFieldsHours
        break
      case COST_TYPE_DISTANCE:
        this.tableFields = this.tableFieldsDistance
        break
      case COST_TYPE_CALL_OUT_COSTS:
        this.tableFields = this.tableFieldsCallOutCosts
        break
      default:
        throw `unknown cost type: ${this.type}`
    }
  }
}
</script>

<style scoped>

</style>
