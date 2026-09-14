<template>
  <StatsPage
    v-model:order-type="orderType"
    period="year"
    :title="$trans('Total orders in ') + year"
    :previous-title="$trans('Year back')"
    :next-title="$trans('Next year')"
    :is-loading="query.isLoading.value"
    @previous="year -= 1"
    @next="year += 1"
  >
    <template v-if="charts">
      <div class="app-grid">
        <ChartPairRow
          id="year"
          :pair="charts.year"
        />
      </div>
      <div class="app-grid">
        <ChartPairRow
          v-for="(pair, month) in charts.months"
          :id="`order-types-${month}`"
          :key="month"
          :pair="pair"
        />
      </div>
    </template>
  </StatsPage>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { orderOrderYearListRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import type { Statuscode } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import ChartPairRow from './ChartPairRow.vue'
import StatsPage from './StatsPage.vue'
import { yearCharts } from './chart-data'

/** A year of orders: the monthly totals, then the statuses per month. */
const mainStore = useMainStore()

const year = ref(new Date().getFullYear())
const orderType = ref('all')

const query = useQuery(() => orderOrderYearListRetrieveOptions({
  query: {order_type: orderType.value, year: year.value},
}))
useQueryErrorToast(query.error, $trans('Error loading year stats'))

const monthLabels = computed(() => {
  const format = new Intl.DateTimeFormat(mainStore.getCurrentLanguage || 'nl', {month: 'short'})
  return Array.from({length: 12}, (_, index) => format.format(new Date(2000, index, 1)))
})

const charts = computed(() => {
  const data = query.data.value
  if (!data) return null
  return yearCharts(data, orderType.value, monthLabels.value, (mainStore.getStatuscodes ?? []) as Statuscode[])
})
</script>
