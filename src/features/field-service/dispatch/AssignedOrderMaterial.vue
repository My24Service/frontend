<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <h3>{{ $trans("Materials") }}</h3>
      </header>
      <b-modal
        id="delete-assignedorder-material-modal"
        ref="delete-assignedorder-material-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">{{ $trans('Are you sure you want to delete this material?') }}</p>
      </b-modal>

      <div class="panel">
        <b-form>
          <h2 v-if="!editMode">{{ $trans('Register material') }}</h2>
          <h2 v-if="editMode">{{ $trans('Edit material') }}</h2>
          <b-row v-if="!editMode">
            <b-col cols="6" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Search assigned orders')"
                label-for="assignedorder-search"
              >
                <VueMultiselect
                  id="assignedorder-search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="assignedOrders"
                  :multiple="false"
                  :internal-search="false"
                  :clear-on-select="false"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="getAssignedOrdersDebounced"
                  @select="selectAssignedOrder"
                  :custom-label="assignedOrderLabel"
                >
                  <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
                </VueMultiselect>
              </BFormGroup>
            </b-col>
            <b-col cols="6" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Assigned order')"
                label-for="assignedorder-material-order-info"
              >
                <BFormInput
                  v-model="selectedAssignedOrderInfo"
                  id="assignedorder-material-order-info"
                  size="sm"
                  readonly
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="submitClicked ? !errors.assigned_order : null">
                  {{ errors.assigned_order }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="6" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Search location')"
                label-for="assignedorder-material-location-search"
              >
                <VueMultiselect
                  id="assignedorder-material-location-search"
                  track-by="id"
                  open-direction="bottom"
                  :options="locations"
                  :multiple="false"
                  :searchable="false"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  @select="selectLocation"
                  :custom-label="locationLabel"
                >
                  <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
                </VueMultiselect>
              </BFormGroup>
            </b-col>
            <b-col cols="6" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Location')"
                label-for="assignedorder-material-location-name"
              >
                <BFormInput
                  v-model="locationName"
                  id="assignedorder-material-location-name"
                  size="sm"
                  readonly
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="submitClicked ? !errors.location : null">
                  {{ errors.location }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="6" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Search material')"
                label-for="move-material-purchase-order-material-search"
              >
                <VueMultiselect
                  id="move-material-purchase-order-material-search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
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
                  @search-change="getMaterials"
                  @select="selectMaterial"
                  :custom-label="materialLabel"
                >
                  <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
                </VueMultiselect>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Material')"
                label-for="move-material-material-name"
              >
                <BFormInput
                  v-model="materialName"
                  id="move-material-material-name"
                  size="sm"
                  readonly
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="submitClicked ? !errors.material : null">
                  {{ errors.material }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Amount')"
                label-for="assignedorder-material-amount"
              >
                <BFormInput
                  v-model="values.amount"
                  id="assignedorder-material-amount"
                  size="sm"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="submitClicked ? !errors.amount : null">
                  {{ errors.amount }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>

          <div class="mx-auto">
            <footer class="modal-footer">
              <BButton @click="cancelEdit" v-if="editMode" class="btn btn-primary" type="button" variant="primary">
                {{ $trans('Cancel') }}
              </BButton>
              <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
                {{ editMode ? $trans('Update') : $trans('Submit') }}
              </BButton>
            </footer>
          </div>
        </b-form>

        <b-table
          id="assignedorder-material-table"
          small
          :busy='isLoading'
          :fields="fields"
          :items="assignedOrderMaterials"
          responsive="md"
          class="data-table"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
              <strong>{{ $trans('Loading...') }}</strong>
            </div>
          </template>
          <template #cell(icons)="data">
            <div class="h2 float-right">
              <RowAction icon="edit"
                v-bind:method="function() { loadAssignedOrderMaterial(data.item.id) }"
                v-bind:title="$trans('Edit')"
              />
              <RowAction icon="delete"
                v-bind:title="$trans('Delete')"
                v-bind:method="function() { showDeleteModal(data.item.id) }"
              />
            </div>
          </template>
        </b-table>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'

import {
  inventoryInventoryLocationsListOptions,
  inventoryInventoryMaterialsForLocationListOptions,
  mobileAssignedordermaterialCreateMutation,
  mobileAssignedordermaterialDestroyMutation,
  mobileAssignedordermaterialListOptions,
  mobileAssignedordermaterialPartialUpdateMutation,
  mobileAssignedordermaterialRetrieveOptions,
  mobileAssignedorderListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type {
  AssignedOrderMaterial,
  InventoryLocations,
  InventoryMaterials,
  MobileAssignedordermaterialListData,
} from '@/api/types.gen'
import RowAction from '@/components/RowAction.vue'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { invalidateAssignedOrderMaterials } from '../invalidation'
import {
  emptyAssignedOrderMaterial,
  parseAssignedOrderMaterial,
  validateAssignedOrderMaterial,
  type AssignedOrderMaterialFieldErrors,
  type AssignedOrderMaterialFormValues,
} from './assigned-order-material-schemas'

/**
 * Registering material against an assigned order.
 *
 * A form screen rather than a list screen: the table under it is the rows of
 * the order currently picked, which is why it is not mounted on the
 * server-paged table kit — the kit's page chrome puts the title above the
 * panel, and this screen's form belongs between them.
 *
 * **The screen is mounted at no route.** `src/router/mobile.js` imports it and
 * never renders it; the conversion preserved that rather than inventing a URL.
 */
const queryClient = useQueryClient()
const { create: toast } = useToast()

const isLoading = ref(false)
const buttonDisabled = ref(false)
const submitClicked = ref(false)
const editMode = ref(false)

const values = ref<AssignedOrderMaterialFormValues>(emptyAssignedOrderMaterial())
/** The picked location and material's display names; not part of the wire body. */
const locationName = ref<string | null>(null)
const materialName = ref<string | null>(null)
const selectedAssignedOrderInfo = ref<string | null>(null)
const assignedOrderMaterialPk = ref<number | null>(null)

const errors = ref<AssignedOrderMaterialFieldErrors>({})

const fields = [
  {key: 'material_name', label: $trans('Name'), sortable: true, thAttr: {width: '50%'}},
  {key: 'location_name', label: $trans('Location'), sortable: true, thAttr: {width: '30%'}},
  {key: 'amount', label: $trans('Amount'), sortable: true, thAttr: {width: '10%'}},
  {key: 'icons', thAttr: {width: '10%'}},
]

const deleteModal = useTemplateRef<{show: () => void}>('delete-assignedorder-material-modal')

// reads ----------------------------------------------------------------------

/** The stock locations. A bare array, and the picker is not searchable. */
const locationsQuery = useQuery(() => ({...inventoryInventoryLocationsListOptions()}))
const locations = computed<InventoryLocations[]>(() => locationsQuery.data.value ?? [])

/** The assigned-order picker, searched as the box is typed into. */
const assignedOrderSearch = ref('')
const assignedOrdersQuery = useQuery(() => ({
  ...mobileAssignedorderListOptions({query: {page: 1, q: assignedOrderSearch.value}}),
}))
const assignedOrders = computed(() => assignedOrdersQuery.data.value?.results ?? [])

/**
 * The materials in stock at the picked location.
 *
 * `location` and `q` are parameters the viewset reads and openapi/schema.yaml
 * does not declare, so the generated data type says `query?: never` and the
 * request carries them through a cast — see the slice README.
 */
const materialSearch = ref('')

const materialsQuery = useQuery(() => ({
  ...inventoryInventoryMaterialsForLocationListOptions({
    query: {
      location: values.value.location,
      q: materialSearch.value,
    } as unknown as NonNullable<Parameters<typeof inventoryInventoryMaterialsForLocationListOptions>[0]>['query'],
  }),
  // The operation declares no query parameter, so the generated request
  // validator is `query: v.optional(v.never())` and `beforeRequest` awaits it
  // *outside* its try/catch: the two parameters this viewset reads
  // (`request.GET`, my24service `apps/inventory/views.py`) would reject the
  // request before it is built. Undefined wins because the options are spread
  // last. The permanent fix is the backend declaring the parameters.
  requestValidator: undefined,
  enabled: values.value.location !== null,
}))
const materials = computed<InventoryMaterials[]>(() => materialsQuery.data.value ?? [])

/** The rows under the form: the materials of the picked assigned order. */
const rowsQuery = useQuery(() => ({
  ...mobileAssignedordermaterialListOptions({
    query: {
      page: 1,
      ...(values.value.assigned_order === null ? {} : {assigned_order: values.value.assigned_order}),
    } as NonNullable<MobileAssignedordermaterialListData['query']>,
  }),
  enabled: values.value.assigned_order !== null,
}))
const assignedOrderMaterials = computed<AssignedOrderMaterial[]>(() => rowsQuery.data.value?.results ?? [])

// writes ---------------------------------------------------------------------

const createMutation = useMutation({...mobileAssignedordermaterialCreateMutation()})
const updateMutation = useMutation({...mobileAssignedordermaterialPartialUpdateMutation()})
const destroyMutation = useMutation({...mobileAssignedordermaterialDestroyMutation()})

async function reloadRows() {
  await invalidateAssignedOrderMaterials(queryClient)
}

function showDeleteModal(id: number) {
  assignedOrderMaterialPk.value = id
  deleteModal.value?.show()
}

async function doDelete() {
  if (assignedOrderMaterialPk.value === null) return

  try {
    await destroyMutation.mutateAsync({path: {id: assignedOrderMaterialPk.value}})
    infoToast(toast, $trans('Deleted'), $trans('Material has been deleted'))
    await reloadRows()
  } catch (error) {
    console.log('Error deleting material', error)
    errorToast(toast, $trans('Error deleting material'))
  }
}

async function loadAssignedOrderMaterial(pk: number) {
  isLoading.value = true

  try {
    const record = await queryClient.fetchQuery(mobileAssignedordermaterialRetrieveOptions({path: {id: pk}}))

    assignedOrderMaterialPk.value = record.id
    values.value = {
      assigned_order: record.assigned_order,
      location: record.location ?? null,
      material: record.material ?? null,
      material_name: record.material_name ?? null,
      amount: record.amount ?? null,
    }
    locationName.value = record.location_name
    materialName.value = record.material_name ?? null
    selectedAssignedOrderInfo.value = ''

    isLoading.value = false
    editMode.value = true
  } catch (error) {
    console.log('error fetching material', error)
    errorToast(toast, $trans('Error fetching material'))
    isLoading.value = false
  }
}

// picking --------------------------------------------------------------------

function selectAssignedOrder(option: {id: number; order_date: string; user_full_name: string; order_name: string; order_city: string}) {
  values.value.assigned_order = option.id
  selectedAssignedOrderInfo.value = assignedOrderLabel(option)
}

function assignedOrderLabel(assignedOrder: {order_date: string; user_full_name: string; order_name: string; order_city: string}) {
  return `${assignedOrder.order_date}, ${assignedOrder.user_full_name} - ${assignedOrder.order_name}, ${assignedOrder.order_city}`
}

function selectLocation(option: InventoryLocations) {
  values.value.location = option.location_id
  locationName.value = option.location_name
}

function locationLabel(location: InventoryLocations) {
  return `${location.location_name} (${location.total_amount})`
}

function selectMaterial(option: InventoryMaterials) {
  values.value.material = option.material_id
  materialName.value = option.material_name
}

function materialLabel(material: InventoryMaterials) {
  return `${material.material_name}, ${$trans('in stock')}: ${material.total_amount}`
}

function getMaterials(query: string) {
  if (values.value.location === null) return
  materialSearch.value = query ?? ''
}

const getAssignedOrdersDebounced = AwesomeDebouncePromise((query: string) => {
  assignedOrderSearch.value = query ?? ''
}, 500)

// submit ---------------------------------------------------------------------

function resetForm() {
  values.value = emptyAssignedOrderMaterial()
  locationName.value = null
  materialName.value = null
  selectedAssignedOrderInfo.value = null
  editMode.value = false
  errors.value = {}
  submitClicked.value = false
}

function cancelEdit() {
  resetForm()
}

async function submitForm() {
  submitClicked.value = true
  errors.value = validateAssignedOrderMaterial(values.value)
  if (Object.keys(errors.value).length > 0) return

  buttonDisabled.value = true
  isLoading.value = true

  const body = parseAssignedOrderMaterial({
    ...values.value,
    material_name: materialName.value,
  })

  try {
    if (editMode.value && assignedOrderMaterialPk.value !== null) {
      await updateMutation.mutateAsync({path: {id: assignedOrderMaterialPk.value}, body})
      infoToast(toast, $trans('Updated'), $trans('Material has been updated'))
    } else {
      await createMutation.mutateAsync({body})
      infoToast(toast, $trans('Created'), $trans('Material has been created'))
    }

    await reloadRows()
    resetForm()
  } catch (error) {
    console.log('Error saving material', error)
    errorToast(toast, editMode.value ? $trans('Error updating material') : $trans('Error creating material'))
  } finally {
    buttonDisabled.value = false
    isLoading.value = false
  }
}
</script>
