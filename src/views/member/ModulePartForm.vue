<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New module part') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit module part') }}</h2>
        <b-row>
          <b-col cols="6" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="module-part_name"
            >
              <BFormInput
                v-model="modulePart.name"
                id="module-part_name"
                size="sm"
                autofocus
                :state="isSubmitClicked ? !v$.modulePart.name.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.modulePart.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Module')"
              label-for="module-part_module"
            >
              <BFormSelect v-model="modulePart.module" :options="modules" size="sm"></BFormSelect>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Always selected?')"
              label-for="module-part_is_always_selected"
            >
              <BFormCheckbox
                id="module-part_is_always_selected"
                size="sm"
                v-model="modulePart.is_always_selected"
              >
              </BFormCheckbox>
            </BFormGroup>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useToast } from "bootstrap-vue-next"

import modulePartModel from '@/models/member/ModulePart.js'
import moduleModel from '@/models/member/Module.js'
import { errorToast, infoToast, $trans } from "@/utils"

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
const modules = ref([])
const modulePart = ref(modulePartModel.getFields())

// Passed to useVuelidate explicitly rather than relying on the options-API
// `validations` block, so the rules keep tracking modulePart across the
// reassignments in init() and loadData() instead of binding to whatever object
// existed at setup time.
const rules = {
  modulePart: {
    name: {
      required,
    },
  },
}

const v$ = useVuelidate(rules, {modulePart})

const isCreate = computed(() => !props.pk)
const isSubmitClicked = computed(() => submitClicked.value)

async function submitForm() {
  submitClicked.value = true
  v$.value.$touch()

  if (v$.value.$invalid) {
    console.log('invalid?', v$.value.$invalid, v$.value)
    buttonDisabled.value = false
    isLoading.value = false
    return
  }

  buttonDisabled.value = true

  if (isCreate.value) {
    isLoading.value = true
    try {
      await modulePartModel.insert(modulePart.value)
      infoToast(create, $trans('Created'), $trans('Module part has been created'))
      buttonDisabled.value = false
      isLoading.value = false
      router.go(-1)
    } catch(error) {
      console.log('Error creating module part', error)
      errorToast(create, $trans('Error creating module part'))
      buttonDisabled.value = false
      isLoading.value = false
    }

    return
  }

  try {
    isLoading.value = true

    await modulePartModel.update(props.pk, modulePart.value)
    infoToast(create, $trans('Updated'), $trans('Module part has been updated'))
    buttonDisabled.value = false
    isLoading.value = false
    router.go(-1)
  } catch(error) {
    console.log('Error updating module part', error)
    errorToast(create, $trans('Error updating module part'))
    isLoading.value = false
    buttonDisabled.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    modulePart.value = await modulePartModel.detail(props.pk)
    isLoading.value = false
  } catch {
    errorToast(create, $trans('Error fetching module part'))
    isLoading.value = false
  }
}

function cancelForm() {
  router.go(-1)
}

// Was created(). Still not awaited by anything, same as the options-API hook.
async function init() {
  isLoading.value = true

  modules.value = await moduleModel.getSelectOptions()

  if (!isCreate.value) {
    await loadData()
    isLoading.value = false
  } else {
    modulePart.value = modulePartModel.getFields()
    modulePart.value.module = modules.value[0].value
    isLoading.value = false
  }
}

init()

// The tests reach these through wrapper.vm, which for <script setup> only sees
// what is explicitly exposed.
defineExpose({
  modulePart,
  modules,
  isLoading,
  buttonDisabled,
  v$,
  submitForm,
  loadData,
  cancelForm,
})
</script>

<style scoped>
</style>
