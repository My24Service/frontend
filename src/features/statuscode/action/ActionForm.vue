<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiMinecartLoaded></IBiMinecartLoaded>
          <span class="backlink" @click="cancelForm">{{ $trans('Actions') }}</span> /
          <strong>{{ action.name }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !action.name">{{ $trans('new') }}</span>
            <span v-if="!isCreate">{{ $trans('edit') }}</span>
          </span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            <IBiX></IBiX>
            {{ $trans('Cancel') }}
          </BButton>
          <BButton v-if="!isCreate" @click="showDeleteModal(id)" type="button" variant="danger">
            <IBiTrash></IBiTrash>
            {{ $trans('Delete') }}
          </BButton>
          <BButton @click="submitForm" :disabled="buttonDisabled" type="button" variant="primary">
            <IBiCheck></IBiCheck>
            {{ isCreate ? $trans('Create action') : $trans('Save') }}
          </BButton>
        </div>
      </div>
    </header>
    <b-overlay :show="isLoading" rounded="sm">
      <div class="page-detail flex-columns">
        <ValidatedForm
          name="action"
          v-model="action"
          :errors="errors"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <div class="panel">
            <b-row>
              <b-col cols="6" role="group">
                <ValidatedFormField name="name" autofocus />
              </b-col>
              <b-col cols="6" role="group">
                <BFormGroup label-size="sm" :label="$trans('Type')" label-for="action_type">
                  <BFormSelect id="action_type" v-model="action.type" :options="actionTypes" size="sm" />
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="12" role="group">
                <BFormGroup label-size="sm" :label="$trans('Description')" label-for="action_description">
                  <BFormTextarea id="action_description" v-model="action.description" rows="3" />
                </BFormGroup>
              </b-col>
            </b-row>

            <h4>{{ $trans('Conditions') }}</h4>
            <table class="table table-sm conditions">
              <thead>
                <tr>
                  <th>{{ $trans('Field') }}</th>
                  <th>{{ $trans('Operator') }}</th>
                  <th>{{ $trans('Value') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(condition, index) in action.json_conditions" :key="index">
                  <td>{{ condition.field }}</td>
                  <td>{{ condition.operator }}</td>
                  <td>{{ condition.value }}</td>
                  <td class="text-end">
                    <BButton variant="light" size="sm" :title="$trans('Delete')" @click="removeCondition(index)">
                      <IBiTrash></IBiTrash>
                    </BButton>
                  </td>
                </tr>
              </tbody>
            </table>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup label-size="sm" :label="$trans('field')" label-for="action-condition-field">
                  <BFormInput id="action-condition-field" size="sm" v-model="draftCondition.field" />
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup label-size="sm" :label="$trans('operator')" label-for="action-condition-operator">
                  <BFormSelect id="action-condition-operator" size="sm" v-model="draftCondition.operator" :options="CONDITION_OPERATORS" />
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup label-size="sm" :label="$trans('value')" label-for="action-condition-value">
                  <BFormInput id="action-condition-value" size="sm" v-model="draftCondition.value" />
                </BFormGroup>
              </b-col>
              <b-col cols="12">
                <footer class="modal-footer">
                  <BButton class="add-condition" size="sm" type="button" variant="warning" @click="addCondition">
                    {{ $trans('Add condition') }}
                  </BButton>
                </footer>
              </b-col>
            </b-row>
            <BFormGroup label-size="sm" :label="$trans('Condition handling')" label-for="action_querymode">
              <BFormSelect id="action_querymode" v-model="action.querymode" :options="QUERYMODES" size="sm" />
            </BFormGroup>
          </div>

          <div class="panel">
            <div v-if="action.type === 'status'">
              <BFormGroup
                label-size="sm"
                :label="$trans('Override status?')"
                label-for="action_status_override"
                :description="$trans('Set a different status in the original order.')"
              >
                <BFormCheckbox id="action_status_override" v-model="action.override_status" />
              </BFormGroup>
              <BFormGroup
                v-if="action.override_status"
                label-size="sm"
                :label="$trans('Status')"
                label-for="action_status_override_template"
              >
                <BFormInput id="action_status_override_template" size="sm" v-model="action.template" />
              </BFormGroup>
            </div>

            <div v-if="action.type === 'copy'">
              <BFormGroup label-size="sm" :label="$trans('Partner')" label-for="action_partner">
                <BFormSelect id="action_partner" v-model="action.company_partner" :options="partnerOptions" size="sm" />
              </BFormGroup>
            </div>

            <div v-if="action.type.includes('email')">
              <BFormGroup label-size="sm" :label="$trans('Address')" label-for="action_email_address">
                <BFormInput id="action_email_address" size="sm" v-model="action.address" />
              </BFormGroup>
              <BFormGroup label-size="sm" :label="$trans('Subject')" label-for="action_email_subject">
                <BFormInput id="action_email_subject" size="sm" v-model="action.subject" />
              </BFormGroup>
              <BFormGroup label-size="sm" :label="$trans('Body')" label-for="action_email_body">
                <BFormTextarea id="action_email_body" v-model="action.template" rows="10" />
              </BFormGroup>
            </div>

            <div v-if="action.type === 'send_sms'">
              <BFormGroup label-size="sm" :label="$trans('Address')" label-for="action_sms_address">
                <BFormInput id="action_sms_address" size="sm" v-model="action.address" />
              </BFormGroup>
              <BFormGroup label-size="sm" :label="$trans('Body')" label-for="action_sms_body">
                <BFormTextarea id="action_sms_body" v-model="action.template" rows="10" />
              </BFormGroup>
            </div>

            <div v-if="action.type === 'send_fcm'">
              <BFormGroup label-size="sm" :label="$trans('User')" label-for="action_fcm_address">
                <BFormInput id="action_fcm_address" size="sm" v-model="action.address" />
              </BFormGroup>
              <BFormGroup label-size="sm" :label="$trans('Title')" label-for="action_fcm_title">
                <BFormInput id="action_fcm_title" size="sm" v-model="action.subject" />
              </BFormGroup>
              <BFormGroup label-size="sm" :label="$trans('Body')" label-for="action_fcm_body">
                <BFormTextarea id="action_fcm_body" v-model="action.template" rows="10" />
              </BFormGroup>
            </div>

            <div>
              <a href="https://my24service.github.io/docs/#orders" target="_blank">
                {{ $trans('documentation') }}
              </a>
            </div>
          </div>
        </ValidatedForm>

        <b-modal
          id="delete-action-modal"
          ref="deleteModal"
          :title="$trans('Delete?')"
          @ok="handleDeleteOk"
        >
          <p class="my-4">{{ $trans('Are you sure you want to delete this action?') }}</p>
        </b-modal>
      </div>
    </b-overlay>
  </div>
</template>

<script lang="ts" setup>
import {
  companyPartnerListOptions,
  statuscodeActionCreateMutation,
  statuscodeActionDestroyMutation,
  statuscodeActionPartialUpdateMutation,
  statuscodeActionRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Action, CompanyPartnerListData } from '@/api/types.gen'
import { useAuthStore } from '@/features/auth/store'
import { useResourceForm } from '@/features/forms/use-resource-form'
import ValidatedForm from '@/features/forms/ValidatedForm.vue'
import ValidatedFormField from '@/features/forms/ValidatedFormField.vue'
import { useConfirmedAction } from '@/features/table'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table/server-paged-list'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import my24 from '@/services/my24'
import { useMainStore } from '@/stores/main'

import type { CodeType } from '../code-types'
import { invalidateStatuscodeLists } from '../invalidation'
import {
  actionFromRecord,
  actionTypesFor,
  emptyAction,
  FIELD_LABELS,
  parseAction,
  validateAction,
  type ActionBody,
  type ActionCondition,
  type ActionFieldErrors,
  type ActionFormValues,
} from './schemas'

const props = withDefaults(defineProps<{
  codeType: CodeType
  fromSettings?: boolean
  /** The action being edited. */
  pk?: string | number | null
  /** The statuscode a new action is created for. */
  statuscodePk?: string | number | null
}>(), {
  fromSettings: false,
  pk: null,
  statuscodePk: null,
})

const router = useRouter()
const queryClient = useQueryClient()
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create: toast} = useToast()

const {
  values: action,
  errors,
  submitClicked,
  isCreate,
  id,
  isLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<ActionFormValues, Action, ActionBody, ActionFieldErrors>({
  pk: () => props.pk,
  retrieve: (actionId) => statuscodeActionRetrieveOptions({path: {id: actionId}}),
  create: statuscodeActionCreateMutation(),
  update: statuscodeActionPartialUpdateMutation(),
  invalidate: invalidateStatuscodeLists,
  empty: emptyAction,
  fromRecord: actionFromRecord,
  validate: validateAction,
  parse: (values, context) => parseAction(values, {isCreate: context.isCreate, statuscodePk: props.statuscodePk}),
  copy: {
    fetchError: $trans('Error loading action'),
    created: $trans('Created'),
    createdDetail: $trans('Action has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Action has been updated'),
    createError: $trans('Error creating action'),
    updateError: $trans('Error updating action'),
  },
})

// action types ------------------------------------------------------------

const hasGripp = computed(() => my24.hasAccessToModule({
  isStaff: authStore.isStaff,
  isSuperuser: authStore.isSuperuser,
        modules: mainStore.getModules,
        parts: mainStore.getModuleParts,
  module: 'company',
  part: 'connector-gripp',
}))

const actionTypes = computed(() => actionTypesFor(props.codeType, {hasGripp: hasGripp.value}))

// partners, for the order type's copy action --------------------------------

type PartnerListQueryParams = NonNullable<CompanyPartnerListData['query']>

const partnersQuery = useQuery(() => ({
  ...companyPartnerListOptions({query: {page_size: WHOLE_COLLECTION_PAGE_SIZE} as PartnerListQueryParams}),
  enabled: props.codeType === 'order',
}))

const partnerOptions = computed(() => (partnersQuery.data.value?.results ?? []).map((partner) => ({
  value: partner.id,
  text: partner.partner_view.name,
})))

// conditions ---------------------------------------------------------------

const CONDITION_OPERATORS = ['=', '!=', '<', '<=', '>', '>=', 'REGEXP', 'NOTREGEXP', 'CONTAINS']

const QUERYMODES = [
  {value: 'and', text: $trans('must match all of the conditions')},
  {value: 'or', text: $trans('match any of the conditions')},
]

const draftCondition = reactive<ActionCondition>({field: '', operator: '=', value: ''})

/**
 * Stage the typed condition. Every part is required on the wire
 * (`vActionConditionRequest`), so an incomplete one is not added — the legacy
 * form staged it and the save then failed.
 */
function addCondition() {
  if (!draftCondition.field || !draftCondition.operator || !draftCondition.value) return
  action.value.json_conditions.push({...draftCondition})
  draftCondition.field = ''
  draftCondition.value = ''
}

function removeCondition(index: number) {
  action.value.json_conditions.splice(index, 1)
}

// delete -------------------------------------------------------------------

const {confirm: showDeleteModal, handleOk: handleDeleteOk} = useConfirmedAction({
  modalRefName: 'deleteModal',
  mutationOptions: () => ({
    ...statuscodeActionDestroyMutation(),
    onSuccess: async () => {
      infoToast(toast, $trans('Deleted'), $trans('Action has been deleted'))
      await invalidateStatuscodeLists(queryClient)
      router.go(-1)
    },
    onError: () => {
      errorToast(toast, $trans('Error deleting action'))
    },
  }),
})
</script>
