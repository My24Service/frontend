<template>
  <div
    v-if="record"
    class="app-page"
  >
    <header>
      <div class="page-title">
        <h3>
          <IBiCreditCard2Front />
          <span
            class="backlink"
            @click="goBack"
          >{{ $trans('Budgets') }}</span> /
          <strong>{{ record.year }}</strong>
        </h3>
        <h3 :title="`${record.year} ${$trans('Budget size')}: ${formatDinero(budgetDinero)}`">
          <small class="dimmed">{{ $trans('Budget size') }}</small>
          {{ formatDinero(budgetDinero) }}
        </h3>
      </div>
    </header>

    <div class="page-detail">
      <div
        v-if="isLoading"
        class="text-center panel"
      >
        <b-spinner class="align-middle" />&nbsp;&nbsp;
        <strong>{{ $trans('Loading...') }}</strong>
      </div>

      <div
        v-else
        class="flex-columns"
      >
        <div class="panel col-1-2">
          <h6
            class="flex-columns"
            style="justify-content: space-between"
          >
            <span>{{ $trans('Costs') }}</span>
            <span class="dimmed">{{ formatDinero(costsTotalDinero) }} / {{ formatDinero(budgetDinero) }}</span>
          </h6>

          <b-progress>
            <b-progress-bar
              :value="costsChart.data[0]"
              :title="`${costsChart.labels[0]}, ${costsChart.labels[1]}`"
            />
          </b-progress>

          <hr>
          <h6>{{ $trans('Costs breakdown') }}</h6>

          <PieChart
            id="pie-chart-costs-detail"
            v-if="!isLoading"
            :chart-data="costsChartDetail"
            :options="chartOptions"
          />
        </div>

        <div class="panel col-1-2">
          <h6
            class="flex-columns"
            style="justify-content: space-between"
          >
            {{ $trans('Expected costs') }}
            <span class="dimmed">{{ formatDinero(expectedTotalDinero) }}</span>
          </h6>
          <b-progress>
            <b-progress-bar
              style="--delay: 2"
              :value="expectedChart.data[0]"
              :title="`${expectedChart.labels[0]}, ${expectedChart.labels[1]}`"
            />
          </b-progress>

          <h6>{{ $trans('Expected costs breakdown') }}</h6>

          <PieChart
            id="pie-chart-expected-costs-detail"
            v-if="!isLoading"
            :chart-data="expectedChartDetail"
            :options="chartOptions"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  companyBudgetCostsRetrieveOptions,
  companyBudgetExpectedCostsRetrieveOptions,
  companyBudgetRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Budget, BudgetCostsResponse, BudgetExpectedCostsResponse } from '@/api/types.gen'
