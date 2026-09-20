<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New trip') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit trip') }}</h2>

        <b-row>
          <b-col cols="6">
            <h3>{{ $trans('Start') }}</h3>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Date/time from first job?')"
                  label-for="start_datetime_from_first_order"
                >
                  <BFormCheckbox
                    id="start_datetime_from_first_order"
                    v-model="values.start_datetime_from_first_order"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  v-if="!values.start_datetime_from_first_order"
                  label-size="sm"
                  label-class="p-sm-0"
                  v-bind:label="$trans('Start date')"
                  label-for="trip_start_date"
                >
                  <VueDatePicker
                    id="trip_start_date"
                    size="sm"
                    class="p-sm-0"
                    v-model="values.start_date"
                    :placeholder="$trans('Choose a date')"
                    :locale="nl"
                    auto-apply
                    arrow-navigation
                    :formats="{ input: 'dd/MM/yyyy' }"
                  ></VueDatePicker>
                  <b-form-invalid-feedback :state="submitClicked ? !errors.start_date : null">
                    {{ errors.start_date }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  v-if="!values.start_datetime_from_first_order"
                  label-size="sm"
                  label-class="p-sm-0"
                  v-bind:label="$trans('Start time')"
                  label-for="trip_start_time"
                >
                  <BFormInput
                    id="trip_start_time"
                    size="sm"
                    v-model="values.start_time"
                    :placeholder="$trans('Choose a time')"
                    :state="submitClicked ? !errors.start_time : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.start_time : null">
                    {{ errors.start_time }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Location from first job?')"
                  label-for="start_location_from_first_order"
                >
                  <BFormCheckbox
                    id="start_location_from_first_order"
                    v-model="values.start_location_from_first_order"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  v-if="!values.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Location')"
                  label-for="trip_start_name"
                >
                  <BFormInput
                    v-model="values.start_name"
                    id="trip_start_name"
                    size="sm"
                    :state="submitClicked ? !errors.start_name : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.start_name : null">
                    {{ errors.start_name }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="5" role="group">
                <BFormGroup
                  v-if="!values.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="trip_start_city"
                >
                  <BFormInput
                    v-model="values.start_city"
                    id="trip_start_city"
                    size="sm"
                    :state="submitClicked ? !errors.start_city : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.start_city : null">
                    {{ errors.start_city }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="7" role="group">
                <BFormGroup
                  v-if="!values.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="trip_start_address"
                >
                  <BFormInput
                    v-model="values.start_address"
                    id="trip_start_address"
                    size="sm"
                    :state="submitClicked ? !errors.start_address : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.start_address : null">
                    {{ errors.start_address }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  v-if="!values.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Postal')"
                  label-for="trip_start_postal"
                >
                  <BFormInput
                    v-model="values.start_postal"
                    id="trip_start_postal"
                    size="sm"
                    :state="submitClicked ? !errors.start_postal : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.start_postal : null">
                    {{ errors.start_postal }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  v-if="!values.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="start_country_code"
                >
                  <BFormSelect
                    id="start_country_code"
                    v-model="values.start_country_code"
                    :options="countries"
                    size="sm"
                  ></BFormSelect>
                </BFormGroup>
              </b-col>
            </b-row>
          </b-col>

          <b-col cols="6">
            <h3>{{ $trans('End') }}</h3>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Date/time from last job?')"
                  label-for="end_datetime_from_last_order"
                >
                  <BFormCheckbox
                    id="end_datetime_from_last_order"
                    v-model="values.end_datetime_from_last_order"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  v-if="!values.end_datetime_from_last_order"
                  label-size="sm"
                  label-class="p-sm-0"
                  v-bind:label="$trans('End date')"
                  label-for="trip_end_date"
                >
                  <VueDatePicker
                    id="trip_end_date"
                    size="sm"
                    v-model="values.end_date"
                    class="mb-2"
                    :placeholder="$trans('Choose a date')"
                    :locale="nl"
                    auto-apply
                    arrow-navigation
                    :formats="{ input: 'dd/MM/yyyy' }"
                  ></VueDatePicker>
                  <b-form-invalid-feedback :state="submitClicked ? !errors.end_date : null">
                    {{ errors.end_date }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  v-if="!values.end_datetime_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('End time')"
                  label-class="p-sm-0"
                  label-for="trip_end_time"
                >
                  <BFormInput
                    id="end_time"
                    size="sm"
                    v-model="values.end_time"
                    class="mb-2"
                    v-bind:placeholder="$trans('Choose a time')"
                    :state="submitClicked ? !errors.end_time : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.end_time : null">
                    {{ errors.end_time }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Location from last job?')"
                  label-for="end_location_from_last_order"
                >
                  <BFormCheckbox
                    id="end_location_from_last_order"
                    v-model="values.end_location_from_last_order"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  v-if="!values.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Location')"
                  label-for="trip_end_name"
                >
                  <BFormInput
                    v-model="values.end_name"
                    id="trip_end_name"
                    size="sm"
                    :state="submitClicked ? !errors.end_name : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.end_name : null">
                    {{ errors.end_name }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="5" role="group">
                <BFormGroup
                  v-if="!values.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="trip_end_city"
                >
                  <BFormInput
                    v-model="values.end_city"
                    id="trip_end_city"
                    size="sm"
                    :state="submitClicked ? !errors.end_city : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.end_city : null">
                    {{ errors.end_city }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="7" role="group">
                <BFormGroup
                  v-if="!values.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="trip_end_address"
                >
                  <BFormInput
                    v-model="values.end_address"
                    id="trip_end_address"
                    size="sm"
                    :state="submitClicked ? !errors.end_address : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.end_address : null">
                    {{ errors.end_address }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="3" role="group">
                <BFormGroup
                  v-if="!values.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Postal')"
                  label-for="trip_end_postal"
                >
                  <BFormInput
                    v-model="values.end_postal"
                    id="trip_end_postal"
                    size="sm"
                    :state="submitClicked ? !errors.end_postal : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="submitClicked ? !errors.end_postal : null">
                    {{ errors.end_postal }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  v-if="!values.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="end_country_code"
                >
                  <BFormSelect
                    id="end_country_code"
                    v-model="values.end_country_code"
                    :options="countries"
                    size="sm"
                  ></BFormSelect>
                </BFormGroup>
              </b-col>
            </b-row>
          </b-col>
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
            <b-table v-if="values.trip_orders.length > 0" small :fields="tripOrderFields" :items="values.trip_orders" responsive="md">
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
                :options="orderOptions"
                :multiple="false"
                :loading="ordersLoading"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="true"
                :hide-selected="true"
                @search-change="orderSearchTerm = $event"
                @select="selectOrder"
                :custom-label="orderLabel"
              >
                <template #noResult>{{ $trans('Oops! No elements found. Consider changing the search query.') }}</template>
              </VueMultiselect>
            </BFormGroup>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="3">{{ selectedOrder.name }}</b-col>
          <b-col cols="3">{{ selectedOrder.address }}</b-col>
          <b-col cols="3">{{ selectedOrder.city }}</b-col>
          <b-col cols="3">{{ selectedOrder.date }}</b-col>
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
import { nl } from 'date-fns/locale'
import moment from 'moment'
import VueMultiselect from 'vue-multiselect'

import {
  mobileTripCreateMutation,
  mobileTripPartialUpdateMutation,
  mobileTripRetrieveOptions,
  orderOrderAutocompleteListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { OrderAutocomplete, PaginatedOrderAutocompleteList, Trip } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { $trans, interpolate } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { invalidateTripAvailability, invalidateTripList } from '../invalidation'
import {
  conditionsOf,
  emptyTrip,
  parseTripBody,
  tripFromRecord,
  validateTripForm,
  type TripBody,
  type TripFieldErrors,
  type TripFormValues,
  type TripOrderFormRow,
} from './schemas'

/**
 * The trip create/edit form: where a trip starts, where it ends, how many
 * people it needs, and the orders it stages.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s. What is its own is
 * the four conditional blocks, the client-side order staging table, and the
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

const form = useResourceForm<TripFormValues, Trip, TripBody, TripFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => mobileTripRetrieveOptions({path: {id}}),
  create: mobileTripCreateMutation(),
  update: mobileTripPartialUpdateMutation(),
  invalidate: async (queryClient) => {
    await invalidateTripList(queryClient)
    // The availability detail is a second read model of one trip - its
    // description, date and headcount are what a write changes - so an edit
    // refreshes it too. A create has no such page open yet, and its route
    // carries no pk.
    const editedId = Number(props.pk)
    if (!Number.isNaN(editedId)) await invalidateTripAvailability(queryClient, editedId)
  },
  empty: emptyTrip,
  fromRecord: tripFromRecord,
  validate: (values) => validateTripForm(values, conditionsOf(values)),
  parse: (values) => parseTripBody(values, conditionsOf(values)),
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

const selectedOrder = ref<TripOrderFormRow>({})

const tripOrderFields = [
  {key: 'name', label: $trans('Customer')},
  {key: 'address', label: $trans('Address')},
  {key: 'city', label: $trans('City')},
  {key: 'date', label: $trans('Date')},
  {key: 'icons', label: ''},
]

function deleteOrder(index: number) {
  values.value.trip_orders.splice(index, 1)
}

function addOrder() {
  values.value.trip_orders.push(selectedOrder.value)
  selectedOrder.value = {}
}

function selectOrder(option: OrderAutocomplete) {
  selectedOrder.value = {
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

const orderSearchTerm = ref('')
const orderQueryTerm = refDebounced(orderSearchTerm, 500)

/**
 * The orders the picker offers. An empty term asks for nothing: VueMultiselect
 * calls `search-change` with `''` when the menu opens or the field is cleared,
 * and the endpoint would answer that with the tenant's first orders - the guard
 * the legacy screen had.
 */
const ordersQuery = useQuery(() => ({
  ...orderOrderAutocompleteListOptions({query: {q: orderQueryTerm.value}}),
  enabled: orderQueryTerm.value.length > 0,
}))

useQueryErrorToast(ordersQuery.error, $trans('Error fetching orders'))

const ordersLoading = computed(() => ordersQuery.isFetching.value)

/**
 * What came back, as rows.
 *
 * The generated response component for this endpoint is
 * `PaginatedOrderAutocompleteList`, but the action answers with a bare array -
 * `OrderViewset.autocomplete` (my24service `apps/order/views/order.py:379+`)
 * returns `Response(OrderAutocompleteSerializer(qs, many=True).data)`, which is
 * the shape the other autocompletes declare. The envelope is read too, so the
 * picker keeps working the day the schema is corrected.
 */
const orderOptions = computed<OrderAutocomplete[]>(() => {
  const data = ordersQuery.data.value as unknown as
    | OrderAutocomplete[]
    | PaginatedOrderAutocompleteList
    | undefined
  if (!data) return []
  return Array.isArray(data) ? data : data.results ?? []
})
</script>
