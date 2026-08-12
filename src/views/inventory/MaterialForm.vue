<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiBox></IBiBox>
          <span class="backlink" @click="cancelForm">{{ $trans("Materials") }}</span> /
          <span v-if="isCreate && !material.name" class="dimmed">({{ $trans("Material name") }}</span>
          <span v-else>{{ material.name }}</span>
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

    <div class="page-detail">
      <b-overlay :show="isLoading" rounded="sm">
        <b-form class="flex-columns">
          <div class="panel col-1-3">
            <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Name')"
                label-for="material_name"
              >
                <BFormInput
                  v-model="material.name"
                  id="material_name"
                  size="sm"
                  :state="isSubmitClicked ? !v$.material.name.$error : null">
                </BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.material.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Name short')"
                label-for="material_name_short"
              >
                <BFormInput
                  id="material_name_short"
                  size="sm"
                  v-model="material.name_short"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Identifier')"
                label-for="material_identifier"
              >
                <BFormInput
                  id="material_identifier"
                  size="sm"
                  v-model="material.identifier"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Unit')"
                label-for="material_unit"
              >
                <BFormInput
                  id="material_unit"
                  size="sm"
                  v-model="material.unit"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Search supplier')"
                label-for="material-supplier-search"
              >
                <VueMultiselect
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
                  <template #noResult>
                    {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                    </template>
                </VueMultiselect>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Supplier')"
                label-for="material_supplier_name"
              >
                <BFormInput
                  readonly
                  id="material_supplier_name"
                  size="sm"
                  v-model="material.supplier_name"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Location')"
                label-for="material-location"
              >
                <BFormInput
                  id="material-location"
                  size="sm"
                  v-model="material.location"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Product type')"
                label-for="material-product-type"
              >
                <BFormInput
                  id="material-product-type"
                  size="sm"
                  v-model="material.product_type"
                ></BFormInput>
              </BFormGroup>


              <h6>{{ $trans("Pricing") }}</h6>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Purchase price')"
                label-for="price_purchase"
              >
                <BFormInput
                  v-model="material.price_purchase"
                  id="price_purchase"
                  size="sm"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Selling price')"
                label-for="price_selling"
              >
                <BFormInput
                  id="price_selling"
                  size="sm"
                  v-model="material.price_selling"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Alt. selling price')"
                label-for="price_selling_alt"
              >
                <BFormInput
                  id="price_selling_alt"
                  size="sm"
                  v-model="material.price_selling_alt"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Purchase price ex.')"
                label-for="price_purchase_ex"
              >
                <BFormInput
                  id="price_purchase_ex"
                  size="sm"
                  v-model="material.price_purchase_ex"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Selling price ex.')"
                label-for="price_selling_ex"
              >
                <BFormInput
                  id="price_selling_ex"
                  size="sm"
                  v-model="material.price_selling_ex"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="4"
                v-bind:label="$trans('Alt. selling price ex.')"
                label-for="price_selling_alt_ex"
              >
                <BFormInput
                  id="price_selling_alt_ex"
                  size="sm"
                  v-model="material.price_selling_alt_ex"
                ></BFormInput>
              </BFormGroup>
          </div>

          <div class="panel col-2-3">
            <h6>{{$trans('Image')}}</h6>
            <b-row>
              <b-col cols="12">
                <BFormGroup
                  label-size="sm"
                  label-for="material-image"
                >
                  <b-form-file
                    id="material-image"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here.')"
                    @input="imageSelected"
                  ></b-form-file>
                </BFormGroup>
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

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import VueMultiselect from 'vue-multiselect'

import materialService from '../../models/inventory/Material.js'
import supplierModel from '../../models/inventory/Supplier.js'
import {NO_IMAGE_URL} from "@/constants"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null
  },
})

const {create} = useToast()
const router = useRouter()

const isLoading = ref(false)
const buttonDisabled = ref(false)
const submitClicked = ref(false)
const material = ref(materialService.getFields())
const suppliers = ref([])
const current_image = ref(NO_IMAGE_URL)
const upload_preview = ref(NO_IMAGE_URL)

// Unlike the options API's bare useVuelidate(), the state is passed explicitly
// here, so validation follows `material` through the reassignments in init()
// and loadData().
const rules = {
  material: {
    name: {
      required,
    },
  },
}

const v$ = useVuelidate(rules, {material})

const isCreate = computed(() => !props.pk)
const isSubmitClicked = computed(() => submitClicked.value)

function imageSelected(file) {
  const reader = new FileReader()
  reader.onload = (f) => {
    const b64 = f.target.result
    upload_preview.value = b64
    material.value.image = b64
  }

  reader.readAsDataURL(file)
}

function selectSupplier(option) {
  material.value.supplier_relation = option.id
  material.value.supplier_name = option.name
}

async function submitForm() {
  submitClicked.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    return
  }

  // The image is left out of the payload by the model unless the user picked a
  // new file; see MaterialService.stripImageUnlessUploaded.
  buttonDisabled.value = true
  isLoading.value = true

  if (isCreate.value) {
    try {
      await materialService.insert(material.value)
      infoToast(create, $trans('Created'), $trans('Material has been created'))
      buttonDisabled.value = false
      isLoading.value = false
      router.go(-1)
    } catch(error) {
      console.log('Error creating material', error)
      errorToast(create, $trans('Error creating material'))
      buttonDisabled.value = false
      isLoading.value = false
    }

    return
  }

  try {
    await materialService.update(props.pk, material.value)
    infoToast(create, $trans('Updated'), $trans('Material has been updated'))
    buttonDisabled.value = false
    isLoading.value = false
    router.go(-1)
  } catch(error) {
    console.log('Error updating material', error)
    errorToast(create, $trans('Error updating material'))
    isLoading.value = false
    buttonDisabled.value = false
  }
}

async function getSuppliers(query) {
  isLoading.value = true
  try {
    suppliers.value = await supplierModel.search(query)
    isLoading.value = false
  } catch(error) {
    console.log('Error fetching suppliers', error)
    errorToast(create, $trans('Error fetching suppliers'))
    isLoading.value = false
  }
}

async function loadData() {
  isLoading.value = true

  try {
    material.value = await materialService.detail(props.pk)
    current_image.value = material.value.image ? material.value.image : NO_IMAGE_URL
    isLoading.value = false
  } catch(error) {
    console.log('error fetching material', error)
    errorToast(create, $trans('Error fetching material'))
    isLoading.value = false
  }
}

function cancelForm() {
  router.go(-1)
}

// Was created(). Deliberately not awaited, same as the options-API hook.
function init() {
  getSuppliers('')

  if (!isCreate.value) {
    loadData()
  } else {
    material.value = materialService.getFields()
  }
}

init()

// The tests reach these through wrapper.vm, which for <script setup> only sees
// what is explicitly exposed.
defineExpose({
  material,
  current_image,
  upload_preview,
  suppliers,
  isLoading,
  buttonDisabled,
  v$,
  selectSupplier,
  imageSelected,
  submitForm,
})
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
