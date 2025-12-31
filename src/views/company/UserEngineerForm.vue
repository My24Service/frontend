<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class='page-title'>
          <h3>
          <b-icon icon="people"></b-icon>
          <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
          {{  engineer.username }}
          <span class="dimmed" v-if="isCreate && !engineer.username">{{ $trans('new') }}</span>
          <span class="dimmed" v-if="!isCreate && !engineer.username">{{ $trans('edit') }}</span>
          </h3>
          <div class='flex-columns'>
            <b-button @click="cancelForm" type="button" variant="secondary" class="outline">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </div>
        </div>
      </header>

      <div class='page-detail'>
        <div class='flex-columns'>
          <div class='panel'>
            <h6>{{ $trans("User info") }}</h6>
            <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Username')"
                label-for="engineer_username">
                <b-form-input
                  id="engineer_username"
                  size="sm"
                  v-model="engineer.username"
                  :state="isSubmitClicked ? !v$.engineer.username.$error : null"></b-form-input>
                <b-form-invalid-feedback
                  v-if="engineer.username === ''"
                  :state="isSubmitClicked ? v$.engineer.username.required : null">
                  {{ $trans('Username is required') }}
                </b-form-invalid-feedback>
                <b-form-invalid-feedback
                  v-if="engineer.username !== '' && engineer.username !== orgUsername"
                  :state="isSubmitClicked ? v$.engineer.username.isUnique.$invalid : null">
                  {{ $trans('Username is already in use') }}
                </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Password')"
              label-for="engineer_password">
              <b-form-input
                id="engineer_password"
                size="sm"
                type="password"
                v-model="engineer.password1"
                @blur="v$.engineer.password1.$touch()"
                :state="isSubmitClicked && v$.engineer.password1 ? !v$.engineer.password1.$error : null"></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked && v$.engineer.password1 ? !v$.engineer.password1.$error : null">
                {{ $trans('Please enter a password') }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Password again')"
              label-for="engineer_password_again">
              <b-form-input
                id="engineer_password_again"
                size="sm"
                type="password"
                v-model="engineer.password2"
                @blur="v$.engineer.password2.$touch()"
                :state="isSubmitClicked ? !v$.engineer.password2.$error : null"></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked && v$.engineer.password2 ? !v$.engineer.password2.$error : null">
                {{ $trans('Please enter a password') }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                v-if="engineer.password2 !== '' && engineer.password2"
                :state="isSubmitClicked ? v$.engineer.password2.sameAs.$invalid : null">
                {{ $trans('Passwords do not match') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </div>

          <div class='panel'>
            <h6>{{ $trans("Personal details") }}</h6>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('First name')"
              label-for="engineer_first_name">
              <b-form-input
                id="engineer_first_name"
                size="sm"
                v-model="engineer.first_name"
                :state="isSubmitClicked ? !v$.engineer.first_name.$error : null"></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.engineer.first_name.$error : null">
                {{ $trans('Please enter a first name') }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Last name')"
              label-for="engineer_last_name">
              <b-form-input
                id="engineer_last_name"
                size="sm"
                v-model="engineer.last_name"
                :state="isSubmitClicked ? !v$.engineer.last_name.$error : null"></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.engineer.last_name.$error : null">
                {{ $trans('Please enter a last name') }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Email')"
              label-for="engineer_email">
              <b-form-input
                id="engineer_email"
                size="sm"
                v-model="engineer.email"
                :state="isSubmitClicked ? !v$.engineer.email.$error : null"></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.engineer.email.$error : null">
                {{ $trans('Please enter a valid email') }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Mobile phone')"
              label-for="engineer_mobile">
              <b-form-input
                id="engineer_mobile"
                size="sm"
                v-model="engineer.engineer.mobile"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Address')"
              label-for="engineer_address"
            >
              <b-form-input
                id="engineer_address"
                size="sm"
                v-model="engineer.engineer.address"></b-form-input>
            </b-form-group>
            <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Postal')"
                label-for="engineer_postal">
              <b-form-input
                id="engineer_postal"
                size="sm"
                v-model="engineer.engineer.postal"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('City')"
              label-for="engineer_city">
              <b-form-input
                id="engineer_city"
                size="sm"
                v-model="engineer.engineer.city"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Country')"
              label-for="engineer_country_code">
              <b-form-select
                v-model="engineer.engineer.country_code"
                :options="countries" size="sm"></b-form-select>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Passport')"
              label-for="engineer_passport">
              <b-form-input
                id="engineer_passport"
                size="sm"
                v-model="engineer.engineer.passport"></b-form-input>
            </b-form-group>
          </div>

          <div class='panel'>
            <h6>{{ $trans("Work info") }}</h6>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Email tablet')"
              label-for="engineer_email_tablet">
              <b-form-input
                id="engineer_email_tablet"
                size="sm"
                v-model="engineer.engineer.email_tablet"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('License plate')"
              label-for="engineer_license_plate">
              <b-form-input
                id="engineer_license_plate"
                size="sm"
                v-model="engineer.engineer.license_plate"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Contract hours per week')"
              label-for="engineer_contract_hours_week">
              <b-form-input
                id="engineer_contract_hours_week"
                size="sm"
                v-model="engineer.engineer.contract_hours_week"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('VCA')"
              label-for="engineer_vca">
              <b-form-input
                id="engineer_vca"
                size="sm"
                v-model="engineer.engineer.vca"></b-form-input>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Cost price')"
              label-for="engineer_cost_price">
              <b-form-input
                id="engineer_cost_price"
                size="sm"
                v-model="engineer.engineer.cost_price"></b-form-input>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Hourly rate')"
              label-for="engineer_hourly_rate"
            >
              <PriceInput
                v-model="engineer.engineer.hourly_rate"
                :currency="engineer.engineer.hourly_rate_currency"
                @priceChanged="(val) => engineer.engineer.setHourlyRate(val)"
              />
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Preferred location')"
              label-for="engineer_preferred_location">
              <b-form-select
                id="engineer_preferred_location"
                v-model="engineer.engineer.preferred_location"
                :options="locations"
                size="sm"
                value-field="id"
                text-field="name"></b-form-select>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.engineer.engineer.preferred_location.$error : null">
                {{ $trans('Please select a preferred location') }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Or create new location')"
              label-for="engineer_preferred_location_new">
              <div>
                <b-form-input
                  style="width: 140px !important; float:left !important;"
                  id="engineer_preferred_location_new"
                  size="sm"
                  v-model="newLocationName"></b-form-input>
                <span style="float:left !important;">&nbsp;</span>
                <b-button
                  style="width: 60px !important;"
                  @click="createLocation"
                  :disabled="buttonCreateLocationDisabled"
                  type="button"
                  size="sm"
                  variant="primary">
                  {{ $trans('Create') }}</b-button>
              </div>
            </b-form-group>
            <b-form-group
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Hide from dispatch?')"
              label-for="engineer_hide_from_dispatch">
              <div>
                <b-form-checkbox
                  id="planning_user_uses_time_registration"
                  size="sm"
                  v-model="engineer.engineer.hide_from_dispatch"
                >
                </b-form-checkbox>
              </div>
            </b-form-group>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'

import { usernameExists } from '@/models/helpers'
import engineerModel, {EngineerUserModel} from '../../models/company/UserEngineer.js'
import stockLocationModel from '../../models/inventory/StockLocation.js'
import PriceInput from "../../components/PriceInput";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    PriceInput,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    let validations = {
      engineer: {
        username: {
          required
        },
        first_name: {
          required
        },
        last_name: {
          required,
        },
        email: {
          required,
          email
        },
        engineer: {
          preferred_location: {
            required,
          }
        }
      }
    }

    if (this.isCreate) {
      const isUniqueCreate = (value) => {
        if (value === '') return true

        return usernameExists(value)
      }

      validations.engineer.username = {
        required,
        isUnique: helpers.withAsync(isUniqueCreate)
      }

      validations.engineer.password1 = {
        required
      }

      validations.engineer.password2 = {
        required,
        sameAs: sameAs(this.engineer.password1)
      }
    } else {
      const isUniqueEdit = (value) => {
        if (this.orgUsername === value || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.engineer.username = {
        required,
        isUnique: isUniqueEdit
      }

      validations.engineer.password1 = {
      }

      validations.engineer.password2 = {
        sameAs: sameAs(this.engineer.password1)
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: true,
      countries: [],
      submitClicked: false,
      buttonDisabled: false,
      engineer: engineerModel.getFields(),
      errorMessage: null,
      orgUsername: null,
      locations: [],
      newLocationName: null
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    buttonCreateLocationDisabled() {
      return this.newLocationName === null || this.newLocationName === ''
    }
  },
  async created() {
    this.isLoading = true
    this.countries = await this.$store.dispatch('getCountries')

    await this.getLocations()

    if (!this.isCreate) {
      await this.loadData()
    } else {
      const engineerData = engineerModel.getFields()
      this.engineer = new EngineerUserModel(engineerData)

    }
    this.isLoading = false
  },
  methods: {
    async getLocations() {
      this.isLoading = true
      try {
        const response = await stockLocationModel.list()
        this.locations = response.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching locations', error)
        errorToast(create, this.$trans('Error fetching locations'))
        this.isLoading = false
      }
    },
    async createLocation() {
      this.isLoading = true
      try {
        let stockLocation = stockLocationModel.getFields()
        stockLocation.name = this.newLocationName
        const newLocation = await stockLocationModel.insert(stockLocation)
        await this.getLocations()
        this.engineer.engineer.preferred_location = newLocation.id
        this.newLocationName = ""
        this.isLoading = false
      } catch(error) {
        console.log('error creating new location', error)
        errorToast(create, this.$trans('Error creating new location'))
        this.isLoading = false
      }
    },
    preSubmitForm() {
      this.buttonDisabled = true
      this.submitClicked = true
      this.v$.$reset()
      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        this.buttonDisabled = false
        return
      }

      setTimeout(() => {
        this.submitForm()
      }, 1000)
    },
    async submitForm() {
      // remove empty fields
      delete this.engineer.last_login
      const empty_fields = ['inspection_date_car', 'inspection_date_tools']
      for (let i=0; i<empty_fields.length; i++) {
        if (empty_fields[i] in this.engineer && (
          this.engineer[empty_fields[i]] === null || this.studentuser[empty_fields[i]] === '')) {
          delete this.engineer[empty_fields[i]]
        }
        if (empty_fields[i] in this.engineer.engineer && (
          this.engineer.engineer[empty_fields[i]] === null || this.engineer.engineer[empty_fields[i]] === '')) {
          delete this.engineer.engineer[empty_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        this.engineer.password = this.engineer.password1
        try {
          await engineerModel.insert(this.engineer)
          infoToast(create, `${this.$trans('Created')} ${this.engineer.username}`, `${this.$trans('Engineer has been added')}: ${this.engineer.first_name} ${this.engineer.last_name}`)
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating engineer', error)
          errorToast(create, `${this.$trans('Error creating engineer')} ${error}`);
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        delete this.engineer.date_joined

        if (this.engineer.password1) {
          this.engineer.password = this.engineer.password1
        } else {
          delete this.engineer.password
        }

        await engineerModel.update(this.pk, this.engineer)
        infoToast(create, `${this.$trans('Updated')} ${this.engineer.username}`, `${this.engineer.first_name} ${this.engineer.last_name}'s ${this.$trans('details updated')}`)
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating engineer', error)
        errorToast(create, `${this.$trans('Error updating engineer details: ')} ${error}`)
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const engineerData = await engineerModel.detail(this.pk)
        this.engineer = new EngineerUserModel(engineerData)
        this.orgUsername = this.engineer.username
        this.isLoading = false
      } catch(error) {
        console.log('error fetching engineer', error)
        errorToast(create, this.$trans('Error loading engineer'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
