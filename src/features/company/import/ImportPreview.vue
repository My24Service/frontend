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
                :title="pill.title"
              >
                <b-card-text>
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
import {
  companyImportDoCreateMutation,
  companyImportGetLookupFieldsRetrieveOptions,
  companyImportPreviewRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { ImportResult } from '@/api/types.gen'
import { companyImport } from '@/api/resources.gen'
import {
  invalidateReads,
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

const router = useRouter()
const queryClient = useQueryClient()
const { create: toast } = useToast()
const hasBranches = useMainStore().getMemberHasBranches

const importModal = useTemplateRef<{show: () => void, hide: () => void}>('importModal')
const isDoing = ref(false)

const id = computed(() => Number(props.pk))

const previewQuery = useQuery(companyImportPreviewRetrieveOptions({ path: { id: id.value } }))
const lookupQuery = useQuery(companyImportGetLookupFieldsRetrieveOptions())
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

const doMutation = useMutation(companyImportDoCreateMutation())

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
    await invalidateReads(companyImport)(queryClient)
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
