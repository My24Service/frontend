<template>
  <div>
    <b-container>
      <b-row>
        <b-col cols="3">
          <BFormGroup :label="$trans('Amount')" label-for="new-quotation-line-amount">
            <BFormInput
              autofocus
              id="new-quotation-line-amount"
              size="sm"
              v-model="draft.amount"
              @blur="draft.amount = String(draft.amount).replace(',', '.')"
            />
          </BFormGroup>
        </b-col>
        <b-col cols="5">
          <BFormGroup :label="$trans('Price')" label-for="new-quotation-line-price">
            <PriceInput
              id="new-quotation-line-price"
              v-model="draft.price"
              :currency="draft.price_currency"
              @priceChanged="(value) => { draft.price = formatMoneyPlain(value); draft.price_currency = value.getCurrency() }"
            />
          </BFormGroup>
        </b-col>
        <b-col cols="4">
          <BFormGroup :label="$trans('VAT type')">
            <VAT v-model="draft.vat_type" />
          </BFormGroup>
        </b-col>
      </b-row>
    </b-container>

    <BFormGroup label-cols="3" :label="$trans('Info')" label-for="new-quotation-line-info">
      <BFormInput id="new-quotation-line-info" size="sm" v-model="draft.info" />
    </BFormGroup>

    <BFormGroup label-cols="3" :label="$trans('Extra description')" label-for="new-quotation-line-extra-description">
      <BFormTextarea id="new-quotation-line-extra-description" v-model="draft.extra_description" />
    </BFormGroup>

    <hr/>

    <b-container>
      <b-row>
        <b-col cols="12">
          <TotalsInputs :total="preview.total_dinero" :vat="preview.vat_dinero" />
        </b-col>
      </b-row>
    </b-container>

    <footer class="modal-footer">
      <BButton @click="emit('cancel')" class="btn btn-secondary update-button" type="button" size="sm" variant="secondary">
        {{ $trans('Cancel') }}
      </BButton>
      <BButton v-if="line" @click="submit" class="btn btn-primary" size="sm" type="button" variant="warning" :disabled="!isValid">
        {{ $trans('Edit quotation line') }}
      </BButton>
      <BButton v-else @click="submit" class="btn btn-primary" size="sm" type="button" variant="primary" :disabled="!isValid">
        {{ $trans('Add quotation line') }}
      </BButton>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { VAT } from '@/features/costing'
import { formatMoneyPlain } from '@/services/money'
import { previewQuotationLine, type QuotationLineDraft } from '../calculations'
import type { QuotationLineRow } from '../use-quotation-lines'

/**
 * The add/edit form of one quotation line: amount, price, VAT rate, info and
 * an extra description, with its totals previewed as they are typed. A line
 * is valid with some info and an amount other than zero.
 */
const props = defineProps<{
  /** The line being edited; a new manual line without one. */
  line?: QuotationLineRow | null
}>()
const emit = defineEmits<{
  save: [draft: QuotationLineDraft]
  cancel: []
}>()

const { mainStore } = useCommon()
const currency = mainStore.requiredDefaultCurrency

const draft = reactive({
  amount: props.line ? String(props.line.amount) : '0',
  price: props.line?.price ?? '0.00',
  price_currency: props.line?.price_currency ?? currency,
  vat_type: props.line?.vat_type ?? (mainStore.getQuotationDefaultVat ?? mainStore.requiredInvoiceDefaultVat),
  info: props.line?.info ?? '',
  extra_description: props.line?.extra_description ?? '',
})

const preview = computed(() => previewQuotationLine({...draft, amount: Number(String(draft.amount).replace(',', '.')) || 0}))
const isValid = computed(() => {
  const amount = Number(draft.amount.replace(',', '.'))
  return draft.info.trim() !== '' && draft.amount.trim() !== '' && Number.isFinite(amount) && amount !== 0
})

function submit() {
  if (!isValid.value) return
  emit('save', {
    ...preview.value,
    cost_type: props.line?.cost_type ?? 'manual',
    amount: draft.amount.replace(',', '.'),
    vat_type: draft.vat_type,
    info: draft.info,
    extra_description: draft.extra_description,
    material: props.line?.material ?? null,
    material_name: props.line?.material_name ?? null,
  })
}
</script>
