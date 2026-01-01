<template>
  <div class="app-page">
    <header>
        <div class='page-title'>
          <h3>
            <b-icon icon="shop"></b-icon>
            {{ $trans("Branches") }} / <strong>{{branch.name}}</strong>
            <span class="dimmed" v-if="!branch.name">{{ $trans("branch name") }}</span>
          </h3>

          <BButton-toolbar>
            <BButton @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</BButton>
              <BButton @click="submitForm" type="button" variant="primary">
                {{ $trans('Submit') }}</BButton>
              </BButton-toolbar>
            </div>
          </header>
          <b-form class="page-detail panel">
            <b-overlay :show="isLoading" rounded="sm">
              <b-row>
            <b-col cols="3" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Name')"
                label-for="branch_name"
              >
                <BFormInput
                  autofocus
                  id="branch_name"
                  size="sm"
                  v-model="branch.name"
                  :state="isSubmitClicked ? !v$.branch.name.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.branch.name.$error : null">
                  {{ $trans('Please enter a name') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="3" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Address')"
                label-for="branch_address"
              >
                <BFormInput
                  id="branch_address"
                  size="sm"
                  v-model="branch.address"
                  :state="isSubmitClicked ? !v$.branch.address.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.branch.address.$error : null">
                  {{ $trans('Please enter an address') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Postal')"
                label-for="branch_postal"
              >
                <BFormInput
                  id="branch_postal"
                  size="sm"
                  v-model="branch.postal"
                  :state="isSubmitClicked ? !v$.branch.postal.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.branch.postal.$error : null">
                  {{ $trans('Please enter a postal') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('City')"
                label-for="branch_city"
              >
                <BFormInput
                  id="branch_city"
                  size="sm"
                  v-model="branch.city"
                  :state="isSubmitClicked ? !v$.branch.city.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.branch.city.$error : null">
                  {{ $trans('Please enter a city') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Country')"
                label-for="branch_country"
              >
                <b-form-select v-model="branch.country_code" :options="countries" size="sm"></b-form-select>
              </BFormGroup>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Email')"
                label-for="branch_email"
              >
                <BFormInput
                  id="branch_email"
                  size="sm"
                  v-model="branch.email"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Tel.')"
                label-for="branch_tel"
              >
                <BFormInput
                  id="branch_tel"
                  size="sm"
                  v-model="branch.tel"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Mobile')"
                label-for="branch_mobile"
              >
                <BFormInput
                  id="branch_mobile"
                  size="sm"
                  v-model="branch.mobile"
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Contact')"
                label-for="branch_contact"
              >
                <BFormTextarea
                  id="branch_contact"
                  v-model="branch.contact"
                  rows="5"
                ></BFormTextarea>
              </BFormGroup>
            </b-col>
          </b-row>


        </b-overlay>
      </b-form>
    </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import branchModel from '../../models/company/Branch.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    return {
      branch: {
        name: {
          required,
        },
        address: {
          required,
        },
        postal: {
          required,
        },
        city: {
          required,
        },
      }
    }
  },
  data () {
    return {
      isLoading: false,
      countries: [],
      submitClicked: false,
      branch: branchModel.getFields(),
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
  async created() {
    this.countries = await this.$store.dispatch('getCountries')

    if (this.isCreate) {
      this.branch = branchModel.getFields()
    } else {
      await this.loadData()
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await branchModel.insert(this.branch)
          infoToast(create, $trans('Created'), $trans('Branch has been created'))
          this.isLoading = false
          this.cancelForm()
        } catch(error) {
          console.log('Error creating branch', error)
          errorToast(create, $trans('Error creating branch'))
          this.isLoading = false
        }

        return
      }

      try {
        await branchModel.update(this.pk, this.branch)
        infoToast(create, $trans('Updated'), $trans('Branch has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating branch', error)
        errorToast(create, $trans('Error updating branch'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.branch = await branchModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching branch', error)
        errorToast(create, $trans('Error loading branch'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
