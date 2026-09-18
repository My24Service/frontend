<template>
  <details>
    <summary class="flex-columns space-between">
      <h6>{{ getTitle() }}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>

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
          @buttonClicked="() => { emptyCollectionClicked() }"
        />

        <AddToInvoiceLinesDiv
          v-if="!parentHasInvoiceLines"
          :useOnInvoiceOptions="useOnInvoiceOptions"
          @buttonClicked="createInvoiceLinesClicked"
        />

      </div>

      <b-container fluid v-if="!isLoading && !hasStoredData">
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
              :text='$trans("Engineer rate")'
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
            <BFormRadioGroup
              @change="updateTotals"
              v-model="activity.use_price"
              v-if="!teamleaderHours"
            >
              <BFormRadio :value="usePriceOptions.USE_PRICE_USER" v-if="!activity.is_partner">
                {{ $trans('Engineer') }}
                {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_USER).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_SETTINGS">
                {{ $trans('Settings') }}
                {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_SETTINGS).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_CUSTOMER">
                {{ $trans('Customer') }}
                {{ getEngineerRateFor(activity, usePriceOptions.USE_PRICE_CUSTOMER).toFormat("$0.00") }}
              </BFormRadio>

              <BFormRadio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="activity.price_other"
                    :currency="activity.price_other_currency"
                    @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, activity)"
                  />
                </p>
              </BFormRadio>
            </BFormRadioGroup>
            <BFormRadioGroup
              @change="updateTotals"
              v-model="activity.use_price"
              v-if="teamleaderHours"
            >
              <p class="flex">
                {{ $trans('Teamleader') }}:&nbsp;
                <PriceInput
                  v-model="activity.price"
                  :currency="activity.price_currency"
                  @priceChanged="(dineroVal) => otherPriceChanged(dineroVal, activity)"
                />
              </p>
            </BFormRadioGroup>
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
        <TotalRow
          :items_total="hours_total"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />

        <CollectionButton
          mode="save"
          @buttonClicked="() => { saveCollection() }"
        />

      </b-container>
    </b-overlay>
  </details>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ActivityUserTotal, UsePriceEnum } from '@/api/types.gen'
