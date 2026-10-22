<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
  >
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiFileArrowDown />
            <span>{{ $trans('Import preview') }}</span>
          </h3>
        </div>
      </header>

      <div
        v-if="!isLoading"
        class="page-detail import-preview"
      >
        <div class="app-detail">
          <b-card no-body>
            <b-tabs
              pills
              card
            >
              <b-tab
                v-for="pill in pills"
                :key="pill.key"
              >
                <template #title>
                  {{ pill.title }}
                  <BBadge
                    v-if="errorRows(pill.key).length > 0"
                    variant="danger"
                    :title="$trans('Rows that will not be imported')"
                  >
                    {{ errorRows(pill.key).length }}
                  </BBadge>
                </template>
                <b-card-text>
                  <BAlert
                    v-if="unknownColumns(pill.key).length > 0"
                    variant="warning"
                    :model-value="true"
                  >
                    {{ $trans('These columns are not read by the import and will be ignored') }}:
                    <b>{{ unknownColumns(pill.key).join(', ') }}</b>
                  </BAlert>
                  <template v-if="errorRows(pill.key).length > 0">
                    <h4 class="text-danger">
                      {{ errorRows(pill.key).length }} {{ $trans('rows will not be imported') }}
                    </h4>
                    <b-table
                      small
                      :fields="errorFields"
                      :items="errorRows(pill.key)"
                      responsive="md"
                      class="data-table import-errors"
                    />
                  </template>
                  <h4>{{ sheet(pill.key).length }} {{ $trans('entries') }}</h4>
                  <p>
                    {{ $trans('Existing records will be checked on') }}:
                    <b><i>{{ (lookupFields[baseKey(pill.key)] ?? []).join(', ') }}</i></b>
                  </p>
                  <b-table
                    small
                    :fields="fieldsFor(pill.key)"
                    :items="sheet(pill.key)"
                    responsive="md"
                    class="data-table"
                  >
                    <template #cell(mode)="data">
                      <span
                        v-if="data.item.import_created"
                        class="text-success"
                      >
                        {{ $trans('insert') }}
                      </span>
                      <span
                        v-else
                        class="text-warning"
                      >
                        {{ $trans('update') }}
                      </span>
                    </template>
                  </b-table>
                </b-card-text>
              </b-tab>
            </b-tabs>
          </b-card>
          <footer class="modal-footer">
            <BButton
              type="button"
              variant="secondary"
              @click="cancel"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              type="button"
              variant="primary"
              :disabled="isDoing"
              @click="showImportModal"
            >
              {{ $trans('Import all') }}
            </BButton>
          </footer>
        </div>
      </div>

      <b-modal
        id="import-all-modal"
        ref="importModal"
        :title="$trans('Import?')"
        @ok.prevent="importAll"
      >
        <p class="my-4">{{ $trans('Import these records?') }}</p>
      </b-modal>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { importingImportGetLookupFieldsRetrieveOptions } from '@/api/@tanstack/vue-query.gen'

import {
  useQueryErrorToast,
} from '@/features/forms'
import type { PreviewRow } from './schemas'

type SheetKey = 'customers' | 'branches' | 'equipment' | 'locations' | 'materials' | 'suppliers'

/**
 * The preview of one import run: the sheets it would write, one pill each,
 * with the lookup fields existing records are checked on. Importing writes
 * the sheets and lands back on the list.
 */
const props = defineProps<{
  /** The route's `:pk`, passed through by the layout. */
  pk: string | number
  /** The route name stem this mount answers to. Supplied by the routers. */
  route_prefix: string
}>()

const { mainStore, router, toast, queryClient } = useCommon()
const hasBranches = mainStore.getMemberHasBranches

const importModal = useTemplateRef<{show: () => void, hide: () => void}>('importModal')
const isDoing = ref(false)

const id = computed(() => Number(props.pk))

const previewQuery = useQuery(Api.ImportingImport.extras.previewRetrieve.options({ path: { id: id.value } }))
const lookupQuery = useQuery(importingImportGetLookupFieldsRetrieveOptions())
useQueryErrorToast(previewQuery.error, $trans('Error loading import preview'))
useQueryErrorToast(lookupQuery.error, $trans('Error loading import preview'))

const importData = computed(() => previewQuery.data.value)
const lookupFields = computed<Record<string, string[]>>(
  () => (lookupQuery.data.value ?? {}))
const isLoading = computed(() => previewQuery.isLoading.value || lookupQuery.isLoading.value)

const pillTitles: Record<SheetKey, string> = {
  customers: $trans('Customers'),
  branches: $trans('Branches'),
  equipment: $trans('Equipment'),
  locations: $trans('Locations'),
  materials: $trans('Materials'),
  suppliers: $trans('Suppliers'),
}

/** The sheets this run would write, in the legacy screen's own order. */
const pills = computed(() => (Object.keys(pillTitles) as SheetKey[])
  .filter((key) => importData.value?.[key] != null)
  .map((key) => ({ title: pillTitles[key], key })))

function sheet(key: SheetKey): PreviewRow[] {
  return (importData.value?.[key]?.import ?? []) as PreviewRow[]
}

/** The sheet's column headers the import does not read, such as `ID` for `identifier`. */
function unknownColumns(key: SheetKey): string[] {
  return importData.value?.[key]?.unknown_columns ?? []
}

