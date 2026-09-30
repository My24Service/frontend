<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiArrowLeftRight />{{ $trans('Mutations') }}</h3>
        <BButton-toolbar>
          <BButton
            class="btn btn-secondary"
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            :disabled="buttonDisabled"
            class="btn btn-primary"
            type="button"
            variant="primary"
            @click="submitForm"
          >
            {{ $trans('Submit') }}
          </BButton>
        </BButton-toolbar>
      </div>
    </header>
    <div class="page-detail">
      <b-overlay
        :show="createMutation.isPending.value"
        rounded="sm"
      >
        <b-form class="flex-columns">
          <div class="panel col-1-3">
            <h6>{{ $trans('Add mutation') }}</h6>

            <BFormGroup
              label-size="sm"
              label-cols="12"
              label-for="add-mutation-material-search"
            >
              <VueMultiselect
                id="add-mutation-material-search"
                track-by="material_id"
                :placeholder="`${$trans('Select product')} ${$trans('(type to search)')}`"
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
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="12"
              label-for="add-mutation-material-name"
            >
              <h3>{{ values.material_name || '&nbsp;' }}</h3>
              <b-form-invalid-feedback :state="state('material')">
                {{ errors.material }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <div class="flex-columns">
              <BFormGroup
                label-cols="3"
                :label="$trans('Amount')"
                label-for="add-mutation-amount"
              >
                <BFormInput
                  id="add-mutation-amount"
                  ref="amount"
                  v-model="values.amount"
                  type="number"
                  style="width: 6rem"
                />
                <b-form-invalid-feedback :state="state('amount')">
                  {{ errors.amount }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                label-cols="3"
                label-align="right"
                :label="$trans('Type')"
                label-for="add-mutation-mutation_type"
              >
                <BFormSelect
                  v-model="values.mutation_type"
                  :options="mutationTypes"
                />
              </BFormGroup>
            </div>

            <h6>{{ locationHeading }}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="12"
              label-for="add-mutation-location-search"
            >
              <VueMultiselect
                id="add-mutation-location-search"
                track-by="location_id"
                open-direction="bottom"
                :options="locations"
                :multiple="false"
                :searchable="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :custom-label="locationLabel"
                @select="selectLocation"
              >
                <template #noResult>
                  {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                </template>
              </VueMultiselect>
            </BFormGroup>

            <BFormGroup label-for="add-mutation-location-name">
              <BFormInput
                id="add-mutation-location-name"
                v-model="values.location_name"
                readonly
              />
              <b-form-invalid-feedback :state="state('location')">
                {{ errors.location }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import {
  emptyMutation,
  mutationWrite,
  type MutationFieldErrors,
} from './schemas'
import {
  invalidateStock,
  useLocationsOfMaterial,
  useStockMaterialSearch,
  type StockLocationOfMaterial,
  type StockMaterial,
} from './use-stock-pickers'

/**
 * Correct the stock of a material: pick what is in stock, say how much comes
 * in or goes out, and at which of the locations that hold it. Create only -
 * a mutation is a ledger line and is never edited.
 */
const { toast, queryClient } = useCommon()
const router = useRouter()

const values = ref(emptyMutation())
const submitClicked = ref(false)

const amountInput = useTemplateRef<{focus: () => void}>('amount')

const { term, options: materials } = useStockMaterialSearch()
const { locations } = useLocationsOfMaterial(() => values.value.material)

const mutationTypes = [
  {value: 'correction-in', text: $trans('Correction in')},
  {value: 'correction-out', text: $trans('Correction out')},
]

/** A correction in adds to a location, a correction out takes from one. */
const locationHeading = computed(() =>
  values.value.mutation_type === 'correction-in' ? $trans('To location') : $trans('From location'))

// Live once the first submit has shown them, as the form always did: fixing a
// field clears its message without waiting for the next submit.
const errors = computed<MutationFieldErrors>(() =>
  submitClicked.value ? mutationWrite.validate(values.value, {isCreate: true}) : {})

function state(field: keyof MutationFieldErrors) {
  return submitClicked.value ? !errors.value[field] : null
}

const createMutation = useMutation(Api.InventoryStockmutationsimpleList.create.mutation())
const buttonDisabled = computed(() => createMutation.isPending.value)

const materialLabel = (material: StockMaterial) =>
  `${material.material_name}, ${$trans('in stock')}: ${material.total_amount}`

const locationLabel = (location: StockLocationOfMaterial) =>
  `${location.location_name} (${location.total_amount})`

function selectMaterial(option: StockMaterial) {
  values.value.material = option.material_id
  values.value.material_name = option.material_name
  amountInput.value?.focus()
}

function selectLocation(option: StockLocationOfMaterial) {
  values.value.location = option.location_id
  values.value.location_name = option.location_name
}

async function submitForm() {
  if (createMutation.isPending.value) return
  submitClicked.value = true
  if (Object.keys(errors.value).length > 0) return

  try {
    await createMutation.mutateAsync({body: mutationWrite.parseCreate(values.value)})
  } catch {
    errorToast(toast, $trans('Error creating mutation'))
    return
  }
  infoToast(toast, $trans('Created'), $trans('Mutation created'))
  await invalidateStock(queryClient)
  await router.push({name: 'mutation-list'})
}

function cancelForm() {
  router.go(-1)
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
