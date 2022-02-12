<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New engineer') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit engineer') }}</h2>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Username')"
              label-for="engineer_username"
            >
              <b-form-input
                id="engineer_username"
                size="sm"
                v-model="engineer.username"
                :state="isSubmitClicked ? !$v.engineer.username.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                v-if="engineer.username === ''"
                :state="isSubmitClicked ? $v.engineer.username.required : null">
                {{ $trans('Username is required') }}
              </b-form-invalid-feedback>
              <b-form-invalid-feedback
                v-if="engineer.username !== ''"
                :state="isSubmitClicked ? $v.engineer.username.isUnique : null">
                {{ $trans('Username is already in use') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Password')"
              label-for="engineer_password"
            >
              <b-form-input
                id="engineer_password"
                size="sm"
                type="password"
                v-model="engineer.password1"
                @blur="$v.engineer.password1.$touch()"
                :state="isSubmitClicked && $v.engineer.password1 ? !$v.engineer.password1.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked && $v.engineer.password1 ? !$v.engineer.password1.$error : null">
                {{ $trans('Please enter a password') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Password again')"
              label-for="engineer_password_again"
            >
              <b-form-input
                id="engineer_password_again"
                size="sm"
                type="password"
                v-model="engineer.password2"
                @blur="$v.engineer.password2.$touch()"
                :state="isSubmitClicked ? !$v.engineer.password2.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? $v.engineer.password2.sameAs : null">
                {{ $trans('Passwords do not match') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('First name')"
              label-for="engineer_first_name"
            >
              <b-form-input
                id="engineer_first_name"
                size="sm"
                v-model="engineer.first_name"
                :state="isSubmitClicked ? !$v.engineer.first_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.engineer.first_name.$error : null">
                {{ $trans('Please enter a first name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Last name')"
              label-for="engineer_last_name"
            >
              <b-form-input
                id="engineer_last_name"
                size="sm"
                v-model="engineer.last_name"
                :state="isSubmitClicked ? !$v.engineer.last_name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.engineer.last_name.$error : null">
                {{ $trans('Please enter a last name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email')"
              label-for="engineer_email"
            >
              <b-form-input
                id="engineer_email"
                size="sm"
                v-model="engineer.email"
                :state="isSubmitClicked ? !$v.engineer.email.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !$v.engineer.email.$error : null">
                {{ $trans('Please enter a valid email') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Mobile')"
              label-for="engineer_mobile"
            >
              <b-form-input
                id="engineer_mobile"
                size="sm"
                v-model="engineer.engineer.mobile"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="engineer_address"
            >
              <b-form-input
                id="engineer_address"
                size="sm"
                v-model="engineer.engineer.address"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-for="engineer_postal"
            >
              <b-form-input
                id="engineer_postal"
                size="sm"
                v-model="engineer.engineer.postal"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="engineer_city"
            >
              <b-form-input
                id="engineer_city"
                size="sm"
                v-model="engineer.engineer.city"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="engineer_country_code"
            >
              <b-form-select v-model="engineer.engineer.country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Email tablet')"
              label-for="engineer_email_tablet"
            >
              <b-form-input
                id="engineer_email_tablet"
                size="sm"
                v-model="engineer.engineer.email_tablet"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('License plate')"
              label-for="engineer_license_plate"
            >
              <b-form-input
                id="engineer_license_plate"
                size="sm"
                v-model="engineer.engineer.license_plate"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contract hours  per week')"
              label-for="engineer_contract_hours_week"
            >
              <b-form-input
                id="engineer_contract_hours_week"
                size="sm"
                v-model="engineer.engineer.contract_hours_week"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Passport')"
              label-for="engineer_passport"
            >
              <b-form-input
                id="engineer_passport"
                size="sm"
                v-model="engineer.engineer.passport"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('VCA')"
              label-for="engineer_vca"
            >
              <b-form-input
                id="engineer_vca"
                size="sm"
                v-model="engineer.engineer.vca"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Cost price')"
              label-for="engineer_cost_price"
            >
              <b-form-input
                id="engineer_cost_price"
                size="sm"
                v-model="engineer.engineer.cost_price"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { required, sameAs, email } from 'vuelidate/lib/validators'
import { usernameExists } from '@/models/helpers'
import engineerModel from '@/models/company/UserEngineer'

export default {
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
        }
      }
    }

    if (this.isCreate) {
      validations.engineer.username = {
        required,
        isUnique(value) {
          if (value === '') return true

          return usernameExists(value)
        }
      }

      validations.engineer.password1 = {
        required
      }

      validations.engineer.password2 = {
        required,
        sameAs: sameAs('password1')
      }
    } else {
      validations.engineer.username = {
        required,
        isUnique(value) {
          if (this.orgUsername === this.engineer.username || value === '' || value.length < 3) {
            return true
          }

          return usernameExists(value)
        }
      }

      validations.engineer.password2 = {
        sameAs: sameAs('password1')
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: false,
      countries: [],
      submitClicked: false,
      buttonDisabled: false,
      engineer: engineerModel.getFields(),
      errorMessage: null,
    }
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
    this.$store.dispatch('getCountries').then((countries) => {
      this.countries = countries

      if (!this.isCreate) {
        this.loadData()
      } else {
        this.engineer = engineerModel.getFields()
      }
    })
  },
  methods: {
    preSubmitForm() {
      this.buttonDisabled = true
      this.submitClicked = true
      this.$v.$touch()

      setTimeout(() => {
        this.submitForm()
      }, 1000)
    },
    submitForm() {
      this.submitClicked = true
      this.$v.$reset()
      this.$v.$touch()
      if (this.$v.$invalid) {
        console.log('invalid?', this.$v.$invalid)
        this.buttonDisabled = false
        return
      }

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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          engineerModel.insert(token, this.engineer).then((action) => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Engineer has been created')
            })

            this.isLoading = false
            this.cancelForm()
          }).catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating engineer')
            })

            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        delete this.engineer.date_joined

        if (this.engineer.password1) {
          this.engineer.password = this.engineer.password1
        } else {
          delete this.engineer.password
        }

        engineerModel.update(token, this.pk, this.engineer)
          .then(() => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Updated'),
              message: this.$trans('Engineer has been updated')
            })

            this.isLoading = false
            this.cancelForm()
          })
          .catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error updating engineer')
            })

            this.isLoading = false
          })
      })
    },
    loadData() {
      this.isLoading = true

      engineerModel.detail(this.pk).then((engineer) => {
        this.engineer = engineer
        this.orgUsername = engineer.username
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching engineer', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading engineer')
        })

        this.isLoading = false
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
