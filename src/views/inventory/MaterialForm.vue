<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="box"></b-icon>
          <span class="backlink" @click="cancelForm">{{ $trans("Materials") }}</span> /
          <span v-if="isCreate && !this.material.name" class="dimmed">({{ $trans("Material name") }}</span>
          <span v-else>{{this.material.name}}</span>
        </h3>
        <div class="flex-columns">
          <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </b-button>
          <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
            {{ $trans('Submit') }}
          </b-button>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <b-form class="flex-columns">
          <div class="panel col-1-3">
            <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Name')"
                label-for="material_name"
              >
                <b-form-input
                  v-model="material.name"
                  id="material_name"
                  size="sm"
                  :state="isSubmitClicked ? !v$.material.name.$error : null">
                </b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.material.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Name short')"
                label-for="material_name_short"
              >
                <b-form-input
                  id="material_name_short"
                  size="sm"
                  v-model="material.name_short"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Identifier')"
                label-for="material_identifier"
              >
                <b-form-input
                  id="material_identifier"
                  size="sm"
                  v-model="material.identifier"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Unit')"
                label-for="material_unit"
              >
                <b-form-input
                  id="material_unit"
                  size="sm"
                  v-model="material.unit"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Search supplier')"
                label-for="material-supplier-search"
              >
                <multiselect
                  id="material-supplier-search"
                  track-by="id"
                  :placeholder="$trans('Type to search')"
                  open-direction="bottom"
                  :options="suppliers"
                  :multiple="false"
                  :loading="isLoading"
                  :internal-search="false"
                  :clear-on-select="false"
                  :close-on-select="true"
                  :options-limit="30"
                  :limit="10"
                  :max-height="600"
                  :show-no-results="false"
                  :hide-selected="true"
                  @search-change="getSuppliers"
                  @select="selectSupplier"
                  label="name"
                >
                  <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                </multiselect>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Supplier')"
                label-for="material_supplier_name"
              >
                <b-form-input
                  readonly
                  id="material_supplier_name"
                  size="sm"
                  v-model="material.supplier_name"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Location')"
                label-for="material-location"
              >
                <b-form-input
                  id="material-location"
                  size="sm"
                  v-model="material.location"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Product type')"
                label-for="material-product-type"
              >
                <b-form-input
                  id="material-product-type"
                  size="sm"
                  v-model="material.product_type"
                ></b-form-input>
              </b-form-group>


              <h6>{{ $trans("Pricing") }}</h6>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Purchase price')"
                label-for="price_purchase"
              >
                <b-form-input
                  v-model="material.price_purchase"
                  id="price_purchase"
                  size="sm"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Selling price')"
                label-for="price_selling"
              >
                <b-form-input
                  id="price_selling"
                  size="sm"
                  v-model="material.price_selling"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Alt. selling price')"
                label-for="price_selling_alt"
              >
                <b-form-input
                  id="price_selling_alt"
                  size="sm"
                  v-model="material.price_selling_alt"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Purchase price ex.')"
                label-for="price_purchase_ex"
              >
                <b-form-input
                  id="price_purchase_ex"
                  size="sm"
                  v-model="material.price_purchase_ex"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Selling price ex.')"
                label-for="price_selling_ex"
              >
                <b-form-input
                  id="price_selling_ex"
                  size="sm"
                  v-model="material.price_selling_ex"
                ></b-form-input>
              </b-form-group>

              <b-form-group
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Alt. selling price ex.')"
                label-for="price_selling_alt_ex"
              >
                <b-form-input
                  id="price_selling_alt_ex"
                  size="sm"
                  v-model="material.price_selling_alt_ex"
                ></b-form-input>
              </b-form-group>
          </div>

          <div class="panel col-2-3">
            <h6>{{$trans('Image')}}</h6>
            <b-row>
              <b-col cols="12">
                <b-form-group
                  label-size="sm"
                  label-for="material-image"
                >
                  <b-form-file
                    id="material-image"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here.')"
                    @input="imageSelected"
                  ></b-form-file>
                </b-form-group>
              </b-col>
              <b-col cols="6">
                <h3>{{ $trans('Current image') }}</h3>
                <img width="200px" :src="current_image" alt=""/>
              </b-col>
              <b-col cols="6">
                <h3>{{ $trans('Upload preview') }}</h3>
                <img width="200px" :src="upload_preview" alt=""/>
              </b-col>
            </b-row>
          </div>
        </b-form>
      </b-overlay>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import materialService from '../../models/inventory/Material.js'
import supplierModel from '../../models/inventory/Supplier.js'
import {NO_IMAGE_URL} from "../../constants"

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
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
      material: materialService.getFields(),
      errorMessage: null,
      suppliers: [],
      current_image: NO_IMAGE_URL,
      upload_preview: NO_IMAGE_URL,
      fileChanged: false
    }
  },
  validations: {
    material: {
      name: {
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
    this.getSuppliers('')

    if (!this.isCreate) {
      this.loadData()
    } else {
      this.material = materialService.getFields()
    }
  },
  methods: {
    imageSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.upload_preview = b64
        this.material.image = b64
      }

      reader.readAsDataURL(file)
      this.fileChanged = true
    },
    selectSupplier(option) {
      this.material.supplier_relation = option.id
      this.material.supplier_name = option.name
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['image']
      for (let i=0; i<null_fields.length; i++) {
        if (this.material[null_fields[i]] === null) {
          delete this.material[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          await materialService.insert(this.material)
          this.infoToast(this.$trans('Created'), this.$trans('Material has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating material', error)
          this.errorToast(this.$trans('Error creating material'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        if (!this.fileChanged) {
          delete this.material.image
        }

        await materialService.update(this.pk, this.material)
        this.infoToast(this.$trans('Updated'), this.$trans('Material has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating material', error)
        this.errorToast(this.$trans('Error updating material'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async getSuppliers(query) {
      this.isLoading = true
      try {
        this.suppliers = await supplierModel.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching suppliers', error)
        this.errorToast(this.$trans('Error fetching suppliers'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.material = await materialService.detail(this.pk)
        this.current_image = this.material.image ? this.material.image : NO_IMAGE_URL
        this.isLoading = false
      } catch(error) {
        console.log('error fetching material', error)
        this.errorToast(this.$trans('Error fetching material'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