import PriceInput from '@/components/PriceInput.vue'
import TotalsInputs from '@/components/TotalsInputs.vue'
import { $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import HeaderCell from './Header.vue'
import VAT from './VAT.vue'
import TotalRow from './TotalRow.vue'
import CostsTable from './CostsTable.vue'
import CollectionButton from './CollectionButton.vue'
import AddToInvoiceLinesDiv from './AddToInvoiceLinesDiv.vue'
import { makeCostRow, useCostCollection } from '../use-cost-collection'
import type { CostRow } from '../use-cost-collection'
import { useCostPanelContext } from '../cost-panel-context'
import { hourlyPrice, normalizeCostDuration } from '../calculations'
import type { HoursCostType } from '../calculations'
import type { TeamleaderHourlyRate } from '../use-teamleader-products'
import { COST_TYPE_WORK_HOURS, COST_TYPE_TRAVEL_HOURS, COST_TYPE_EXTRA_WORK, COST_TYPE_ACTUAL_WORK, USE_PRICE_USER, USE_PRICE_SETTINGS, USE_PRICE_CUSTOMER, USE_PRICE_OTHER } from '../calculations'

// The editor also accepts the older per-user duration aliases and partner metadata.
type UserTotal = { -readonly [K in keyof ActivityUserTotal]: ActivityUserTotal[K] } & {
  is_partner?: boolean
  extra_work?: string | null
  extra_work_secs?: number | null
  actual_work?: string | null
  actual_work_secs?: number | null
}
/**
 * One kind of hours (work, travel, extra, actual) as a cost collection: a draft
 * row per engineer built from the order's activity totals, or the rows already
 * saved for this order and type. The order, customer, engineers and the
 * invoice-lines callbacks come from the form through `useCostPanelContext`.
 */
const props = withDefaults(defineProps<{
  type?: HoursCostType | null
  /** The order's total for this kind of hours, as the API formats it. */
  hours_total?: string | null
  user_totals?: UserTotal[] | null
  /** The configured Teamleader rate, which replaces the rate options when set. */
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
const usePriceOptions = { USE_PRICE_USER, USE_PRICE_SETTINGS, USE_PRICE_CUSTOMER, USE_PRICE_OTHER } as const

function getTitle() {
  const type = costType.value
  switch (type) {
    case COST_TYPE_WORK_HOURS: return $trans('Work hours')
    case COST_TYPE_TRAVEL_HOURS: return $trans('Travel hours')
    case COST_TYPE_EXTRA_WORK: return $trans('Extra work')
    case COST_TYPE_ACTUAL_WORK: return $trans('Actual work')
    default: {
      const unknownType: never = type
      throw new Error('Unknown hours cost type: ' + String(unknownType))
    }
  }
}
function durationFor(activity: UserTotal) {
  const type = costType.value
  switch (type) {
    case COST_TYPE_WORK_HOURS: return { read: activity.work_total, seconds: activity.work_total_secs }
    case COST_TYPE_TRAVEL_HOURS: return { read: activity.travel_total, seconds: activity.travel_total_secs }
    case COST_TYPE_EXTRA_WORK: return { read: activity.extra_work ?? activity.extra_work_total, seconds: activity.extra_work_secs ?? activity.extra_work_total_secs }
    case COST_TYPE_ACTUAL_WORK: return { read: activity.actual_work, seconds: activity.actual_work_secs }
    default: {
      const unknownType: never = type
      throw new Error('Unknown hours cost type: ' + String(unknownType))
    }
  }
}
function getPrice(row: CostRow, option: UsePriceEnum = row.use_price) {
  if (option === 'purchase' || option === 'selling') throw new Error('Invalid hours price option: ' + option)
  const user = context.engineers.value.find(user => user.id === (row.user || row.user_id))
  return hourlyPrice(option, {
    user: user?.engineer,
    is_partner: row.is_partner,
    settings: mainStore.getInvoiceDefaultHourlyRate,
    customer: context.customer.value?.hourly_rate_engineer,
    other: row.price_other,
    teamleader: props.teamleaderHours,
  })
}
function getEngineerRateFor(row: CostRow, option: UsePriceEnum) {
  const engineer = context.engineers.value.find(user => user.id === (row.user || row.user_id))
  const currency = option === USE_PRICE_USER
    ? engineer?.engineer.hourly_rate_currency ?? default_currency
    : option === USE_PRICE_CUSTOMER ? context.customer.value?.hourly_rate_engineer_currency ?? default_currency : default_currency
  return toDinero(getPrice(row, option), currency)
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
      use_price: USE_PRICE_SETTINGS,
      amount_duration_read: duration.read ?? '',
      amount_duration: duration.seconds ?? null,
      amount_duration_secs: parseInt(String(duration.seconds), 10),
    }, default_currency, invoice_default_vat)]
  })
}
const {
  collection, isLoading, hasStoredData, total_dinero, totalVAT_dinero,
  parentHasInvoiceLines, useOnInvoiceOptions, saveCollection, emptyCollectionClicked,
  createInvoiceLinesClicked, updateTotals, changeVatType, otherPriceChanged, getFullname,
} = useCostCollection({
  context,
  costType: () => costType.value,
  buildRows,
  rate: row => ({ price: getPrice(row), currency: default_currency }),
  description: row => getTitle() + ': ' + row.user_full_name,
  title: getTitle,
  amount: () => totalHours.value ?? props.hours_total ?? '',
})
/**
 * A duration was typed: normalise it onto the row, reprice, and refresh the
 * summary total the "total" invoice line reports as its amount.
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
  updateTotals()
}
// The form edits the same engineer and customer objects the rates read, so a
// price typed in Manage-prices reprices these draft rows at once.
watch(context.engineers, () => {
  updateTotals()
}, { deep: true })
watch(context.customer, () => {
  updateTotals()
}, { deep: true })
</script>

<style scoped>

</style>
