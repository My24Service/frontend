<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiBarChartLineFill />{{ title }}</h3>
      </div>
    </header>
    <div class="app-detail panel">
      <b-row align-v="center">
        <b-col cols="1">
          <BLink
            :title="$trans('Year back')"
            @click.prevent="year--"
          >
            <IBiArrowLeft font-scale="1.8" />
          </BLink>
        </b-col>
        <b-col
          cols="10"
          class="text-center"
        >
          <b-row>
            <b-col cols="6">
              <BFormGroup
                label-size="sm"
                :label="$trans('Graph type')"
                label-for="graph-type"
              >
                <BFormSelect
                  id="graph-type"
                  v-model="mode"
                  :options="modes"
                  size="sm"
                />
              </BFormGroup>
            </b-col>
            <b-col cols="6">
              <BFormGroup
                label-size="sm"
                :label="$trans('Show')"
                label-for="graph-field"
              >
                <BFormRadioGroup
                  id="graph-field"
                  v-model="graphField"
                  :options="graphFields"
                  class="mb-3"
                  value-field="item"
                  text-field="name"
                />
              </BFormGroup>
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="1">
          <div class="float-right">
            <BLink
              :title="$trans('Next year')"
              @click.prevent="year++"
            >
              <IBiArrowRight font-scale="1.8" />
            </BLink>
          </div>
        </b-col>
      </b-row>

      <bar-chart
        v-if="!isLoading && sales"
        :chart-data="chartData"
        :options="chartOptions"
      />

      <b-table
        id="year-table"
        small
        :busy="isLoading"
        :fields="tableFields"
        :items="rows"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle" />&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(sum_amount)="data">
          {{ data.item.sum_amount }}
          <span>({{ data.item.amount_perc }}%)</span>
        </template>
        <template #cell(sum_price_selling)="data">
          &euro; {{ data.item.sum_price_selling.toFixed(2) }}
          <span>({{ data.item.amount_selling_perc }}%)</span>
        </template>
        <template #cell(sum_price_purchase)="data">
          &euro; {{ data.item.sum_price_purchase.toFixed(2) }}
        </template>
        <template #cell(profit)="data">
          &euro; {{ data.item.profit.toFixed(2) }}
        </template>
      </b-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQueryErrorToast, useQueryOf } from '@/features/forms'
import { BarChart } from '@/features/shared'
import {
  barLabelFor,
  columnsFor,
  datasetLabelFor,
  graphFieldOptions,
  modeOptions,
  salesOptions,
  type GraphField,
  type SalesMode,
  type SalesRow,
} from './total-sales'

/**
 * Sales by material, supplier or customer for a year, as a bar chart over a
 * table. Each mode's read has the year in its key: going back a year and
 * forth again, or switching modes, is answered from the query cache, and a
 * year change never shows another year's rows.
 */
const year = ref(new Date().getFullYear())
const mode = ref<SalesMode>('total-material-sales')
const graphField = ref<GraphField>('sum_amount')

const modes = modeOptions()
const graphFields = graphFieldOptions()

const title = computed(() => interpolate($trans('Total sales in %(year)s'), {year: year.value}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const salesQuery = useQueryOf<{result: SalesRow[]}>(() => salesOptions(mode.value, year.value))
// A read that fails says so; the legacy screen swallowed it and spun forever.
useQueryErrorToast(salesQuery.error, $trans('Error fetching data'))

const sales = computed(() => salesQuery.data.value)
const isLoading = computed(() => salesQuery.isLoading.value)
const rows = computed(() => sales.value?.result ?? [])
const tableFields = computed(() => columnsFor(mode.value))

const chartData = computed(() => ({
  labels: rows.value.map((row) => barLabelFor(mode.value, row)),
  datasets: [{
    label: datasetLabelFor(mode.value, year.value),
    data: rows.value.map((row) => row[graphField.value]),
    backgroundColor: '#f87979',
  }],
}))
</script>
