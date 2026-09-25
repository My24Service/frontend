<template>
  <details>
    <summary class="flex-columns space-between">
      <h6>{{ getTitle() }}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>

    <CostCollectionShell
      :collection="collection"
      :cost-type="costType"
      :is-loading="isLoading"
      :has-stored-data="hasStoredData"
      :parent-has-invoice-lines="parentHasInvoiceLines"
      :use-on-invoice-options="useOnInvoiceOptions"
      :items-total="hours_total"
      :total="total_dinero"
      :total-vat="totalVAT_dinero"
      @empty-collection="emptyCollectionClicked"
      @create-invoice-lines="createInvoiceLinesClicked"
      @save="saveCollection"
    >
      <template #draft>
        <b-row>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Engineer")'
            />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Hours")'
            />
          </b-col>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Rate")'
              />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("VAT type")'
              />
          </b-col>
          <b-col cols="3" />
        </b-row>
        <b-row v-for="activity in collection" :key="activity.user ?? undefined" class="material_row">
          <b-col cols="2" v-if="!activity.is_partner">
            {{ getFullname(activity.user) }}
          </b-col>
          <b-col cols="2" v-else>
            {{ activity.full_name }} ({{ activity.partner_companycode }})
          </b-col>
          <b-col cols="2">
            <input type="text" class="form-control form-control-sm" v-model.lazy="activity.amount_duration_read" style="display:inline-block;width:4.5em;text-align:right" v-on:change="activityDurationChange(activity)"/>
            <!-- {{ activity.amount_duration_read }}-->
          </b-col>
          <b-col cols="3">
            <span v-if="teamleaderHours">{{ $trans('Teamleader') }}:&nbsp;</span>
            <PriceInput
              v-model="activity.price"
              :currency="activity.price_currency"
              @priceChanged="(dineroVal) => priceChanged(dineroVal, activity)"
            />
          </b-col>
          <b-col cols="2">
            <VAT v-model="activity.vat_type" @vatChanged="(val) => changeVatType(activity, val)" />
          </b-col>
          <b-col cols="3">
            <TotalsInputs
              :total="activity.total_dinero"
              :vat="activity.vat_dinero"
            />
          </b-col>
        </b-row>
      </template>
    </CostCollectionShell>
  </details>
</template>

<script setup lang="ts">

import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import CostCollectionShell from './CostCollectionShell.vue'
import {
  makeCostRow,
  useCostCollection,
  type CostRow,
} from '../use-cost-collection'
import { useCostPanelContext } from '../cost-panel-context'
import {
  COST_TYPE,
  normalizeCostDuration,
  type HoursCostType,
} from '../calculations'
import type { TeamleaderHourlyRate } from '../use-teamleader-products'

// The editor also accepts the older per-user duration aliases and partner metadata.
type UserTotal = { -readonly [K in keyof Api.ActivityUserTotal]: Api.ActivityUserTotal[K] } & {
  is_partner?: boolean
  extra_work?: string | null
  extra_work_secs?: number | null
  actual_work?: string | null
  actual_work_secs?: number | null
}
/**
 * One kind of hours (work, travel, extra, actual) as a cost collection: a draft
 * row per engineer built from the order's activity totals, or the rows already
 * saved for this order and type. A draft is seeded with the tenant's default
 * hourly rate (or the Teamleader rate) and each row's price is edited in
 * place. The order, engineers and the invoice-lines callbacks come from the
 * form through `useCostPanelContext`.
 */
const props = withDefaults(defineProps<{
  type?: HoursCostType | null
  /** The order's total for this kind of hours, as the API formats it. */
  hours_total?: string | null
  user_totals?: UserTotal[] | null
  /** The configured Teamleader rate, which seeds the drafts instead of the tenant default when set. */
  teamleaderHours?: TeamleaderHourlyRate | null
}>(), { type: null, hours_total: null, user_totals: null, teamleaderHours: null })
const context = useCostPanelContext()
const mainStore = useMainStore()
const default_currency = mainStore.getDefaultCurrency
const invoice_default_vat = mainStore.getInvoiceDefaultVat
const totalHours = ref<string | null>(null)
const costType = computed(() => {
  if (props.type == null) throw new Error('An hours cost type is required')
  return props.type
})

