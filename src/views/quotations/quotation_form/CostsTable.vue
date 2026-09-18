<template>
  <b-table
    small
    id="document-table"
    :fields="tableFields"
    :items="collection"
    responsive="md"
    class="data-table"
  >
    <template #cell(amount_decimal)="data">
      {{ getAmountDisplayValue(data.item.amount_decimal) }}
    </template>
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
import {COST_TYPE} from "@/models/quotations/Cost";

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
        {key: 'material_name', label: $trans('Name')},
        {key: 'amount_decimal', label: $trans('Amount')},
        {key: 'price', label: $trans('Price')},
        {key: 'vat', label: $trans('VAT')},
        {key: 'total', label: $trans('Total')},
      ],
      tableFieldsHours: [
        {key: 'amount_duration_read', label: $trans('Amount')},
        {key: 'price', label: $trans('Price')},
        {key: 'vat', label: $trans('VAT')},
        {key: 'total', label: $trans('Total')},
      ],
      tableFieldsDistance: [
        {key: 'amount_int', label: $trans('Amount')},
        {key: 'price', label: $trans('Price')},
        {key: 'vat', label: $trans('VAT')},
        {key: 'total', label: $trans('Total')},
      ],
      tableFieldsCallOutCosts: [
        {key: 'amount_int', label: $trans('Amount')},
        {key: 'price', label: $trans('Price')},
        {key: 'vat', label: $trans('VAT')},
        {key: 'total', label: $trans('Total')},
      ],
      COST_TYPE,
    }
  },
  methods: {
    getAmountDisplayValue(amount) {
      if (this.type === this.COST_TYPE.USED_MATERIALS) {
        return Math.round(amount)
      }

      return amount
    }
  },
  created() {
    switch (this.type) {
      case COST_TYPE.USED_MATERIALS:
        this.tableFields = this.tableFieldsUsedMaterials
        break
      case COST_TYPE.WORK_HOURS:
      case COST_TYPE.TRAVEL_HOURS:
      case COST_TYPE.EXTRA_WORK:
      case COST_TYPE.ACTUAL_WORK:
        this.tableFields = this.tableFieldsHours
        break
      case COST_TYPE.DISTANCE:
        this.tableFields = this.tableFieldsDistance
        break
      case COST_TYPE.CALL_OUT_COSTS:
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
