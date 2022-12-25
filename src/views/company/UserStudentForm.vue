<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <!-- register -->
        <div v-if="isRegister && registrationSuccess">
          <h3 class="register">{{ $trans('Registration complete') }}</h3>
          <p>{{ $trans('You will receive an email to activate your account') }}</p>
        </div>
        <div v-if="isRegister && !registrationSuccess">
          <h2 class="register">{{ $trans('Register') }}</h2>
          <b-row>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Email')"
                label-for="studentuser_email"
              >
                <b-form-input
                  id="studentuser_email"
                  size="sm"
                  v-model="studentuser.email"
                  :state="isSubmitClicked ? !v$.studentuser.email.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.email.$error : null">
                  {{ $trans('Please provide a valid email') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('First name')"
                label-for="studentuser_first_name"
              >
                <b-form-input
                  id="studentuser_first_name"
                  size="sm"
                  v-model="studentuser.first_name"
                  :state="isSubmitClicked ? !v$.studentuser.first_name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.first_name.$error : null">
                  {{ $trans('Please provide your first name') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Last name')"
                label-for="studentuser_last_name"
              >
                <b-form-input
                  id="studentuser_last_name"
                  size="sm"
                  v-model="studentuser.last_name"
                  :state="isSubmitClicked ? !v$.studentuser.last_name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.last_name.$error : null">
                  {{ $trans('Please provide your last name') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Mobile')"
                label-for="studentuser_mobile"
                :description="$trans('International notation (e.g. +316... for NL)')"
              >
                <b-form-input
                  id="studentuser_mobile"
                  size="sm"
                  v-model="studentuser.student_user.mobile"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.student_user.mobile.$error : null">
                  {{ $trans('Please provide a valid mobile') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Street')"
                label-for="studentuser_street"
              >
                <b-form-input
                  id="studentuser_street"
                  size="sm"
                  v-model="studentuser.student_user.street"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.student_user.street.$error : null">
                  {{ $trans('Please provide your street') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('House nr./addition')"
                label-for="studentuser_house_number"
              >
                <b-form-input
                  style="width: 60px !important; float:left !important;"
                  id="studentuser_house_number"
                  size="sm"
                  v-model="studentuser.student_user.house_number"
                ></b-form-input>
                <span style="float:left !important;">&nbsp;/&nbsp;</span>
                <b-form-input
                  style="width: 60px !important;"
                  id="studentuser_house_number_addition"
                  size="sm"
                  v-model="studentuser.student_user.house_number_addition"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.student_user.house_number.$error : null">
                  {{ $trans('Please provide your house number') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Postal')"
                label-for="studentuser_postal"
              >
                <b-form-input
                  id="studentuser_postal"
                  size="sm"
                  v-model="studentuser.student_user.postal"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.student_user.postal.$error : null">
                  {{ $trans('Please provide your postal code') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('City')"
                label-for="studentuser_city"
              >
                <b-form-input
                  id="studentuser_city"
                  size="sm"
                  v-model="studentuser.student_user.city"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.student_user.city.$error : null">
                  {{ $trans('Please provide your city') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Country')"
                label-for="studentuser_country_code"
              >
                <b-form-select v-model="studentuser.student_user.country_code" :options="countries" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Tell something about yourself')"
                label-for="studentuser_info"
              >
                <b-form-textarea
                  id="studentuser_info"
                  v-model="studentuser.student_user.info"
                  rows="3"
                ></b-form-textarea>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.student_user.info.$error : null">
                  {{ $trans('Please tell us something about yourself') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>

          <div class="mx-auto">
            <footer class="modal-footer">
              <b-button @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
                {{ $trans('Register') }}</b-button>
            </footer>
          </div>
        </div>

        <!-- normal form -->
        <div v-if="!isRegister">
          <h2 v-if="isCreate">{{ $trans('New student user') }}</h2>
          <h2 v-if="!isCreate">{{ $trans('Edit student user') }}</h2>
          <b-row>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Username')"
                label-for="studentuser_username"
              >
                <b-form-input
                  id="studentuser_username"
                  size="sm"
                  v-model="studentuser.username"
                  :state="isSubmitClicked ? !v$.studentuser.username.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  v-if="studentuser.username === ''"
                  :state="isSubmitClicked ? v$.studentuser.username.required : null">
                  {{ $trans('Username is required') }}
                </b-form-invalid-feedback>
                <b-form-invalid-feedback
                  v-if="studentuser.username !== ''"
                  :state="isSubmitClicked ? !v$.studentuser.username.isUnique.$invalid : null">
                  {{ $trans('Username is already in use') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Email')"
                label-for="studentuser_email"
              >
                <b-form-input
                  id="studentuser_email"
                  size="sm"
                  v-model="studentuser.email"
                  :state="isSubmitClicked ? !v$.studentuser.email.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.email.$error : null">
                  {{ $trans('Please enter a valid email') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Password')"
                label-for="studentuser_password"
              >
                <b-form-input
                  id="studentuser_password"
                  size="sm"
                  type="password"
                  v-model="studentuser.password1"
                  @blur="v$.studentuser.password1.$touch()"
                  :state="isSubmitClicked && v$.studentuser.password1 ? !v$.studentuser.password1.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked && v$.studentuser.password1 ? !v$.studentuser.password1.$error : null">
                  {{ $trans('Please enter a password') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Password again')"
                label-for="studentuser_password_again"
              >
                <b-form-input
                  id="studentuser_password_again"
                  size="sm"
                  type="password"
                  v-model="studentuser.password2"
                  @blur="v$.studentuser.password2.$touch()"
                  :state="isSubmitClicked ? !v$.studentuser.password2.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.password2.sameAs.$invalid : null">
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
                label-for="studentuser_first_name"
              >
                <b-form-input
                  id="studentuser_first_name"
                  size="sm"
                  v-model="studentuser.first_name"
                  :state="isSubmitClicked ? !v$.studentuser.first_name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.first_name.$error : null">
                  {{ $trans('Please enter a first name') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Last name')"
                label-for="studentuser_last_name"
              >
                <b-form-input
                  id="studentuser_last_name"
                  size="sm"
                  v-model="studentuser.last_name"
                  :state="isSubmitClicked ? !v$.studentuser.last_name.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.studentuser.last_name.$error : null">
                  {{ $trans('Please enter a last name') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Mobile')"
                label-for="studentuser_mobile"
              >
                <b-form-input
                  id="studentuser_mobile"
                  size="sm"
                  v-model="studentuser.student_user.mobile"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('IBAN')"
                label-for="studentuser_iban"
              >
                <b-form-input
                  id="studentuser_iban"
                  size="sm"
                  v-model="studentuser.student_user.iban"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Street')"
                label-for="studentuser_street"
              >
                <b-form-input
                  id="studentuser_street"
                  size="sm"
                  v-model="studentuser.student_user.street"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('House nr./addition')"
                label-for="studentuser_house_number"
              >
                <b-form-input
                  style="width: 60px !important; float:left !important;"
                  id="studentuser_house_number"
                  size="sm"
                  v-model="studentuser.student_user.house_number"
                ></b-form-input>
                <span style="float:left !important;">&nbsp;/&nbsp;</span>
                <b-form-input
                  style="width: 60px !important;"
                  id="studentuser_house_number_addition"
                  size="sm"
                  v-model="studentuser.student_user.house_number_addition"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Postal')"
                label-for="studentuser_postal"
              >
                <b-form-input
                  id="studentuser_postal"
                  size="sm"
                  v-model="studentuser.student_user.postal"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="3" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('City')"
                label-for="studentuser_city"
              >
                <b-form-input
                  id="studentuser_city"
                  size="sm"
                  v-model="studentuser.student_user.city"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Country')"
                label-for="studentuser_country_code"
              >
                <b-form-select v-model="studentuser.student_user.country_code" :options="countries" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Gender')"
                label-for="studentuser_gender"
              >
                <b-form-select v-model="studentuser.student_user.gender" :options="genderOptions" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('DoB (yyyy-mm-dd)')"
                label-for="studentuser_dob"
              >
                <b-form-input
                  id="studentuser_dob"
                  size="sm"
                  v-model="studentuser.student_user.dob"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Drivers licence')"
                label-for="studentuser_drivers_licence"
              >
                <b-form-select v-model="studentuser.student_user.drivers_licence" :options="yesNoOptions" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                v-if="studentuser.student_user.drivers_licence === 'Y'"
                label-size="sm"
                v-bind:label="$trans('Type')"
                label-for="studentuser_drivers_licence_type"
              >
                <b-form-input
                  v-if="studentuser.student_user.drivers_licence === 'Y'"
                  id="studentuser_drivers_licence_type"
                  size="sm"
                  v-model="studentuser.student_user.drivers_licence_type"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Box truck')"
                label-for="studentuser_box_truck"
              >
                <b-form-select v-model="studentuser.student_user.box_truck" :options="yesNoOptions" size="sm"></b-form-select>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('BSN')"
                label-for="studentuser_bsn"
              >
                <b-form-input
                  id="studentuser_bsn"
                  size="sm"
                  v-model="studentuser.student_user.bsn"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" role="group">
              <b-form-group
                label-size="sm"
                v-bind:label="$trans('Info')"
                label-for="studentuser_info"
              >
                <b-form-textarea
                  id="studentuser_info"
                  v-model="studentuser.student_user.info"
                  rows="3"
                ></b-form-textarea>
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
        </div>

      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'

import { usernameExists } from '../../models/helpers.js'
import studentUserModel from '../../models/company/UserStudent.js'


export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    mode: {
      type: [String],
      default: 'form'
    },
  },
  validations() {
    let validations = {
      studentuser: {
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
      }
    }

    const isUniqueCreate = (value) => {
      if (value === '') return true

      return usernameExists(value)
    }

    if (this.isRegister) {
      const mobileValid = (value) => {
        return value.match(/^\+\d{11}$/)
      }

      validations.studentuser.email = {
        required,
        email,
      }

      validations.studentuser.student_user = {
        mobile: {
          required,
          mobileValid
        },
        street: {
          required,
        },
        house_number: {
          required,
        },
        postal: {
          required,
        },
        city: {
          required,
        },
        info: {
          required,
        }
      }

    } else {
      if (this.isCreate) {
        validations.studentuser.username = {
          required,
          isUnique: helpers.withAsync(isUniqueCreate)
        }

        validations.studentuser.password1 = {
          required
        }

        validations.studentuser.password2 = {
          required,
          sameAs: sameAs(this.studentuser.password1)
        }
      } else {
        function isUniqueEdit(value) {
          if (this.orgUsername === this.studentuser.username || value === '' || value.length < 3) {
            return true
          }

          return helpers.withAsync(usernameExists(value))
        }

        validations.studentuser.username = {
          required,
          isUnique: helpers.withAsync(isUniqueEdit)
        }

        validations.studentuser.password2 = {
          sameAs: sameAs(this.studentuser.password1)
        }
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
      registrationSuccess: false,
      studentuser: studentUserModel.getFields(),
      yesNoOptions: [
        {value: 'Y', text: this.$trans('Yes')},
        {value: 'N', text: this.$trans('No')},
      ],
      genderOptions: [
        {value: 'M', text: this.$trans('Male')},
        {value: 'F', text: this.$trans('Female')},
        {value: 'O', text: this.$trans('Other')},
      ],
    }
  },
  computed: {
    isRegister() {
      return this.mode === 'register'
    },
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    this.countries = await this.$store.dispatch('getCountries')

    if (!this.isRegister) {
      if (!this.isCreate) {
        await this.loadData()
      } else {
        this.studentuser = studentUserModel.getFields()
      }
      this.isLoading = false
    }
  },
  methods: {
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
      if (this.isRegister) {
        try {
          delete this.studentuser.student_user.dob
          delete this.studentuser.student_user.iban
          delete this.studentuser.password
          this.studentuser.username = this.studentuser.email

          await studentUserModel.register(this.studentuser)
          this.infoToast(this.$trans('Registered'), this.$trans('Registration success'))
          this.registrationSuccess = true
        } catch(error) {
          console.log('Error creating studentuser', error)
          this.errorToast(this.$trans('Error registering'))
          this.buttonDisabled = false
        }

        return
      }

      // normal form

      // remove empty fields
      const empty_fields = ['iban', 'dob']
      for (let i=0; i<empty_fields.length; i++) {
        if (empty_fields[i] in this.studentuser && (
          this.studentuser[empty_fields[i]] === null || this.studentuser[empty_fields[i]] === '')) {
          delete this.studentuser[empty_fields[i]]
        }
        if (empty_fields[i] in this.studentuser.student_user && (
          this.studentuser.student_user[empty_fields[i]] === null || this.studentuser.student_user[empty_fields[i]] === '')) {
          delete this.studentuser.student_user[empty_fields[i]]
        }
      }

      this.isLoading = true

      if (this.isCreate) {
        this.studentuser.password = this.studentuser.password1
        try {
          await studentUserModel.insert(this.studentuser)
          this.infoToast(this.$trans('Created'), this.$trans('studentuser has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating studentuser', error)
          this.errorToast(this.$trans('Error creating studentuser'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        delete this.studentuser.date_joined
        delete this.studentuser.last_login
        delete this.studentuser.student_user.picture
        delete this.studentuser.student_user.uuid

        if (this.studentuser.password1) {
          this.studentuser.password = this.studentuser.password1
        } else {
          delete this.studentuser.password
        }

        await studentUserModel.update(this.pk, this.studentuser)
        this.infoToast(this.$trans('Updated'), this.$trans('studentuser has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating studentuser', error)
        this.errorToast(this.$trans('Error updating studentuser'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.studentuser = await studentUserModel.detail(this.pk)
        this.orgUsername = this.studentuser.username
        this.isLoading = false
      } catch(error) {
        console.log('error fetching studentuser', error)
        this.errorToast(this.$trans('Error loading studentuser'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style scoped>
.register {
  padding-top: 20px;
}
</style>