function getTitle() {
  const type = costType.value
  switch (type) {
    case COST_TYPE.WORK_HOURS: return $trans('Work hours')
    case COST_TYPE.TRAVEL_HOURS: return $trans('Travel hours')
    case COST_TYPE.EXTRA_WORK: return $trans('Extra work')
    case COST_TYPE.ACTUAL_WORK: return $trans('Actual work')
    default: {
      const unknownType: never = type
      throw new Error('Unknown hours cost type: ' + String(unknownType))
    }
  }
}
function durationFor(activity: UserTotal) {
  const type = costType.value
  switch (type) {
    case COST_TYPE.WORK_HOURS: return { read: activity.work_total, seconds: activity.work_total_secs }
    case COST_TYPE.TRAVEL_HOURS: return { read: activity.travel_total, seconds: activity.travel_total_secs }
    case COST_TYPE.EXTRA_WORK: return { read: activity.extra_work ?? activity.extra_work_total, seconds: activity.extra_work_secs ?? activity.extra_work_total_secs }
    case COST_TYPE.ACTUAL_WORK: return { read: activity.actual_work, seconds: activity.actual_work_secs }
    default: {
      const unknownType: never = type
      throw new Error('Unknown hours cost type: ' + String(unknownType))
    }
  }
}
function defaultRate() {
  return {
    price: props.teamleaderHours ? props.teamleaderHours.selling_price : mainStore.getInvoiceDefaultHourlyRate,
    currency: default_currency,
  }
}
function buildRows() {
  return (props.user_totals ?? []).flatMap(activity => {
    const duration = durationFor(activity)
    if (duration.seconds === null) return []
    return [makeCostRow({
      ...activity,
      cost_type: costType.value,
      order: context.orderPk.value ?? undefined,
      user_id: Number(activity.user_id),
      user: activity.is_partner ? null : Number(activity.user_id),
      user_full_name: activity.is_partner ? activity.full_name : null,
      amount_duration_read: duration.read ?? '',
      amount_duration: duration.seconds ?? null,
      amount_duration_secs: parseInt(String(duration.seconds), 10),
    }, defaultRate(), invoice_default_vat)]
  })
}
const {
  collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
  parentHasInvoiceLines, useOnInvoiceOptions, saveCollection, emptyCollectionClicked,
  createInvoiceLinesClicked, changeVatType, priceChanged, getFullname,
} = useCostCollection({
  context,
  costType: () => costType.value,
  currency: () => default_currency,
  buildRows,
  description: row => getTitle() + ': ' + row.user_full_name,
  title: getTitle,
  amount: () => totalHours.value ?? props.hours_total ?? '',
})
/**
 * A duration was typed: normalise it onto the row and refresh the summary
 * total the "total" invoice line reports as its amount. The row's own totals
 * refresh when the set is saved and the server prices it.
 *
 * The edit lives on this panel's own rows. `user_totals` is the form's
 * bootstrap data and is shared by all four hours panels, so it is never
 * written back to: doing so used to overwrite `work_total` from the travel,
 * extra and actual panels alike.
 */
function activityDurationChange(activity: CostRow) {
  Object.assign(activity, normalizeCostDuration(activity.amount_duration_read))
  const totalSeconds = collection.value.reduce((sum, row) => sum + (row.amount_duration_secs ?? 0), 0)
  // Retain the legacy summary conversion independently of per-row duration normalization.
  const hours = (totalSeconds / 3600).toFixed(0)
  const minutes = (totalSeconds - Number(hours) * 3600) % 60
  totalHours.value = hours + ':' + (minutes < 10 ? '0' : '') + minutes
}
</script>

<style scoped>

</style>
