<template>

    <div class="app-page">
      <header>

        <div class="page-title">
          <h3>
            <b-icon icon="people"></b-icon>
            <span class="backlink" @click="cancelForm">{{ $trans("People") }}</span> /
            <strong>{{ employee.username }}</strong>
            <span class="dimmed" v-if="isCreate && !employee.username">{{ $trans('new') }}</span>
            <span class="dimmed" v-if="!isCreate && !employee.username">{{ $trans('edit') }}</span>
          </h3>


          <BButton-toolbar>
            <BButton @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</BButton>
              <BButton @click="preSubmitForm" :disabled="buttonDisabled" type="button" variant="primary">
                {{ $trans('Submit') }}</BButton>
              </BButton-toolbar>
            </div>
          </header>

          <b-form class="page-detail flex-columns">
            <div class="panel col-1-3">
              <h6>{{ $trans('user info') }}</h6>
              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Username')"
                label-for="employee_username"
              >
                <BFormInput
                  id="employee_username"
                  size="sm"
                  v-model="employee.username"
                  :state="isSubmitClicked ? !v$.employee.username.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  v-if="employee.username === ''"
                  :state="isSubmitClicked ? v$.employee.username.required : null">
                  {{ $trans('Username is required') }}
                </b-form-invalid-feedback>
                <b-form-invalid-feedback
                  v-if="employee.username !== '' && employee.username !== orgUsername"
                  :state="isSubmitClicked ? !v$.employee.username.isUnique.$invalid : null">
                  {{ $trans('Username is already in use') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Password')"
                label-for="employee_password"
              >
                <BFormInput
                  id="employee_password"
                  size="sm"
                  type="password"
                  v-model="employee.password1"
                  @blur="v$.employee.password1.$touch()"
                  :state="isSubmitClicked && v$.employee.password1 ? !v$.employee.password1.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked && v$.employee.password1 ? !v$.employee.password1.$error : null">
                  {{ $trans('Please enter a password') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Password again')"
                label-for="employee_password_again"
              >
                <BFormInput
                  id="employee_password_again"
                  size="sm"
                  type="password"
                  v-model="employee.password2"
                  @blur="v$.employee.password2.$touch()"
                  :state="isSubmitClicked ? !v$.employee.password2.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  v-if="employee.password2 !== '' && employee.password2"
                  :state="isSubmitClicked ? !v$.employee.password2.sameAs.$invalid : null">
                  {{ $trans('Passwords do not match') }}
                </b-form-invalid-feedback>
              </BFormGroup>
        </div>
        <div class="panel col-1-3">

          <h6>{{ $trans('personal details') }}</h6>
              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('First name')"
                label-for="employee_first_name"
              >
                <BFormInput
                  id="employee_first_name"
                  size="sm"
                  v-model="employee.first_name"
                  :state="isSubmitClicked ? !v$.employee.first_name.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.employee.first_name.$error : null">
                  {{ $trans('Please enter a first name') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Last name')"
                label-for="employee_last_name"
              >
                <BFormInput
                  id="employee_last_name"
                  size="sm"
                  v-model="employee.last_name"
                  :state="isSubmitClicked ? !v$.employee.last_name.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.employee.last_name.$error : null">
                  {{ $trans('Please enter a last name') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Email')"
                label-for="employee_email"
              >
                <BFormInput
                  id="employee_email"
                  size="sm"
                  v-model="employee.email"
                  :state="isSubmitClicked ? !v$.employee.email.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.employee.email.$error : null">
                  {{ $trans('Please enter a valid email') }}
                </b-form-invalid-feedback>
              </BFormGroup>


        </div>
        <div class="panel col-1-3">
          <h6>{{ $trans('contract') }} &amp; {{  $trans('misc.') }}</h6>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Contract hours per week')"
            label-for="employee_contract_hours_week"
          >
            <BFormInput
              id="employee_contract_hours_week"
              size="sm"
              v-model="employee.employee_user.contract_hours_week"
            ></BFormInput>
          </BFormGroup>

          <BFormGroup
            v-if="hasBranches"
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Branch')"
            label-for="employee_branch"
          >
            <b-form-select
              id="employee_branch"
              v-model="employee.employee_user.branch"
              :options="branches"
              size="sm"
            ></b-form-select>
          </BFormGroup>


        </div>
      </b-form>
    </div>

</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'

import { usernameExists } from '@/models/helpers'
import employeeModel from '../../models/company/UserEmployee.js'
import branchModel from '../../models/company/Branch.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    let validations = {
      employee: {
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
        password1: {},
        password2: {},
      }
    }

    if (this.isCreate) {
      const isUniqueCreate = (value) => {
        if (value === '') return true

        return usernameExists(value)
      }

      validations.employee.username = {
        required,
        isUnique: helpers.withAsync(isUniqueCreate)
      }

      validations.employee.password1 = {
        required
      }

      validations.employee.password2 = {
        required,
        sameAs: sameAs(this.employee.password1)
      }
    } else {
      const isUniqueEdit = (value) => {
        if (this.orgUsername === value || value === '' || value.length < 3) {
          return true
        }

        return helpers.withAsync(usernameExists(value))
      }

      validations.employee.username = {
        required,
        isUnique: isUniqueEdit
      }

      validations.employee.password1 = {
      }

      validations.employee.password2 = {
        sameAs: sameAs(this.employee.password1)
      }
    }

    return validations
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      buttonDisabled: false,
      employee: employeeModel.getFields(),
      orgUsername: null,
      branches: [],
      branch_info: '',
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    hasBranches() {
      return this.$store.getters.getMemberHasBranches
    },
  },
  async created() {
    const response = await branchModel.list()

    this.branches = [{
      value: null,
      text: '-'
    }]

    for(let i=0;i<response.results.length; i++) {
      const txt = `${response.results[i].name} - ${response.results[i].city}`

      this.branches.push({
        value: response.results[i].id,
        text: txt,
      })
    }

    if (!this.isCreate) {
      await this.loadData()
    } else {
      this.employee = employeeModel.getFields()
    }
    this.isLoading = false
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
      this.isLoading = true

      if (this.isCreate) {
        this.employee.password = this.employee.password1
        try {
          await employeeModel.insert(this.employee)
          infoToast(create, $trans('Created'), $trans('employee has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating employee', error)
          errorToast(create, $trans('Error creating employee'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        return
      }

      try {
        delete this.employee.date_joined
        delete this.employee.last_login

        if (this.employee.password1) {
          this.employee.password = this.employee.password1
        } else {
          delete this.employee.password
        }

        await employeeModel.update(this.pk, this.employee)
        infoToast(create, $trans('Updated'), $trans('employee has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating employee', error)
        errorToast(create, $trans('Error updating employee'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.employee = await employeeModel.detail(this.pk)
        this.orgUsername = this.employee.username
        this.isLoading = false
      } catch(error) {
        console.log('error fetching employee', error)
        errorToast(create, $trans('Error loading employee'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
