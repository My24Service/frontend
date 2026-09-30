<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiBoxArrowRight />{{ $trans('Move materials') }}</h3>
        <div
          class="flex-columns"
          style="z-index:1000"
        >
          <b-dropdown
            split
            :text="$trans('Submit')"
            class="m-2"
            variant="primary"
            :disabled="cannotSubmit"
            @click="submit(false)"
          >
            <b-dropdown-item-button
              :disabled="cannotSubmit"
              :title="$trans('Submit and move another material')"
              @click="submit(true)"
            >
              {{ $trans('Bulk') }}
            </b-dropdown-item-button>
          </b-dropdown>
        </div>
      </div>
    </header>
    <div class="page-detail">
      <b-form class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans("Material") }}</h6>

          <div v-if="selectedMaterial">
            <h3>{{ selectedMaterial.material_name }}</h3>
            <dl>
              <dt>{{ $trans("In stock") }}</dt>
              <dd>{{ selectedMaterial.total_amount }}</dd>
              <dt>{{ $trans("Supplier") }}</dt>
              <dd>{{ selectedMaterial.supplier_name }}</dd>
              <dt v-if="selectedMaterial.material_identifier">{{ $trans("Identifier") }}</dt>
              <dd v-if="selectedMaterial.material_identifier">{{ selectedMaterial.material_identifier }}</dd>
            </dl>
            <h6>{{ $trans('Amount') }}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              :label="$trans('Number of items to move')"
              label-for="move-material-amount"
            >
              <BFormInput
                id="move-material-amount"
                ref="amount"
                v-model="values.amount"
                size="sm"
                type="number"
                :max="selectedMaterial.total_amount"
                min="1"
              />
              <b-form-invalid-feedback :state="state('amount')">
                {{ errors.amount }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
          <div
            v-else
            class="dimmed"
          >
            <h3>
              <span class="h1"><br><IBiBox /></span>
              <br><br>{{ $trans("Material") }}
            </h3>
          </div>
          <BFormGroup
            label-size="sm"
            label-for="move-material-purchase-order-material-search"
          >
            <VueMultiselect
              id="move-material-purchase-order-material-search"
              ref="searchMaterial"
              track-by="material_id"
              :placeholder="$trans('Select material (type to search)')"
              open-direction="bottom"
              :options="materials"
              :multiple="false"
              :internal-search="false"
              :clear-on-select="false"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="false"
              :hide-selected="true"
              :custom-label="materialLabel"
              @search-change="(value: string) => { term = value }"
              @select="selectMaterial"
            >
              <template #noResult>
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </template>
            </VueMultiselect>
            <b-form-invalid-feedback :state="state('material')">
              {{ errors.material }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </div>

        <div class="panel col-1-3">
          <h6>{{ $trans('Move from') }}</h6>

          <div v-if="selectedFrom">
            <h3>
              <span class="h1 text-danger"><br><IBiBoxArrowUpRight /></span>
              <br><br>{{ selectedFrom.location_name }}
            </h3>
          </div>
          <div
            v-else
            class="dimmed"
          >
            <h3>
              <span class="h1"><br><IBiBoxArrowUpRight /></span>
              <br><br>{{ $trans('Departure location') }}
            </h3>
          </div>

          <BFormGroup
            label-size="sm"
            label-for="move-material-from-location-search"
          >
            <VueMultiselect
              id="move-material-from-location-search"
              track-by="location_id"
              open-direction="bottom"
              placeholder="Select location (type to search)"
              :options="fromLocations"
              :multiple="false"
              :searchable="false"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="false"
              :custom-label="fromLocationLabel"
              @select="selectFrom"
            >
              <template #noResult>
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </template>
            </VueMultiselect>
            <b-form-invalid-feedback :state="state('from_location_id')">
              {{ errors.from_location_id }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </div>

        <div class="panel col-1-3">
          <h6>{{ $trans('Move to') }}</h6>

          <div v-if="selectedTo">
            <h3>
              <span class="h1 text-success"><br><IBiBoxArrowInRight /></span>
              <br><br>{{ selectedTo.name }}
            </h3>
          </div>

          <div
            v-else
            class="dimmed"
          >
            <h3>
              <span class="h1"><br><IBiBoxArrowInRight /></span>
              <br><br>{{ $trans('Arrival location') }}
            </h3>
          </div>

          <BFormGroup label-for="move-material-to-location-search">
            <VueMultiselect
              id="move-material-to-location-search"
              track-by="id"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="toLocations"
              :multiple="false"
              :internal-search="true"
              :clear-on-select="false"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="true"
              :hide-selected="true"
              :custom-label="toLocationLabel"
              @select="selectTo"
            >
              <template #noResult>
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </template>
            </VueMultiselect>
            <b-form-invalid-feedback :state="state('to_location_id')">
              {{ errors.to_location_id }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </div>
      </b-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import { useQueryErrorToast } from '@/features/forms'
import {
  emptyMove,
  parseMove,
  validateMove,
  type MoveFieldErrors,
} from './schemas'
import {
  invalidateStock,
  useLocationsOfMaterial,
  useStockMaterialSearch,
  type StockLocationOfMaterial,
  type StockMaterial,
} from './use-stock-pickers'

type DestinationLocation = Api.InventoryStockLocation.Record

/**
 * Move some of a material from one stock location to another. "Bulk" submits
 * and stays, for moving several materials between the same two locations: the
 * amount and the material are reset, the locations are kept, and picking the
 * next material does not read its locations again (the departure list stays
 * the first material's).
 */
const { toast, queryClient } = useCommon()
const router = useRouter()

const values = ref(emptyMove())
const submitClicked = ref(false)
const isBulk = ref(false)

const selectedMaterial = ref<StockMaterial | null>(null)
const selectedFrom = ref<StockLocationOfMaterial | null>(null)
const selectedTo = ref<DestinationLocation | null>(null)

const amountInput = useTemplateRef<{focus: () => void}>('amount')
const searchMaterial = useTemplateRef<{$el: HTMLElement}>('searchMaterial')

const { term, options: materials } = useStockMaterialSearch()

// The material whose locations the departure list reads. Not the picked
// material itself: in bulk mode it stays on the first one.
const departureOf = ref<number | null>(null)
const { locations: fromLocations } = useLocationsOfMaterial(() => departureOf.value)

// The destination is a bounded list, not a search: every stock location.
const toLocationsQuery = useQuery(() => Api.InventoryStockLocation.list.options({
  query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
}))
useQueryErrorToast(toLocationsQuery.error, $trans('Error fetching locations'))
const toLocations = computed(() => toLocationsQuery.data.value?.results ?? [])

const errors = computed<MoveFieldErrors>(() => submitClicked.value ? validateMove(values.value) : {})

function state(field: keyof MoveFieldErrors) {
  return submitClicked.value ? !errors.value[field] : null
}

const moveMutation = useMutation(Api.InventoryMaterial.extras.moveCreate.mutation())

/** The split button is dead until there is somewhere to move from and to, and while a move is on its way. */
const cannotSubmit = computed(() =>
  !values.value.from_location_id || !values.value.to_location_id || moveMutation.isPending.value)

const materialLabel = (material: StockMaterial) =>
  `${material.material_name}, ${$trans('in stock')}: ${material.total_amount}`
const fromLocationLabel = (location: StockLocationOfMaterial) =>
  `${location.location_name} (${location.total_amount})`
const toLocationLabel = (location: DestinationLocation) => `${location.name}`

async function selectMaterial(option: StockMaterial) {
  selectedMaterial.value = option
  values.value.material = option.material_id
  if (!isBulk.value) {
    departureOf.value = option.material_id
    return
  }
  // The amount input only exists once the material is shown.
  await nextTick()
  amountInput.value?.focus()
}

function selectFrom(option: StockLocationOfMaterial) {
  selectedFrom.value = option
  values.value.from_location_id = option.location_id
}

function selectTo(option: DestinationLocation) {
  selectedTo.value = option
  values.value.to_location_id = option.id
}

async function submit(bulk: boolean) {
  if (moveMutation.isPending.value) return
  submitClicked.value = true
  if (Object.keys(errors.value).length > 0) return

  try {
    await moveMutation.mutateAsync(parseMove(values.value))
  } catch {
    errorToast(toast, $trans('Error moving material'))
    return
  }
  infoToast(toast, $trans('Moved'), $trans('Material moved'))
  await invalidateStock(queryClient)

  if (!bulk) {
    await router.push({name: 'mutation-list'})
    return
  }
  values.value.amount = '0'
  values.value.material = null
  selectedMaterial.value = null
  isBulk.value = true
  submitClicked.value = false
  searchMaterial.value?.$el.focus()
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
header {
  position: relative !important;
}

.col-1-3 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