const errorMessages: Record<string, string> = {
  'customer not found': $trans('Customer not found'),
  'branch not found': $trans('Branch not found'),
  'location not found': $trans('Location not found'),
}

const errorFields = [
  { key: 'name', label: $trans('Row') },
  { key: 'reason', label: $trans('Reason') },
  { key: 'details', label: $trans('Details') },
]

interface ErrorRow {
  name: string
  reason: string
  details: string
}

/**
 * The rows the import could not place, each with why. A row missing required
 * columns names them (`required_not_ok`, the row under `record`); a row whose
 * owner or location lookup failed carries the `error` and the lookup it tried
 * (`kwargs`, the row under `row`).
 */
function errorRows(key: SheetKey): ErrorRow[] {
  return (importData.value?.[key]?.errors ?? []).map((error) => {
    const row = error.record ?? error.row ?? {}
    const name = typeof row.name === 'string' && row.name !== '' ? row.name : JSON.stringify(row)
    if (error.required_not_ok) {
      return {
        name,
        reason: $trans('Required fields are missing'),
        details: error.required_not_ok.join(', '),
      }
    }
    return {
      name,
      reason: error.error ? (errorMessages[error.error] ?? error.error) : '',
      details: error.kwargs ?? '',
    }
  })
}

/** `locations__x` looks its lookup up under `locations`. */
function baseKey(key: string): string {
  return key.split('_')[0]
}

const branchFields = [
  { key: 'name', label: $trans('Name') },
  { key: 'address', label: $trans('Address') },
  { key: 'postal', label: $trans('Postal') },
  { key: 'city', label: $trans('City') },
  { key: 'country_code', label: $trans('Country') },
  { key: 'tel', label: $trans('Phone') },
  { key: 'mode', label: '' },
]
const customerFields = [
  { key: 'name', label: $trans('Name') },
  { key: 'address', label: $trans('Address') },
  { key: 'postal', label: $trans('Postal') },
  { key: 'city', label: $trans('City') },
  { key: 'country_code', label: $trans('Country') },
  { key: 'tel', label: $trans('Phone') },
  { key: 'mode', label: '' },
]
const equipmentFieldsBranches = [
  { key: 'customer_branch_view.name', label: $trans('Branch') },
  { key: 'name', label: $trans('Equipment') },
  { key: 'brand', label: $trans('Brand') },
  { key: 'location_name', label: $trans('Location') },
  { key: 'mode', label: '' },
]
const equipmentFieldsCustomers = [
  { key: 'customer_branch_view.name', label: $trans('Customer') },
  { key: 'name', label: $trans('Equipment') },
  { key: 'brand', label: $trans('Brand') },
  { key: 'location_name', label: $trans('Location') },
  { key: 'mode', label: '' },
]
const locationFieldsCustomers = [
  { key: 'name', label: $trans('Name') },
  { key: 'customer_branch_view.name', label: $trans('Customer') },
  { key: 'mode', label: '' },
]
const locationFieldsBranches = [
  { key: 'name', label: $trans('Name') },
  { key: 'customer_branch_view.name', label: $trans('Branch') },
  { key: 'mode', label: '' },
]
const materialFields = [
  { key: 'name', label: $trans('Name') },
  { key: 'show_name', label: $trans('Name') },
  { key: 'identifier', label: $trans('Identifier') },
  { key: 'price_purchase_ex', label: $trans('Purchase price ex.') },
  { key: 'price_selling_ex', label: $trans('Selling price ex.') },
  { key: 'supplier_name', label: $trans('Supplier') },
  { key: 'mode', label: '' },
]
const supplierFields = [
  { key: 'name', label: $trans('Name') },
  { key: 'address', label: $trans('Address') },
  { key: 'postal', label: $trans('Postal') },
  { key: 'city', label: $trans('City') },
  { key: 'country_code', label: $trans('Country') },
  { key: 'tel', label: $trans('Phone') },
  { key: 'mode', label: '' },
]

function fieldsFor(key: SheetKey) {
  switch (key) {
    case 'customers': return customerFields
    case 'branches': return branchFields
    case 'equipment': return hasBranches ? equipmentFieldsBranches : equipmentFieldsCustomers
    case 'locations': return hasBranches ? locationFieldsBranches : locationFieldsCustomers
    case 'materials': return materialFields
    case 'suppliers': return supplierFields
  }
}

const doMutation = useMutation(Api.ImportingImport.extras.doCreate.mutation())

/**
 * The import confirmation, as a modal rather than the legacy blocking
 * `confirm()`: same copy, same toast pair, and the list refetches behind the
 * ride back to it.
 */
function showImportModal() {
  importModal.value?.show()
}

async function importAll() {
  if (isDoing.value) return
  isDoing.value = true
  try {
    await doMutation.mutateAsync({ path: { id: id.value } })
    infoToast(toast, $trans('Imported'), $trans('Data has been imported'))
    await Api.ImportingImport.invalidate(queryClient)
    importModal.value?.hide()
    await router.push(toRoute(`${props.route_prefix}-list` as RouteName))
  } catch {
    errorToast(toast, $trans('Error importing data'))
  } finally {
    isDoing.value = false
  }
}

async function cancel() {
  await router.push(toRoute(`${props.route_prefix}-list` as RouteName))
}
</script>
