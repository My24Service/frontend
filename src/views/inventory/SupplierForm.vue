<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="shop"></b-icon>
          <span class="backlink" @click="cancelForm">{{ $trans('Suppliers') }}</span> /
          {{ supplier.name }}
          <span v-if="!isCreate" class="dimmed">{{ $trans('edit') }}</span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>
    <section class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <b-form class="flex-columns">
          <div class="panel">
            <h6>{{  $trans('Supplier') }}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Identifier')"
              label-for="supplier-identifier"
            >
              <BFormInput
                id="supplier-identifier"
                v-model="supplier.identifier"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Name')"
              label-for="supplier-name"
            >
              <BFormInput
                v-model="supplier.name"
                id="supplier-name"
                :state="isSubmitClicked ? !v$.supplier.name.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Address')"
              label-for="supplier-address"
            >
              <BFormInput
                v-model="supplier.address"
                id="supplier-address"
                :state="isSubmitClicked ? !v$.supplier.address.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.address.$error : null">
                {{ $trans('Please enter an address') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Postal')"
              label-for="supplier-postal"
            >
              <BFormInput
                id="supplier-postal"
                v-model="supplier.postal"
                :state="isSubmitClicked ? !v$.supplier.postal.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('City')"
              label-for="supplier-city"
            >
              <BFormInput
                id="supplier-city"
                v-model="supplier.city"
                :state="isSubmitClicked ? !v$.supplier.city.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.supplier.city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Country')"
              label-for="supplier-city"
            >
              <b-form-select v-model="supplier.country_code" :options="countries" size="sm"></b-form-select>
            </BFormGroup>
          </div>

          <div class="panel">
            <h6>{{  $trans('Contact') }}</h6>
            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Email')"
              label-for="supplier-email"
            >
              <BFormInput
                id="supplier-email"
                v-model="supplier.email"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Tel.')"
              label-for="supplier-tel"
            >
              <BFormInput
                id="supplier-tel"
                v-model="supplier.tel"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Mobile')"
              label-for="supplier-mobile"
            >
              <BFormInput
                id="supplier-mobile"
                v-model="supplier.mobile"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Contact')"
              label-for="supplier-contact"
            >
              <BFormInput
                id="supplier-contact"
                v-model="supplier.contact"
                rows="2"
              ></BFormInput>
            </BFormGroup>
          </div>
        </b-form>
      </b-overlay>
    </section>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import supplierModel from '@/models/inventory/Supplier.js'
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
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      countries: [],
      supplier: supplierModel.getFields(),
      errorMessage: null,
    }
  },
  validations: {
    supplier: {
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
    },
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
    this.$store.dispatch('getCountries')
      .then((countries) => {
        this.countries = countries

        if (!this.isCreate) {
          this.loadData()
        } else {
          this.supplier = supplierModel.getFields()
        }
      })
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = []
      for (let i=0; i<null_fields.length; i++) {
        if (this.purchaseOrder[null_fields[i]] === null) {
          delete this.purchaseOrder[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          await supplierModel.insert(this.supplier)
          infoToast(create, $trans('Created'), $trans('Supplier has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating supplier', error)
          errorToast(create, $trans('Error creating supplier'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        await supplierModel.update(this.pk, this.supplier)
        infoToast(create, $trans('Updated'), $trans('Supplier has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating supplier', error)
        errorToast(create, $trans('Error updating supplier'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.supplier = await supplierModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching supplier', error)
        errorToast(create, $trans('Error fetching supplier'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
