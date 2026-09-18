<template>
  <b-overlay :show="isLoading" rounded="sm">
    <fieldset :disabled="isLoading">
    <details open>
      <summary class="flex-columns space-between">
        <h6>{{ $trans('Invoice lines') }}</h6>
        <IBiChevronDown></IBiChevronDown>
      </summary>
      <ul class="listing invoice-lines full-size" v-if="lines.length">
        <li class="headings">
          <span>{{ $trans('Description') }}</span>
          <span style="text-align: right">{{ $trans('Amount') }}</span>
          <span style="text-align: right">{{ $trans('Price') }}</span>
          <span style="text-align: right">{{ $trans('Total') }}</span>
          <span style="text-align: right">{{ $trans('VAT') }}</span>
          <span></span>
        </li>
        <li v-for="line in lines" :key="line.localKey" class="listing-item">
          <span style="vertical-align:middle">{{ line.description }}</span>
          <span style="width:120px">{{ line.amount }}</span>
          <span style="text-align: right;vertical-align:middle">{{ line.price_dinero.toFormat('$0.00') }}</span>
          <span style="text-align: right;vertical-align:middle">{{ line.total_dinero.toFormat('$0.00') }}</span>
          <span style="text-align: right;vertical-align:middle">{{ line.vat_dinero.toFormat('$0.00') }}</span>
          <span v-if="line.type === 'manual'" style="text-align: right;vertical-align:middle">
            <BLink class="h5 mx-2" href="#" :aria-label="$trans('Remove invoice line')" @click.prevent="removeLine(line.localKey)">
              <IBiTrash></IBiTrash>
            </BLink>
          </span>
          <span v-else>&nbsp;</span>
        </li>
        <li v-if="hasTotalsLine">
          <i>
            <IBiInfoSquareFill variant="primary"></IBiInfoSquareFill>
            * <span class="dimmed">{{ $trans('Prices are combined in totals') }}</span>
          </i>
        </li>
      </ul>
      <hr>
      <div class="new-invoice-line">
        <b-container>
          <b-row>
            <b-col cols="6" role="group">
              <BFormGroup label-size="sm" label-for="new-invoice-line-description">
                <BFormInput
                  id="new-invoice-line-description"
                  size="sm"
                  v-model="editItem.description"
                  :placeholder="$trans('Item description')"
                />
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup label-size="sm" label-for="new-invoice-line-amount">
                <BFormInput
                  @input="amountChanged"
                  id="new-invoice-line-amount"
                  size="sm"
                  type="number"
                  v-model="editItem.amount"
                  :placeholder="$trans('Amount')"
                />
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup label-size="sm" label-for="new-invoice-line-price">
                <PriceInput
                  id="new-invoice-line-price"
                  :key="editorVersion"
                  v-model="editItem.price"
                  :currency="editItem.price_currency"
                  @price-changed="priceChanged"
                />
              </BFormGroup>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="2" role="group">
              <BFormGroup label-size="sm" label-for="new-invoice-line-total">
                <BFormInput
                  :placeholder="$trans('Total')"
                  id="new-invoice-line-total"
                  readonly
                  disabled
                  :model-value="editTotals.toFormat('$0.00')"
                  size="sm"
                />
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup class="flex-columns vat" label-size="sm" :label="$trans('VAT %')" label-for="new-invoice-line-total">
                <span class="flex-columns space-between align-items-center">
                  <VAT :key="editorVersion" v-model="editItem.vat_type" @vat-changed="changeVatType" />
                  {{ editVat.toFormat('$0.00') }}
                </span>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup label-size="sm" label-for="invoice-submit-button">
                <BButton
                  :disabled="!isValid || isLoading"
                  id="invoice-submit-button"
                  @click="addLine"
                  class="btn"
                  size="sm"
                  type="button"
                >
                  {{ $trans('Add') }}
                </BButton>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </div>
    </details>
    </fieldset>
  </b-overlay>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import {
  invoiceInvoiceLineCreateMutation,
  invoiceInvoiceLineDestroyMutation,
  invoiceInvoiceLinePartialUpdateMutation,
  invoiceInvoiceLineListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { InvoiceLine, InvoiceLineRequest } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { toDinero } from '@/services/money'
import { $trans, infoToast } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { calculateInvoiceLine, hydrateInvoicePrices, type InvoiceLineDraft } from '../calculations'
import VAT from './VAT.vue'

type Money = ReturnType<typeof toDinero>
type LineRow = Omit<InvoiceLine, 'id' | 'invoice'> & {
  id?: number
  invoice?: number
  localKey: number
  type?: string
  price_text: string
  price_dinero: Money
  total_dinero: Money
  vat_dinero: Money
}
const props = defineProps<{ invoicePk?: number | string | null }>()
const emit = defineEmits<{
  invoiceLinesLoaded: [lines: LineRow[]]
  invoiceLineAdded: []
  invoiceLineDeleted: []
  updateInvoiceTotals: [totals: [string, string]]
}>()
const { create } = useToast()
const mainStore = useMainStore()
const queryClient = useQueryClient()
const currency = mainStore.getDefaultCurrency
const defaultVat = String(mainStore.getInvoiceDefaultVat)
const lines = ref<LineRow[]>([])
const deletedIds = ref<number[]>([])
const saving = ref(false)
const editorVersion = ref(0)
let nextKey = 0
const savedBodies = new Map<number, string>()
const createLine = useMutation(invoiceInvoiceLineCreateMutation())
const updateLine = useMutation(invoiceInvoiceLinePartialUpdateMutation())
const deleteLine = useMutation(invoiceInvoiceLineDestroyMutation())
const linesQuery = useQuery(() => ({
  ...invoiceInvoiceLineListOptions({ query: { invoice: Number(props.invoicePk) } }),
  enabled: Boolean(props.invoicePk),
  refetchOnWindowFocus: false,
}))
useQueryErrorToast(linesQuery.error, $trans('Error loading invoice lines'))
const isLoading = computed(() => saving.value || linesQuery.isLoading.value)
const editItem = reactive({ description: '', amount: '', price: '0.00', price_currency: currency, vat_type: defaultVat })
const isValid = computed(() => Boolean(editItem.description.trim()) && editItem.amount !== '' && Number.isFinite(Number(editItem.amount.replace(',', '.'))) && Number.isFinite(Number(editItem.price)))
const editPrices = computed(() => calculateInvoiceLine({ ...editItem, amount: Number(editItem.amount.replace(',', '.')) || 0 }))
const editTotals = computed(() => editPrices.value.total_dinero)
const editVat = computed(() => editPrices.value.vat_dinero)
const hasTotalsLine = computed(() => lines.value.some(line => line.price_text === '*'))

function bodyFor(line: LineRow, invoice: number): InvoiceLineRequest {
  return {
    invoice,
    description: line.description,
    amount: String(line.amount),
    price: line.price,
    vat_type: line.vat_type,
    total: line.total,
    vat: line.vat,
  }
}
function hasChanges() {
  return deletedIds.value.length > 0 || lines.value.some((line) => {
    return line.id === undefined || savedBodies.get(line.id) !== JSON.stringify(bodyFor(line, line.invoice ?? Number(props.invoicePk)))
  })
}
watch(linesQuery.data, data => {
  if (!data?.results || saving.value || hasChanges()) return
  savedBodies.clear()
  lines.value = data.results.map(record => {
    const row: LineRow = { ...record, ...hydrateInvoicePrices(record), localKey: nextKey++, price_text: toDinero(record.price, record.price_currency).toFormat('$0.00') }
    savedBodies.set(record.id, JSON.stringify(bodyFor(row, record.invoice)))
    return row
  })
  publishTotals()
}, { immediate: true })

function publishTotals() {
  let total = toDinero(0, currency)
  let vat = toDinero(0, currency)
  for (const line of lines.value) {
    total = total.add(line.total_dinero)
    vat = vat.add(line.vat_dinero)
  }
  emit('invoiceLinesLoaded', lines.value)
  emit('updateInvoiceTotals', [total.toFormat('0.00'), vat.toFormat('0.00')])
}
function priceChanged(value: Money) {
  editItem.price = value.toFormat('0.00')
}
function changeVatType(value: string | number) {
  editItem.vat_type = String(value)
}
function amountChanged() {
  // Amounts accept a comma decimal separator; the editor keeps the dot form.
  editItem.amount = String(editItem.amount).replace(',', '.')
}
function addLine() {
  if (!isValid.value || isLoading.value) return
  lines.value.push({ ...editItem, ...editPrices.value, amount: editItem.amount.replace(',', '.'), localKey: nextKey++, type: 'manual', price_text: editPrices.value.price_dinero.toFormat('$0.00') })
  publishTotals()
  emit('invoiceLineAdded')
  Object.assign(editItem, { description: '', amount: '', price: '0.00', vat_type: defaultVat })
  editorVersion.value++
}
function addInvoiceLines(drafts: InvoiceLineDraft[]) {
  if (isLoading.value || !drafts.length) return
  lines.value.push(...drafts.map(draft => ({ ...draft, amount: String(draft.amount), localKey: nextKey++ })))
  publishTotals()
  emit('invoiceLineAdded')
  const label = drafts.length === 1 ? $trans('invoice line') : $trans('invoice lines')
  infoToast(create, $trans('Added'), drafts.length + ' ' + label + ' ' + $trans('added'))
}
function removeLine(localKey: number) {
  if (isLoading.value) return
  const row = lines.value.find(line => line.localKey === localKey)
  if (!row) return
  if (row.id !== undefined) deletedIds.value.push(row.id)
  lines.value = lines.value.filter(line => line.localKey !== localKey)
  publishTotals()
  emit('invoiceLineDeleted')
}
function removeInvoiceLines(type: string) {
  // A cost panel emptied its saved costs; drop the lines created from them.
  for (const row of [...lines.value]) {
    if (row.type === type) removeLine(row.localKey)
  }
}

// Successful writes are acknowledged immediately so a later failure can be retried
// without recreating lines or repeating completed deletions.
async function saveCollection(invoiceId = Number(props.invoicePk)) {
  if (saving.value) throw new Error('Invoice lines are already being saved')
  if (!invoiceId || linesQuery.isLoading.value || linesQuery.isError.value) throw new Error('Invoice lines are not ready to save')
  saving.value = true
  try {
    while (deletedIds.value.length) {
      const id = deletedIds.value[0]!
      await deleteLine.mutateAsync({ path: { id } })
      deletedIds.value.shift()
      savedBodies.delete(id)
    }
    for (const row of lines.value) {
      const body = bodyFor(row, invoiceId)
      const serialized = JSON.stringify(body)
      if (row.id === undefined) {
        const record = await createLine.mutateAsync({ body })
        row.id = record.id
        row.invoice = record.invoice
      } else if (savedBodies.get(row.id) !== serialized) {
        await updateLine.mutateAsync({ path: { id: row.id }, body })
      }
      savedBodies.set(row.id, serialized)
    }
    await queryClient.invalidateQueries({ queryKey: invoiceInvoiceLineListOptions({ query: { invoice: invoiceId } }).queryKey, refetchType: 'none' })
    publishTotals()
  } finally {
    saving.value = false
  }
}
defineExpose({ getInvoiceLines: () => lines.value, addInvoiceLines, removeInvoiceLines, saveCollection })
</script>

<style scoped>
.vat { white-space: nowrap; }
.listing { display: table; }
.listing li:not(.text-right) { display: table-row; }
.listing li:not(.text-right) span { display: table-cell; }
fieldset { min-width: 0; }
</style>
