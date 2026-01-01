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
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Date/time from first job?')"
                  label-for="start_datetime_from_first_order"
                >
                  <b-form-checkbox
                    id="start_datetime_from_first_order"
                    v-model="trip.start_datetime_from_first_order"
                  >
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
              <b-col cols="4" role="group">
                <b-form-group
                  v-if="!trip.start_datetime_from_first_order"
                  label-size="sm"
                  label-class="p-sm-0"
                  v-bind:label="$trans('Start date')"
                  label-for="trip_start_date"
                >
                  <b-form-datepicker
                    id="trip_start_date"
                    size="sm"
                    class="p-sm-0"
                    v-model="trip.start_date"
                    v-bind:placeholder="$trans('Choose a date')"
                    value="trip.start_date"
                    locale="nl"
                    :state="isSubmitClicked ? !v$.trip.start_date.$error && !trip.start_datetime_from_first_order : null"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                  ></b-form-datepicker>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.start_date.$error : null">
                    {{ $trans('Please enter a start date') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="4" role="group">
                <b-form-group
                  v-if="!trip.start_datetime_from_first_order"
                  label-size="sm"
                  label-class="p-sm-0"
                  v-bind:label="$trans('Start time')"
                  label-for="trip_start_time"
                >
                  <b-form-timepicker
                    id="trip_start_time"
                    size="sm"
                    v-model="trip.start_time"
                    placeholder="Choose a time"
                    :hour12=false
                  ></b-form-timepicker>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Location from first job?')"
                  label-for="start_location_from_first_order"
                >
                  <b-form-checkbox
                    id="start_location_from_first_order"
                    v-model="trip.start_location_from_first_order"
                  >
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
              <b-col cols="3" role="group">
                <b-form-group
                  v-if="!trip.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Location')"
                  label-for="trip_start_name"
                >
                  <b-form-input
                    v-model="trip.start_name"
                    id="trip_start_name"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.start_name.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.start_name.$error : null">
                    {{ $trans('Please enter a location') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="5" role="group">
                <b-form-group
                  v-if="!trip.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="trip_start_city"
                >
                  <b-form-input
                    v-model="trip.start_city"
                    id="trip_start_city"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.start_city.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.start_city.$error : null">
                    {{ $trans('Please enter a city') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="7" role="group">
                <b-form-group
                  v-if="!trip.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="trip_start_address"
                >
                  <b-form-input
                    v-model="trip.start_address"
                    id="trip_start_address"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.start_address.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.start_address.$error : null">
                    {{ $trans('Please enter an address') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="3" role="group">
                <b-form-group
                  v-if="!trip.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Postal')"
                  label-for="trip_start_postal"
                >
                  <b-form-input
                    v-model="trip.start_postal"
                    id="trip_start_postal"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.start_postal.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.start_postal.$error : null">
                    {{ $trans('Please enter a postal') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="2" role="group">
                <b-form-group
                  v-if="!trip.start_location_from_first_order"
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="start_country_code"
                >
                  <b-form-select v-model="trip.start_country_code" :options="countries" size="sm"></b-form-select>
                </b-form-group>
              </b-col>
            </b-row>
          </b-col>

          <b-col cols="6">
            <h3>{{ $trans('End') }}</h3>
            <b-row>
              <b-col cols="4" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Date/time from last job?')"
                  label-for="end_datetime_from_last_order"
                >
                  <b-form-checkbox
                    id="end_datetime_from_last_order"
                    v-model="trip.end_datetime_from_last_order"
                  >
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
              <b-col cols="4" role="group">
                <b-form-group
                  v-if="!trip.end_datetime_from_last_order"
                  label-size="sm"
                  label-class="p-sm-0"
                  v-bind:label="$trans('End date')"
                  label-for="trip_end_date"
                >
                  <b-form-datepicker
                    id="trip_end_date"
                    size="sm"
                    v-model="trip.end_date"
                    class="mb-2"
                    v-bind:placeholder="$trans('Choose a date')"
                    locale="nl"
                    :state="isSubmitClicked ? !v$.trip.end_date.$error : null"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                  ></b-form-datepicker>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.end_date.$error : null">
                    {{ $trans('Please enter an end date') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="4" role="group">
                <b-form-group
                  v-if="!trip.end_datetime_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('End time')"
                  label-class="p-sm-0"
                  label-for="trip_end_time"
                >
                  <b-form-timepicker
                    id="end_time"
                    size="sm"
                    v-model="trip.end_time"
                    class="mb-2"
                    v-bind:placeholder="$trans('Choose a time')"
                    :hour12=false
                  ></b-form-timepicker>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <b-form-group
                  label-size="sm"
                  v-bind:label="$trans('Location from last job?')"
                  label-for="end_location_from_last_order"
                >
                  <b-form-checkbox
                    id="end_location_from_last_order"
                    v-model="trip.end_location_from_last_order"
                  >
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
              <b-col cols="3" role="group">
                <b-form-group
                  v-if="!trip.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Location')"
                  label-for="trip_end_name"
                >
                  <b-form-input
                    v-model="trip.end_name"
                    id="trip_end_name"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.end_name.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.end_name.$error : null">
                    {{ $trans('Please enter a location') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="5" role="group">
                <b-form-group
                  v-if="!trip.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="trip_end_city"
                >
                  <b-form-input
                    v-model="trip.end_city"
                    id="trip_end_city"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.end_city.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.end_city.$error : null">
                    {{ $trans('Please enter a city') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="7" role="group">
                <b-form-group
                  v-if="!trip.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="trip_end_address"
                >
                  <b-form-input
                    v-model="trip.end_address"
                    id="trip_end_address"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.end_address.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.end_address.$error : null">
                    {{ $trans('Please enter an address') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="3" role="group">
                <b-form-group
                  v-if="!trip.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Postal')"
                  label-for="trip_end_postal"
                >
                  <b-form-input
                    v-model="trip.end_postal"
                    id="trip_end_postal"
                    size="sm"
                    :state="isSubmitClicked ? !v$.trip.end_postal.$error : null"
                  ></b-form-input>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.trip.end_postal.$error : null">
                    {{ $trans('Please enter a postal') }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col cols="2" role="group">
                <b-form-group
                  v-if="!trip.end_location_from_last_order"
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="end_country_code"
                >
                  <b-form-select v-model="trip.end_country_code" :options="countries" size="sm"></b-form-select>
                </b-form-group>
              </b-col>
            </b-row>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Required users')"
              label-for="required_users"
            >
              <b-form-input
                id="required_users"
                size="sm"
                v-model="trip.required_users"
                :state="isSubmitClicked ? !v$.trip.required_users.$error: null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.trip.required_users.$error : null">
                {{ $trans('Please enter required users') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="10" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Description')"
              label-for="trip_description"
            >
              <b-form-textarea
                id="trip_description"
                v-model="trip.description"
                rows="2"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

        <h4>{{ $trans('Orders') }}</h4>
        <b-row>
          <b-col cols="12">
            <b-table v-if="trip.trip_orders.length > 0" small :fields="tripOrderFields" :items="trip.trip_orders" responsive="md">
              <template #cell(icons)="data">
                <div class="float-right">
                  <b-link class="h5 mx-2" @click.prevent="deleteOrder(data.index)">
                    <b-icon-trash></b-icon-trash>
                  </b-link>
                </div>
              </template>
            </b-table>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Search orders')"
              label-for="trip-order-search"
            >
              <multiselect
                id="trip-order-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="orders"
                :multiple="false"
                :loading="isLoading"
                :internal-search="false"
                :clear-on-select="true"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="true"
                :hide-selected="true"
                @search-change="getOrdersDebounced"
                @select="selectOrder"
                :custom-label="orderLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="3">{{ selectedOrder.name }}</b-col>
          <b-col cols="3">{{ selectedOrder.address }}</b-col>
          <b-col cols="3">{{ selectedOrder.city }}</b-col>
          <b-col cols="3">{{ selectedOrder.date }}</b-col>
        </b-row>

        <footer class="modal-footer">
          <b-button @click="addOrder" class="btn btn-primary" size="sm" type="button" variant="primary">
            {{ $trans('Add order') }}
          </b-button>
        </footer>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import Multiselect from 'vue-multiselect'

import tripModel from '@/models/mobile/Trip.js'
import orderModel from '@/models/orders/Order.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data () {
    return {
      isLoading: false,
      buttonDisabled: false,
      tripOrderFields: [
        { key: 'name', label: this.$trans('Customer') },
        { key: 'address', label: this.$trans('Address') },
        { key: 'city', label: this.$trans('City') },
        { key: 'date', label: this.$trans('Date') },
        { key: 'icons', label: '' }
      ],
      submitClicked: false,
      trip: tripModel.getFields(),
      errorMessage: null,
      orders: [],
      ordersSearch: '',
      selectedOrder: {},
      countries: [],
    }
  },
  validations() {
    let validations = {
      trip: {
        required_users: {
          required,
        }
      }
    }

    if (!this.trip.start_location_from_first_order) {
      validations.trip.start_name = {
        required,
      }

      validations.trip.start_address = {
        required,
      }

      validations.trip.start_postal = {
        required,
      }

      validations.trip.start_city = {
        required,
      }

      validations.trip.start_country_code = {
        required,
      }
    }

    if (!this.trip.start_datetime_from_first_order) {
      validations.trip.start_date = {
        required,
      }

      validations.trip.start_time = {
        required,
      }
    }

    if (!this.trip.end_location_from_last_order) {
      validations.trip.end_name = {
        required,
      }

      validations.trip.end_address = {
        required,
      }

      validations.trip.end_postal = {
        required,
      }

      validations.trip.end_city = {
        required,
      }

      validations.trip.end_country_code = {
        required,
      }
    }
    if (!this.trip.end_datetime_from_last_order) {
      validations.trip.end_date = {
        required,
      }

      validations.trip.end_time = {
        required,
      }
    }

    return validations
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.getOrdersDebounced = AwesomeDebouncePromise(this.getOrders, 500)
    this.$store.dispatch('getCountries').then((countries) => {
      this.countries = countries
      if (this.isCreate) {
        this.trip = tripModel.getFields()
      } else {
        this.loadData()
      }
    })
  },
  methods: {
    // orders
    deleteOrder(index) {
      this.trip.trip_orders.splice(index, 1)
    },
    addOrder() {
      this.trip.trip_orders.push(this.selectedOrder)
      this.selectedOrder = {}
    },
    selectOrder(option) {
      this.selectedOrder = {
        name: option.orderName,
        address: option.orderAddress,
        postal: option.orderPostal,
        city: option.orderCity,
        country: option.orderCountryCode,
        date: option.orderDate,
        order: option.id
      }
    },
    orderLabel({ order_id, orderDate, orderName, orderCity}) {
      return `${order_id}, ${orderDate} ${orderName} - ${orderCity}`
    },
    async submitForm() {
      this.submitClicked = true;
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['start_time', 'end_time', 'start_date', 'end_date', 'last_status', 'last_status_full'];
      for (let i=0; i<null_fields.length; i++) {
        if (this.trip[null_fields[i]] === null || this.trip[null_fields[i]] === '') {
          delete this.trip[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          const trip = await tripModel.insert(this.trip)
          infoToast(create, this.$trans('Trip created'), this.$trans(`Trip ${trip.id} has been created`))
          this.isLoading = false
          this.buttonDisabled = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating trip', error)
          errorToast(create, this.$trans('Error creating trip'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        await tripModel.update(this.pk, this.trip)
        infoToast(create, this.$trans('Trip updated'), this.$trans('Trip has been updated'))
        this.isLoading = false
        this.buttonDisabled = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating trip', error)
        errorToast(create, this.$trans('Error updating trip'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async getOrders(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.orders = await orderModel.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching orders', error)
        errorToast(create, this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    },
    async loadData() {
      let start_date
      let end_date
      this.isLoading = true

      try {
        this.trip = await tripModel.detail(this.pk)
        if (this.trip.start_date) {
          start_date = this.$moment(this.trip.start_date, 'YYYY-MM-DD')
          this.trip.start_date = start_date.toDate()
        }

        if (this.trip.end_date) {
          end_date = this.$moment(this.trip.end_date, 'YYYY-MM-DD')
          this.trip.end_date = end_date.toDate()
        }

        this.isLoading = false
      } catch(error) {
        console.log('error fetching order', error)
        errorToast(create, this.$trans('Error fetching trip'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
