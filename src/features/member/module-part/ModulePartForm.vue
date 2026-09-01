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
import { invalidateModulePartListQueries } from './list-invalidation'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Module Part create/edit form — the tracer-bullet Slice's form (#321).
 *
 * Reads go through the generated query options (the module dropdown, and the
 * record being edited); writes go through the generated mutations and
 * invalidate the affected list queries, so the list shows the change when the
 * user comes back even inside vue-query's stale window.
 *
 * Validation parses the form against the generated request schema
 * (`./schemas.ts`) — the same schema the network seam holds request bodies to.
 * There is no Vuelidate here and no hand-written field bag: the parsed output
 * is exactly what goes on the wire, which is why the bodies carry only the
 * fields the API declares.
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
const partId = computed(() => Number(props.pk))

// reads -----------------------------------------------------------------

const modulesQuery = useQuery(memberModuleListOptions({query: {page: 1}}))

const detailQuery = useQuery({
  ...memberModulePartRetrieveOptions({path: {id: partId.value}}),
  // A create form has no record to fetch; without this the retrieve fires
  // against `undefined`.
  enabled: !isCreate.value,
})

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

// The dropdown options, straight off the generated response shape.
const moduleChoices = computed(() =>
  (modulesQuery.data.value?.results ?? []).map((module) => ({
    value: module.id,
    text: module.name,
  })),
)

// form state ------------------------------------------------------------

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

// An edit fills itself once the record arrives; created/modified and
// module_name are display-only here and never sent (the parse drops them).
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

// writes ----------------------------------------------------------------

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

// validation ------------------------------------------------------------

const errors = ref<ModulePartFieldErrors>({})
const submitClicked = ref(false)

async function submitForm() {
  submitClicked.value = true

  const found = validateModulePart(modulePart.value)
  errors.value = found
  if (Object.keys(found).length > 0) return

  // The parsed output is the body — typed by the request schema and stripped
  // of anything it does not declare.
  const body = parseModulePart(modulePart.value)

  try {
    if (isCreate.value) {
      await saveMutation.mutateAsync({body})
    } else {
      await updateMutation.mutateAsync({path: {id: partId.value}, body})
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
