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
              :label="$trans('Name')"
              label-for="module-part_name"
            >
              <BFormInput
                v-model="modulePart.name"
                id="module-part_name"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="module-part_name-feedback"
                :state="submitClicked ? !errors.name : null">
                {{ errors.name || FIELD_MESSAGES.name() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              :label="$trans('Module')"
              label-for="module-part_module"
            >
              <BFormSelect
                v-model="modulePart.module"
                id="module-part_module"
                :options="moduleChoices"
                size="sm"
              ></BFormSelect>
              <b-form-invalid-feedback
                id="module-part_module-feedback"
                :state="submitClicked ? !errors.module : null">
                {{ errors.module || FIELD_MESSAGES.module() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
          <b-col cols="3" role="group">
            <BFormGroup
              label-size="sm"
              :label="$trans('Always selected?')"
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

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  memberModuleListOptions,
  memberModulePartCreateMutation,
  memberModulePartPartialUpdateMutation,
  memberModulePartRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import {
  emptyModulePart,
  FIELD_MESSAGES,
  parseModulePart,
  validateModulePart,
  type ModulePartFieldErrors,
  type ModulePartFormValues,
} from './schemas'
import { invalidateModulePartListQueries } from '../invalidation'
import { errorToast, infoToast, $trans } from '@/utils'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const queryClient = useQueryClient()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
const partId = computed(() => Number(props.pk))

const modulesQuery = useQuery(memberModuleListOptions({query: {page: 1}}))

const detailQuery = useQuery(() => ({
  ...memberModulePartRetrieveOptions({path: {id: partId.value}}),
  enabled: !isCreate.value,
}))

watch(
  () => modulesQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading modules'))
  },
)

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching module part'))
  },
)

const moduleChoices = computed(() =>
  (modulesQuery.data.value?.results ?? []).map((module) => ({
    value: module.id,
    text: module.name,
  })),
)

const modulePart = ref<ModulePartFormValues>(emptyModulePart())

// Default a new part to the first module offered — guarded, because a member
// with no modules has no first offer. The old form crashed here (#320).
watch(
  moduleChoices,
  (choices) => {
    if (isCreate.value && modulePart.value.module === null && choices.length > 0) {
      modulePart.value.module = choices[0].value
    }
  },
  {immediate: true},
)

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    modulePart.value = {
      name: data.name,
      module: data.module,
      is_always_selected: data.is_always_selected ?? false,
    }
  },
  {immediate: true},
)

const saveMutation = useMutation({
  ...memberModulePartCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('Module part has been created'))
    await invalidateModulePartListQueries(queryClient)
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating module part'))
  },
})

const updateMutation = useMutation({
  ...memberModulePartPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Module part has been updated'))
    await invalidateModulePartListQueries(queryClient)
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating module part'))
  },
})

const isLoading = computed(() =>
  modulesQuery.isLoading.value ||
  detailQuery.isLoading.value ||
  saveMutation.isPending.value ||
  updateMutation.isPending.value,
)
const buttonDisabled = computed(() =>
  saveMutation.isPending.value || updateMutation.isPending.value,
)

const errors = ref<ModulePartFieldErrors>({})
const submitClicked = ref(false)

async function submitForm() {
  submitClicked.value = true

  const found = validateModulePart(modulePart.value)
  errors.value = found
  if (Object.keys(found).length > 0) return

  const body = parseModulePart(modulePart.value)

  try {
    if (isCreate.value) {
      await saveMutation.mutateAsync({body})
    } else {
      await updateMutation.mutateAsync({path: {id: partId.value}, body})
    }
  } catch {
  }
}

function cancelForm() {
  router.go(-1)
}
</script>

