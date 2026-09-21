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
                {{ errors.name || PLACEHOLDERS.name() }}
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
import {
  memberModuleCreateMutation,
  memberModulePartialUpdateMutation,
  memberModuleRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Module, ModuleRequest } from '@/api/types.gen'
import { useResourceForm } from '@/features/forms/use-resource-form'
import {
  emptyModule,
  PLACEHOLDERS,
  parseModule,
  validateModule,
  type ModuleFieldErrors,
} from './schemas'
import { invalidateModuleListQueries } from '../invalidation'
import { $trans } from '@/services/i18n'

const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const {
  values: module,
  errors,
  submitClicked,
  isCreate,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<ModuleRequest, Module, ReturnType<typeof parseModule>, ModuleFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => memberModuleRetrieveOptions({path: {id}}),
  create: memberModuleCreateMutation(),
  update: memberModulePartialUpdateMutation(),
  invalidate: invalidateModuleListQueries,
  empty: emptyModule,
  fromRecord: (record) => ({name: record.name}),
  validate: validateModule,
  parse: parseModule,
  copy: {
    fetchError: $trans('Error fetching module'),
    created: $trans('Created'),
    createdDetail: $trans('Module has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Module has been updated'),
    createError: $trans('Error creating module'),
    updateError: $trans('Error updating module'),
  },
})
</script>
