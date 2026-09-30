<template>
  <div class="app-page">
    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="title"
      :search-label="$trans('Search')"
      :refresh="refresh"
    >
      <template #icon><IBiBarChartLineFill /></template>
      <template #toolbar-extra>
        <ActionButton
          icon="download"
          :method="downloadList"
          :title="$trans('Download')"
        />
      </template>
    </ListPageHeader>

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

      <b-table
        id="stats-table"
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
        <template #cell(num_sales)="data">
          {{ data.item.num_sales }}
        </template>
        <template #cell(turnover)="data">
          &euro; {{ data.item.turnover.toFixed(2) }}
        </template>
        <template #cell(profit)="data">
          &euro; {{ data.item.profit.toFixed(2) }}
        </template>
        <template #cell(margin_product)="data">
          {{ data.item.margin_product.toFixed(2) }} %
        </template>
        <template #cell(sum_inventory)="data">
          <span
            v-for="(value, key, index) in data.item.sum_inventory"
            :key="index"
          >
            {{ inventoryHeaders[key] }}: {{ value }}
          </span>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inventoryMaterialStatsTableRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { inventoryStatsTableExportRetrieve } from '@/api/sdk.gen'
import { useQueryErrorToast } from '@/features/forms'
import { useFileDownload, XLSX_MIME } from '@/features/shared'
import { ListPageHeader } from '@/features/table'
import { tableFilterDelay } from '@/services/input-delays'

/**
 * How each material sold in a year: turnover, profit, margin, stock and where
 * the stock lies. The year and the search term are the read's key, so a new
 * year or term is a new read and going back to an old one is answered from the
 * cache. The table is not paged, so only the list header is the table kit's:
 * the title, refresh, the search field and the download beside them.
 *
 * The stats read has no binding on a resource (it hangs under
 * `InventoryMaterial.reads` only), so the generated `*Options` is used directly.
 */
const year = ref(new Date().getFullYear())
/** What is in the search field. */
const searchDraft = ref('')
/** The term at rest, as the kit's lists commit theirs; empty sends no `q`. */
const search = refDebounced(searchDraft, tableFilterDelay)

const title = computed(() => interpolate($trans('Stats in %(year)s'), {year: year.value}))

/** `year` and, only while there is a term, `q`: a blank term is not a search. */
const wireQuery = computed(() => ({year: year.value, ...(search.value ? {q: search.value} : {})}))

const statsQuery = useQuery(() => inventoryMaterialStatsTableRetrieveOptions({query: wireQuery.value}))
useQueryErrorToast(statsQuery.error, $trans('Error fetching data'))

function refresh() {
  void statsQuery.refetch()
}

const isLoading = computed(() => statsQuery.isLoading.value)
const rows = computed(() => statsQuery.data.value?.results ?? [])
/** The name of each stock location, by the key `sum_inventory` counts under. */
const inventoryHeaders = computed(() => statsQuery.data.value?.inventory_keys ?? {})

const tableFields = [
  {thAttr: {width: '20%'}, key: 'supplier.name', label: $trans('Supplier'), sortable: true},
  {thAttr: {width: '20%'}, key: 'name', label: $trans('Product'), sortable: true},
  {thAttr: {width: '10%'}, key: 'num_sales', label: $trans('Total sales'), sortable: true},
  {thAttr: {width: '10%'}, key: 'turnover', label: $trans('Turnover'), sortable: true},
  {thAttr: {width: '10%'}, key: 'profit', label: $trans('Profit'), sortable: true},
  {thAttr: {width: '10%'}, key: 'margin_product', label: $trans('Margin product'), sortable: true},
  {thAttr: {width: '10%'}, key: 'current_stock', label: $trans('Stock'), sortable: true},
  {thAttr: {width: '10%'}, key: 'sum_inventory', label: $trans('Locations'), sortable: false},
]

const download = useFileDownload()

/** The table as a spreadsheet, for the year and the search on screen. */
function downloadList() {
  return download.fromApi(
    () => inventoryStatsTableExportRetrieve({query: wireQuery.value, throwOnError: true}),
    'stats_table.xlsx',
    XLSX_MIME,
  )
}
</script>