import { PieChart } from '@/features/shared'
import { useQueryErrorToast } from '@/features/forms'
import { formatMoneyEuropean as formatDinero, toDinero } from '@/services/money'
/**
 * The budget detail page: the budget's size against its actual and expected
 * costs, as progress bars and breakdown pies.
 *
 * Three reads - the record and its two cost aggregations - fire as parallel
 * queries rather than the legacy screen's sequence; the charts render when
 * all three have answered. The chart math is the legacy screen's, including
 * the European amount format; the two commented-out pies it carried are gone.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const mainStore = useMainStore()
const currency = computed(() => mainStore.getDefaultCurrency)

const id = computed(() => (props.pk == null ? null : Number(props.pk)))

const detailQuery = useQuery(() => ({
  ...companyBudgetRetrieveOptions({ path: { id: id.value ?? 0 } }),
  enabled: id.value != null,
}))
const costsQuery = useQuery(() => ({
  ...companyBudgetCostsRetrieveOptions({ path: { id: id.value ?? 0 } }),
  enabled: id.value != null,
}))
const expectedQuery = useQuery(() => ({
  ...companyBudgetExpectedCostsRetrieveOptions({ path: { id: id.value ?? 0 } }),
  enabled: id.value != null,
}))
useQueryErrorToast(detailQuery.error, $trans('Error fetching budget'))
useQueryErrorToast(costsQuery.error, $trans('Error fetching budget costs'))
useQueryErrorToast(expectedQuery.error, $trans('Error fetching expected costs'))

const record = computed(() => detailQuery.data.value)
const costs = computed(() => costsQuery.data.value)
const expected = computed(() => expectedQuery.data.value)

const isLoading = computed(() =>
  detailQuery.isLoading.value || costsQuery.isLoading.value || expectedQuery.isLoading.value)

const budgetAmount = computed(() => Number(record.value?.amount ?? 0))
const costsTotal = computed(() => costs.value?.total ?? 0)
const expectedTotal = computed(() => expected.value?.total ?? 0)

const budgetDinero = computed(() => toDinero(record.value?.amount ?? '0', currency.value))
const costsTotalDinero = computed(() => toDinero(costsTotal.value, currency.value))
const expectedTotalDinero = computed(() => toDinero(expectedTotal.value, currency.value))

const colors: Record<string, string> = {}

function colorFor(label: string): string {
  if (!(label in colors)) {
    colors[label] = `#${Math.floor(Math.random() * 16777215).toString(16)}`
  }
  return colors[label]
}

interface ChartData {
  labels: string[]
  data: string[]
}

function percent(part: number, whole: number): string {
  return ((part / whole) * 100).toFixed(2)
}

const costsChart = computed<ChartData>(() => {
  const rest = budgetAmount.value - costsTotal.value
  return {
    labels: [
      `${$trans('Costs')} ${formatDinero(costsTotalDinero.value)}`,
      `${$trans('Remaining')} ${formatDinero(toDinero(rest, currency.value))}`,
    ],
    data: [percent(costsTotal.value, budgetAmount.value), percent(rest, budgetAmount.value)],
  }
})

const costsChartDetail = computed(() => {
  const purchase = costs.value?.purchase_invoices ?? 0
  const labels = [`${$trans('Purchase invoices')} (${formatDinero(toDinero(purchase, currency.value))})`]
  const data = [percent(purchase, costsTotal.value)]
  for (const [companycode, amount] of Object.entries(costs.value?.invoices_partners ?? {})) {
    const label = `${$trans('Invoices partners')} - ${companycode} (${formatDinero(toDinero(amount, currency.value))})`
    labels.push(label)
    data.push(percent(amount, costsTotal.value))
  }
  return { labels, datasets: [{ data, backgroundColor: labels.map(colorFor) }] }
})

const expectedChart = computed<ChartData>(() => {
  const rest = budgetAmount.value - expectedTotal.value
  return {
    labels: [
      `${$trans('Expected costs')} (${formatDinero(expectedTotalDinero.value)})`,
      `${$trans('Remaining')} (${formatDinero(toDinero(rest, currency.value))})`,
    ],
    data: [percent(expectedTotal.value, budgetAmount.value), percent(rest, budgetAmount.value)],
  }
})

const expectedChartDetail = computed(() => {
  const replacements = expected.value?.equipment_replacements ?? 0
  const labels = [`${$trans('Equipment replacements')} (${formatDinero(toDinero(replacements, currency.value))})`]
  // The expected detail divides the replacements by the *actual* costs total,
  // as the legacy screen did - not by the expected total below it.
  const data = [percent(replacements, costsTotal.value)]
  for (const [companycode, amount] of Object.entries(expected.value?.partner_maintenance_contracts ?? {})) {
    const label = `${$trans('Maintenance contracts partners')} - ${companycode} (${formatDinero(toDinero(amount, currency.value))})`
    labels.push(label)
    data.push(percent(amount, expectedTotal.value))
  }
  for (const [customerName, amount] of Object.entries(expected.value?.own_maintenance_contracts ?? {})) {
    const label = `${$trans('Own maintenance contracts')} - ${customerName} (${formatDinero(toDinero(amount, currency.value))})`
    labels.push(label)
    data.push(percent(amount, expectedTotal.value))
  }
  return { labels, datasets: [{ data, backgroundColor: labels.map(colorFor) }] }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      formatter: (value: string) => `${value}%`,
      color: '#fff',
    },
  },
}

function goBack() {
  router.go(-1)
}
</script>
