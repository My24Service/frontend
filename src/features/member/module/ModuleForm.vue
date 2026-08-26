<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New module') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit module') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              :label="$trans('Name')"
              label-for="module_name"
            >
              <BFormInput
                v-model="module.name"
                id="module_name"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="module_name-feedback"
                :state="submitClicked ? !errors.name : null">
                {{ errors.name || FIELD_MESSAGES.name() }}
              </b-form-invalid-feedback>
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
  memberModuleCreateMutation,
  memberModulePartialUpdateMutation,
  memberModuleRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import {
  emptyModule,
  FIELD_MESSAGES,
  parseModule,
  validateModule,
  type ModuleFieldErrors,
  type ModuleFormValues,
} from './schemas'
import { invalidateModuleListQueries } from './list-invalidation'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Module create/edit form — the tracer bullet's form pattern applied to
 * the smallest resource there is (#322).
 *
 * One read (the record being edited; the create form reads nothing), writes
 * through the generated mutations with the list queries invalidated. The form
 * values parse against the generated request schema (`./schemas.ts`); the
 * parse output is the body, so the update sends only `name` and never hands
 * back `id` or the audit timestamps.
 */

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null,
  },
})

const router = useRouter()
const queryClient = useQueryClient()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
// Route params arrive as strings; the generated operations want the number.
const moduleId = computed(() => Number(props.pk))

// reads -----------------------------------------------------------------

const detailQuery = useQuery({
  ...memberModuleRetrieveOptions({path: {id: moduleId.value}}),
  // A create form has no record to fetch; without this the retrieve fires
  // against `undefined`.
  enabled: !isCreate.value,
})

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching module'))
  },
)

// form state ------------------------------------------------------------

const module = ref<ModuleFormValues>(emptyModule())

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    module.value = {name: data.name}
  },
  {immediate: true},
)

// writes ----------------------------------------------------------------

const saveMutation = useMutation({
  ...memberModuleCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Created'), $trans('Module has been created'))
    await invalidateModuleListQueries(queryClient)
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error creating module'))
  },
})

const updateMutation = useMutation({
  ...memberModulePartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Module has been updated'))
    await invalidateModuleListQueries(queryClient)
    router.go(-1)
  },
  onError: () => {
    errorToast(create, $trans('Error updating module'))
  },
})

const isLoading = computed(() =>
  detailQuery.isLoading.value ||
  saveMutation.isPending.value ||
  updateMutation.isPending.value,
)
const buttonDisabled = computed(() =>
  saveMutation.isPending.value || updateMutation.isPending.value,
)

// validation ------------------------------------------------------------

const errors = ref<ModuleFieldErrors>({})
const submitClicked = ref(false)

async function submitForm() {
  submitClicked.value = true

  const found = validateModule(module.value)
  errors.value = found
  if (Object.keys(found).length > 0) return

  // The parsed output is the body — typed by the request schema and stripped
  // of anything it does not declare.
  const body = parseModule(module.value)

  try {
    if (isCreate.value) {
      await saveMutation.mutateAsync({body})
    } else {
      await updateMutation.mutateAsync({path: {id: moduleId.value}, body})
    }
  } catch {
    // Already handled: onError told the user what failed and the form keeps
    // what they typed.
  }
}

function cancelForm() {
  router.go(-1)
}
</script>

<style scoped>
</style>
