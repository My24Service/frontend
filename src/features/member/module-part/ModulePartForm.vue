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
                {{ errors.name || PLACEHOLDERS.name() }}
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
                {{ errors.module || PLACEHOLDERS.module() }}
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
import {
  memberModuleListOptions,
  memberModulePartCreateMutation,
  memberModulePartPartialUpdateMutation,
  memberModulePartRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { ModulePart } from '@/api/types.gen'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import {
  emptyModulePart,
  PLACEHOLDERS,
  parseModulePart,
  validateModulePart,
  type ModulePartFieldErrors,
  type ModulePartFormValues,
} from './schemas'
import { invalidateModulePartListQueries } from '../invalidation'
import { $trans } from '@/services/i18n'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table/server-paged-list'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const {
  values: modulePart,
  errors,
  submitClicked,
  isCreate,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<ModulePartFormValues, ModulePart, ReturnType<typeof parseModulePart>, ModulePartFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => memberModulePartRetrieveOptions({path: {id}}),
  create: memberModulePartCreateMutation(),
  update: memberModulePartPartialUpdateMutation(),
  invalidate: invalidateModulePartListQueries,
  empty: emptyModulePart,
  fromRecord: (record) => ({
    name: record.name,
    module: record.module,
    is_always_selected: record.is_always_selected ?? false,
  }),
  validate: validateModulePart,
  parse: parseModulePart,
  copy: {
    fetchError: $trans('Error fetching module part'),
    created: $trans('Created'),
    createdDetail: $trans('Module part has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Module part has been updated'),
    createError: $trans('Error creating module part'),
    updateError: $trans('Error updating module part'),
  },
})

// The module dropdown must offer every module, not the first page of them.
// 1000 is the API's own ceiling: `My24Pagination.max_page_size` (my24service
// `source/apps/core/rest.py:236`), which DRF clamps a larger value down to
// rather than rejecting it, so this is the most one response can carry.

const modulesQuery = useQuery(
  memberModuleListOptions({query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
)

useQueryErrorToast(modulesQuery.error, $trans('Error loading modules'))

const moduleChoices = computed(() =>
  (modulesQuery.data.value?.results ?? []).map((module) => ({
    value: module.id,
    text: module.name,
  })),
)

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

const isLoading = computed(() =>
  baseIsLoading.value ||
  modulesQuery.isLoading.value,
)
</script>
