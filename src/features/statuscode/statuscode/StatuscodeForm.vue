<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{name: routeNames.list}">{{ $trans('Statuscodes') }}</router-link>
          /
          <strong>{{ statuscode.statuscode }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !statuscode.statuscode">{{ $trans('new') }}</span>
            <span v-if="!isCreate && !statuscode.statuscode">{{ $trans('edit') }}</span>
          </span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton @click="submitForm" :disabled="buttonDisabled" type="button" variant="primary">
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>
    <b-overlay :show="isLoading" rounded="sm">
      <div class="page-detail flex-columns">
        <ValidatedForm
          name="statuscode"
          v-model="statuscode"
          :errors="errors"
          :messages="FIELD_MESSAGES"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <div class="panel">
            <h6>{{ $trans('Settings') }}</h6>
            <ValidatedFormField name="statuscode" label-cols="3" autofocus />

            <BFormGroup
              label-cols="3"
              :label="$trans('New status template')"
              label-for="statuscode_new_status_template"
              :description="$trans('For statuses that are not set by the application.')"
            >
              <BFormInput
                id="statuscode_new_status_template"
                size="sm"
                v-model="statuscode.new_status_template"
              />
            </BFormGroup>

            <BFormGroup
              label-cols="3"
              :label="$trans('Description')"
              label-for="statuscode_description"
            >
              <BFormTextarea
                id="statuscode_description"
                v-model="statuscode.description"
                rows="3"
              />
            </BFormGroup>

            <RolesField
              v-model="statuscode.roles"
              :code-type="codeType"
              :error="errors.roles"
            />

            <h6>{{ $trans('Label') }}</h6>
            <BFormGroup label-cols="3" :label="$trans('Label preview')">
              <StatuscodeLabel
                :text="statuscode.statuscode || 'statuscode text'"
                :color="statuscode.color"
              />
            </BFormGroup>
            <BFormGroup
              label-cols="3"
              :label="$trans('Label color')"
              :description="$trans('Use this color in dispatch.')"
            >
              <LabelColorField v-model="statuscode.color" />
              <b-form-invalid-feedback :state="submitClicked ? !errors.color : null">
                {{ errors.color || FIELD_MESSAGES.color() }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <ExpiryConditionFields
              v-if="hasDateTrigger(codeType)"
              :code-type="codeType"
              v-model:num-days="statuscode.num_days"
              v-model:operator="statuscode.num_days_operator"
              v-model:model-field="statuscode.num_days_model_field"
              :error="errors.num_days"
              :submitted="submitClicked"
            />
          </div>
        </ValidatedForm>
      </div>
    </b-overlay>
  </div>
</template>

<script lang="ts" setup>
import {
  statuscodeStatuscodeCreateMutation,
  statuscodeStatuscodePartialUpdateMutation,
  statuscodeStatuscodeRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Statuscode } from '@/api/types.gen'
import { useResourceForm } from '@/features/forms/use-resource-form'
import ValidatedForm from '@/features/forms/ValidatedForm.vue'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import { $trans } from '@/services/i18n'

import { routeNamesFor, type CodeType } from '../code-types'
import { invalidateStatuscodeLists } from '../invalidation'
import StatuscodeLabel from '../StatuscodeLabel.vue'
import ExpiryConditionFields from './ExpiryConditionFields.vue'
import LabelColorField from './LabelColorField.vue'
import RolesField from './RolesField.vue'
import {
  emptyStatuscode,
  FIELD_LABELS,
  FIELD_MESSAGES,
  hasDateTrigger,
  parseStatuscode,
  statuscodeFromRecord,
  validateStatuscode,
  type StatuscodeBody,
  type StatuscodeFieldErrors,
  type StatuscodeFormValues,
} from './schemas'

const props = withDefaults(defineProps<{
  codeType: CodeType
  fromSettings?: boolean
  pk?: string | number | null
}>(), {
  fromSettings: false,
  pk: null,
})

const routeNames = computed(() => routeNamesFor(props.codeType, props.fromSettings))

const {
  values: statuscode,
  errors,
  submitClicked,
  isCreate,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<StatuscodeFormValues, Statuscode, StatuscodeBody, StatuscodeFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => statuscodeStatuscodeRetrieveOptions({path: {id}}),
  create: statuscodeStatuscodeCreateMutation(),
  update: statuscodeStatuscodePartialUpdateMutation(),
  invalidate: invalidateStatuscodeLists,
  empty: emptyStatuscode,
  fromRecord: statuscodeFromRecord,
  validate: validateStatuscode,
  parse: (values) => parseStatuscode(values, props.codeType),
  copy: {
    fetchError: $trans('Error loading statuscode'),
    created: $trans('Created'),
    createdDetail: $trans('Statuscode has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Statuscode has been updated'),
    createError: $trans('Error creating statuscode'),
    updateError: $trans('Error updating statuscode'),
  },
})
</script>
