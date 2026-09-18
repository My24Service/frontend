<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div
      class="costs-table"
      v-if="!isLoading && hasStoredData"
    >
      <CostsTable
        :collection="collection"
        :type="costType"
      />

      <CollectionButton
        mode="remove"
        @buttonClicked="$emit('empty-collection')"
      />

      <slot name="stored-extra" />

      <AddToInvoiceLinesDiv
        v-if="!parentHasInvoiceLines"
        :useOnInvoiceOptions="useOnInvoiceOptions"
        @buttonClicked="(value) => $emit('create-invoice-lines', value)"
      />

    </div>

    <b-container fluid v-if="!isLoading && !hasStoredData">
      <slot name="draft" />

      <TotalRow
        :items_total="itemsTotal"
        :total="total"
        :total_vat="totalVat"
      />

      <CollectionButton
        mode="save"
        @buttonClicked="$emit('save')"
      />

    </b-container>
  </b-overlay>
</template>

<script setup lang="ts">
import type { CostType, InvoiceLineOption, InvoiceTotals } from '../calculations'
import type { CostRow } from '../use-cost-collection'
import AddToInvoiceLinesDiv from './AddToInvoiceLinesDiv.vue'
import CollectionButton from './CollectionButton.vue'
import CostsTable from './CostsTable.vue'
import TotalRow from './TotalRow.vue'

/**
 * The chrome every cost panel shares: the loading overlay, the stored set
 * (its table, the remove control and the invoice-line control) or the draft
 * editor, the total row and the save control. A panel supplies only what is
 * genuinely its own through the `draft` slot — its column headers and rows.
 *
 * The four panels wrote this branch out four times; the drift that produced
 * (one panel's stray `<hr>`) is preserved through `stored-extra` rather than
 * silently normalised, because the stored view is a visual surface.
 */
defineProps<{
  collection: CostRow[]
  costType: CostType
  isLoading: boolean
  hasStoredData: boolean
  parentHasInvoiceLines: boolean
  useOnInvoiceOptions: { value: InvoiceLineOption; text: string }[]
  itemsTotal?: string | number | null
  total?: InvoiceTotals['total_dinero'] | null
  totalVat?: InvoiceTotals['vat_dinero'] | null
}>()

defineEmits<{
  'empty-collection': []
  'create-invoice-lines': [value: InvoiceLineOption | null]
  'save': []
}>()
</script>
