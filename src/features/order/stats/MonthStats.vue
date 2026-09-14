<template>
  <StatsPage
    v-model:order-type="orderType"
    period="month"
    :title="`${$trans('Total orders in ')} ${monthName} ${year}`"
    :previous-title="$trans('Month back')"
    :next-title="$trans('Next month')"
    :is-loading="query.isLoading.value"
    @previous="step(-1)"
    @next="step(1)"
  >
    <template v-if="charts">
      <div class="app-grid">
        <ChartPairRow
          id="month"
          :pair="charts.month"
        />
      </div>
      <div class="app-grid">
        <ChartPairRow
          v-for="(pair, week) in charts.weeks"
          :id="`order-types-${week}`"
          :key="week"
          :pair="pair"
        />
      </div>
      <div class="app-grid">
        <ChartPairRow
          v-for="(pair, week) in charts.assigned"
          :id="`assigned-orders-${week}`"
          :key="week"
          :pair="pair"
        />
      </div>
    </template>
  </StatsPage>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { orderOrderMonthListRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import type { Statuscode } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import ChartPairRow from './ChartPairRow.vue'
import StatsPage from './StatsPage.vue'
import { monthCharts } from './chart-data'

/** A month of orders: the weekly totals, the statuses per week, the assignments per week. */
const mainStore = useMainStore()

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)
const orderType = ref('all')

function step(delta: number) {
  const next = new Date(year.value, month.value - 1 + delta, 1)
  year.value = next.getFullYear()
  month.value = next.getMonth() + 1
}

const monthName = computed(() =>
  new Intl.DateTimeFormat(mainStore.getCurrentLanguage || 'nl', {month: 'long'}).format(new Date(year.value, month.value - 1, 1)),
)

const query = useQuery(() => orderOrderMonthListRetrieveOptions({
  query: {order_type: orderType.value, year: year.value, month: month.value},
}))
useQueryErrorToast(query.error, $trans('Error loading month stats'))

const charts = computed(() => {
  const data = query.data.value
  if (!data) return null
  return monthCharts(
    data,
    orderType.value,
    (week) => `${$trans('week')} ${week}`,
    (mainStore.getStatuscodes ?? []) as Statuscode[],
  )
})
</script>
