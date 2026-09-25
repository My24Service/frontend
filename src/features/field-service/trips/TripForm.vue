<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New trip') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit trip') }}</h2>

        <b-row>
          <TripEndpoint kind="start" v-model="values" :errors="errors" :submit-clicked="submitClicked" :countries="countries" />
          <TripEndpoint kind="end" v-model="values" :errors="errors" :submit-clicked="submitClicked" :countries="countries" />
        </b-row>

        <b-row>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Required users')"
              label-for="required_users"
            >
              <BFormInput
                id="required_users"
                size="sm"
                v-model="values.required_users"
                :state="submitClicked ? !errors.required_users : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="submitClicked ? !errors.required_users : null">
                {{ errors.required_users }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="10" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Description')"
              label-for="trip_description"
            >
              <BFormTextarea
                id="trip_description"
                v-model="values.description"
                rows="2"
              ></BFormTextarea>
            </BFormGroup>
          </b-col>
        </b-row>

        <h4>{{ $trans('Orders') }}</h4>
        <b-row>
          <b-col cols="12">
            <b-table v-if="stagedOrders.rows.value.length > 0" small :fields="tripOrderFields" :items="stagedOrders.rows.value" responsive="md">
              <template #cell(icons)="data">
                <div class="float-right">
                  <BLink class="h5 mx-2" @click.prevent="deleteOrder(data.index)">
                    <IBiTrash></IBiTrash>
                  </BLink>
                </div>
              </template>
            </b-table>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Search orders')"
              label-for="trip-order-search"
            >
              <VueMultiselect
                id="trip-order-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="orderSearch.options.value"
                :multiple="false"
                :loading="orderSearch.loading.value"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="true"
                :hide-selected="true"
                @search-change="orderSearch.term.value = $event"
                @select="selectOrder"
                :custom-label="orderLabel"
              >
                <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
              </VueMultiselect>
            </BFormGroup>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="3">{{ stagedOrders.rowEdit.value.name }}</b-col>
          <b-col cols="3">{{ stagedOrders.rowEdit.value.address }}</b-col>
          <b-col cols="3">{{ stagedOrders.rowEdit.value.city }}</b-col>
          <b-col cols="3">{{ stagedOrders.rowEdit.value.date }}</b-col>
        </b-row>

        <footer class="modal-footer">
          <BButton @click="addOrder" class="btn btn-primary" size="sm" type="button" variant="primary">
            {{ $trans('Add order') }}
          </BButton>
        </footer>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="form.cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="form.submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import moment from 'moment'
import VueMultiselect from 'vue-multiselect'

import { orderOrderAutocompleteListOptions } from '@/api/@tanstack/vue-query.gen'
import type { OrderAutocomplete, Trip } from '@/api/types.gen'
import { MobileTrip } from '@/api/resources.gen'
import {
  useResourceForm,
  useSearch,
} from '@/features/forms'
import { useStagedRows } from '@/features/order'
import {
  conditionsOf,
  emptyTrip,
  emptyTripOrderRow,
  parseTripBody,
  tripFromRecord,
  tripOrderRowsFromRecord,
  validateTripForm,
  type TripFormValues,
  type TripOrderFormRow,
} from './schemas'
import TripEndpoint from './TripEndpoint.vue'

/**
 * The trip create/edit form: where a trip starts, where it ends, how many
 * people it needs, and the orders it stages.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s. What is its own is
 * the two `<TripEndpoint>` ends, the client-side order staging table, and the
 * order type-ahead.
 *
 * Two things the legacy template carried are deliberately not preserved, both
 * recorded in the Slice's report: the two `<b-form-timepicker>` elements this
 * bootstrap-vue-next (0.42) does not have - so neither time could ever be
 * filled, and a trip whose start is not taken from the first job could not be
 * saved at all - and the two country selects, which had a `label-for` and no
 * `id` for it to point at.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const mainStore = useMainStore()

// The legacy read the countries once, in `created()`, and the store's list is
// static for a session; a computed keeps that read where the template binds it.
const countries = computed(() => mainStore.getCountries)

// The legacy set moment's locale from the member's language before parsing the
// record's dates; parsing an isoDate is locale-independent, but the locale is
// what every other moment user in the app expects to find set.
moment.locale(String(mainStore.getCurrentLanguage))

/** The id the create wrote, for the toast `useResourceForm` raises after `onSaved`. */
const createdTripId = ref<number | null>(null)

// Order staging state, declared before the form: `validate` and `parse` close
// over it, sending what is staged rather than a copy kept in the values.
//
// `useStagedRows` replays rows that carry an `id`; trip rows ride the trip
// body instead and have none, so the slot satisfies the constraint
// structurally without growing one.
const stagedOrders = useStagedRows<TripOrderFormRow & { id?: number }>(emptyTripOrderRow)

/** The staged rows as the body carries them. */
function withStagedOrders(values: TripFormValues): TripFormValues {
  return {...values, trip_orders: stagedOrders.rows.value.map((row) => ({...row}))}
}

const form = useResourceForm({
  pk: () => props.pk,
  // The availability detail is a second read model of one trip - its
  // description, date and headcount are what a write changes - and it sits
  // under the trip's path, so the resource's own reads refresh it too.
  resource: MobileTrip,
  empty: emptyTrip,
  fromRecord: tripFromRecord,
  validate: (values) => validateTripForm(withStagedOrders(values), conditionsOf(values)),
  parse: (values) => parseTripBody(withStagedOrders(values), conditionsOf(values)),
  onSaved: async (result) => {
    createdTripId.value = (result as Trip | undefined)?.id ?? null
  },
  copy: {
    fetchError: $trans('Error fetching trip'),
    created: $trans('Trip created'),
    // Read when the toast is raised - after `onSaved` - so it can name the trip
    // that was just created, which is the copy the legacy screen used.
    get createdDetail() {
      return createdTripId.value === null
        ? $trans('Trip has been created')
        : interpolate($trans('Trip %(id)s has been created'), {id: createdTripId.value})
    },
    updated: $trans('Trip updated'),
    updatedDetail: $trans('Trip has been updated'),
    createError: $trans('Error creating trip'),
    updateError: $trans('Error updating trip'),
  },
})

const {values, errors, submitClicked, isCreate, isLoading, buttonDisabled} = form

// Order staging ------------------------------------------------------------

// A load replaces the staged set with the record's rows; a create starts empty.
watch(
  () => form.record.value,
  (record) => stagedOrders.seed(record ? tripOrderRowsFromRecord(record) : []),
  {immediate: true},
)

const tripOrderFields = [
  {key: 'name', label: $trans('Customer')},
  {key: 'address', label: $trans('Address')},
  {key: 'city', label: $trans('City')},
  {key: 'date', label: $trans('Date')},
  {key: 'icons', label: ''},
]

function deleteOrder(index: number) {
  stagedOrders.remove(index)
}

/**
 * Stage the pick. Pressing "Add order" with nothing picked is a no-op - the
 * empty slot is never pushed - as is adding an order that is already staged,
 * the no-op dedup `SearchAndAssign.selectOrder` uses.
 */
function addOrder() {
  const row = stagedOrders.rowEdit.value
  if (row.order == null) return
  if (stagedOrders.rows.value.some((staged) => staged.order === row.order)) return
  stagedOrders.add()
}

/** Pick an order into the staging slot; one already staged stays as it is. */
function selectOrder(option: OrderAutocomplete) {
  if (stagedOrders.rows.value.some((staged) => staged.order === option.id)) return
  stagedOrders.rowEdit.value = {
    name: option.orderName,
    address: option.orderAddress,
    city: option.orderCity,
    date: option.orderDate,
    order: option.id,
  }
}

function orderLabel({order_id, orderDate, orderName, orderCity}: OrderAutocomplete) {
  return order_id + ', ' + orderDate + ' ' + orderName + ' - ' + orderCity
}

// The order type-ahead -----------------------------------------------------

/**
 * The order picker read: the shared `useSearch` over this screen's
 * autocomplete. What comes back is the options; a failure toasts.
 *
 * An empty term asks for nothing: VueMultiselect calls `search-change` with
 * `''` when the menu opens or the field is cleared, and the endpoint would
 * answer that with the tenant's first orders - the guard the legacy screen had.
 *
 * What came back, as rows: the endpoint declares the bare array it answers
 * (`OrderViewset.autocomplete`), so there is no envelope to unwrap.
 */
const orderSearch = useSearch(
  (q) => orderOrderAutocompleteListOptions({query: {q}}),
  () => true,
  $trans('Error fetching orders'),
  (rows) => rows,
)
</script>
