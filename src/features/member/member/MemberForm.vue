<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiBuilding></IBiBuilding>
            <span v-if="isCreate">{{ $trans('New member') }}</span>
            <span v-else>{{ $trans('Edit member') }}</span>
          </h3>
          <div class="flex-columns">
            <BButton @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</BButton>
            <BButton @click="submitForm" type="button" variant="primary" :disabled="buttonDisabled">
              {{ $trans('Save') }}</BButton>
          </div>
        </div>
      </header>

      <div class="page-detail">
        <div class="container app-detail">
          <ValidatedForm
            name="member"
            v-model="member"
            :errors="errors"
            :labels="FIELD_LABELS"
            :submitted="submitClicked"
          >
            <b-form>
              <b-row>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="name" />
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Company code')"
                    label-for="member_companycode"
                    description="[companycode].my24service.com"
                  >
                    <BFormInput
                      id="member_companycode"
                      size="sm"
                      v-model="member.companycode"
                      :state="companyCodeValidationState"
                    ></BFormInput>
                    <b-form-invalid-feedback
                      id="member_companycode-taken-feedback"
                      v-if="companyCodeTakenVisible"
                      :state="false">
                      {{ COMPANYCODE_TAKEN_MESSAGE() }}
                    </b-form-invalid-feedback>
                    <b-form-invalid-feedback
                      id="member_companycode-feedback"
                      v-if="errors.companycode"
                      :state="false">
                      {{ errors.companycode }}
                    </b-form-invalid-feedback>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Contract')"
                    label-for="member_contract"
                  >
                    <BFormSelect v-model="member.contract" id="member_contract" :options="contracts" size="sm"></BFormSelect>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Type')"
                    label-for="member_member_type"
                  >
                    <BFormSelect v-model="member.member_type" id="member_member_type" :options="memberTypes" size="sm"></BFormSelect>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group" v-if="showRequestedList">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Requested')"
                    label-for="member_is_requested"
                  >
                    <BFormSelect v-model="member.is_requested" id="member_is_requested" :options="isRequestedOptions" size="sm"></BFormSelect>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group" v-if="showDeletedList">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Deleted')"
                    label-for="member_is_deleted"
                  >
                    <BFormSelect v-model="member.is_deleted" id="member_is_deleted" :options="isDeletedOptions" size="sm"></BFormSelect>
                  </BFormGroup>
                </b-col>
                <b-col cols="1" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Branches?')"
                    label-for="member_has_branches"
                  >
                    <BFormCheckbox
                      id="member_has_branches"
                      v-model="member.has_branches"
                    >
                    </BFormCheckbox>
                  </BFormGroup>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="3" role="group">
                  <ValidatedFormField name="address" />
                </b-col>
                <b-col cols="1" role="group">
                  <ValidatedFormField name="postal" />
                </b-col>
                <b-col cols="2" role="group">
                  <ValidatedFormField name="city" />
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Country')"
                    label-for="member_country"
                  >
                    <BFormSelect v-model="member.country_code" id="member_country" :options="countries" size="sm"></BFormSelect>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <ValidatedFormField name="chamber_of_commerce" />
                </b-col>
                <b-col cols="2" role="group">
                  <ValidatedFormField name="vat_number" />
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="tel" />
                </b-col>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="email" />
                </b-col>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="www" />
                </b-col>
              </b-row>
              <b-row v-if="!isRequest">
                <b-col cols="1" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Public?')"
                    label-for="member_is_public"
                  >
                    <BFormCheckbox
                      id="member_is_public"
                      v-model="member.is_public"
                    >
                    </BFormCheckbox>
                  </BFormGroup>
                </b-col>
                <b-col cols="1" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('API users?')"
                    label-for="member_has_api_users"
                  >
                    <BFormCheckbox
                      id="member_has_api_users"
                      v-model="member.has_api_users"
                    >
                    </BFormCheckbox>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Mobile activity users select?')"
                    label-for="member_has_mobile_activity_user_select"
                  >
                    <BFormCheckbox
                      id="member_has_mobile_activity_user_select"
                      v-model="member.has_mobile_activity_user_select"
                    >
                    </BFormCheckbox>
                  </BFormGroup>
                </b-col>
                <b-col cols="2" role="group">
                  <BFormGroup
                    label-size="sm"
                    :label="$trans('Equipment QR code type')"
                    label-for="member_equipment_qr_type"
                  >
                    <BFormSelect v-model="member.equipment_qr_type" id="member_equipment_qr_type" :options="equipmentQrTypes" size="sm"></BFormSelect>
                  </BFormGroup>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="contacts" textarea />
                </b-col>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="activities" textarea />
                </b-col>
                <b-col cols="4" role="group">
                  <ValidatedFormField name="info" textarea />
                </b-col>
              </b-row>
              <MemberLogoFields
                v-model:company-logo="member.companylogo"
                v-model:workorder-logo="member.companylogo_workorder"
                :current-company-logo="record?.companylogo"
                :current-workorder-logo="record?.companylogo_workorder"
                :required="isCreate"
                :invalid="submitClicked && !!errors.companylogo"
              />

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
          </ValidatedForm>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { vEquipmentQrTypeEnum, vMemberTypeEnum } from '@/api/valibot.gen'
import { memberContractListOptions } from '@/api/@tanstack/vue-query.gen'
import { memberMember } from '@/api/resources.gen'
import type { Member, MemberRequest } from '@/api/types.gen'
import MemberLogoFields from './MemberLogoFields.vue'
import {
  ValidatedForm,
  ValidatedFormField,
  useResourceForm,
  useRoutePk,
  useQueryErrorToast,
  mergeTakenVerdict,
} from '@/features/forms'
import {
  COMPANYCODE_TAKEN_MESSAGE,
  emptyMember,
  FIELD_LABELS,
  memberFromRecord,
  parseMemberForm,
  validateMemberForm,
  type MemberFieldErrors,
} from './schemas'
import { useCompanyCodeProbe, type UseCompanyCodeProbeReturn } from './use-company-code-probe'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

const props = withDefaults(defineProps<{
  pk?: string | number | null
  isRequest?: boolean
}>(), {
  pk: null,
  isRequest: false,
})

const authStore = useAuthStore()
const mainStore = useMainStore()

const {isCreate} = useRoutePk(() => props.pk)

// The contract dropdown must offer every contract, not the first page of them.
// 1000 is the API's own ceiling: `My24Pagination.max_page_size` (my24service
// `source/apps/core/rest.py:236`), which DRF clamps a larger value down to
// rather than rejecting it, so this is the most one response can carry.

const contractsQuery = useQuery(
  memberContractListOptions({query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
)

useQueryErrorToast(contractsQuery.error, $trans('Error loading contracts'))

const contracts = computed(() =>
  (contractsQuery.data.value?.results ?? []).map((contract) => ({
    value: contract.id,
    text: contract.name,
  })),
)

const originalCompanycode = ref<string | null>(null)

// Filled after the kit: `validate` only runs on submit, by which time the
// probe exists. A holder (not the kit itself) so the closure compiles without
// referencing the kit inside its own initializer.
const probeRef = {} as {current: UseCompanyCodeProbeReturn}

function saveErrorReason(error: unknown, fallback: string): string {
  const data = (error as {response?: {data?: unknown}} | null)?.response?.data
  if (typeof data === 'string' && data !== '') return data
  if (data && typeof data === 'object') {
    const parts = Object.entries(data as Record<string, unknown>).map(([field, messages]) =>
      Array.isArray(messages) ? `${field}: ${messages.join(' ')}` : `${field}: ${String(messages)}`)
    if (parts.length > 0) return parts.join('; ')
  }
  return fallback
}

const {
  values: member,
  errors,
  submitClicked,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
  record,
} = useResourceForm<MemberRequest, Member, ReturnType<typeof parseMemberForm>, MemberFieldErrors>({
  pk: () => props.pk,
  resource: memberMember,
  empty: emptyMember,
  fromRecord: memberFromRecord,
  validate: async (values) => {
    const found = validateMemberForm(values, {requireLogo: isCreate.value})
    if (Object.keys(found).length > 0) return found

    await probeRef.current.waitForProbe()

    mergeTakenVerdict(found, {
      probe: probeRef.current,
      read: () => values.companycode,
      original: originalCompanycode,
      field: 'companycode',
      message: COMPANYCODE_TAKEN_MESSAGE,
    })
    return found
  },
  parse: parseMemberForm,
  copy: {
    fetchError: $trans('Error fetching member'),
    created: $trans(props.isRequest ? 'Requested' : 'Created'),
    createdDetail: $trans(props.isRequest ? 'Request has been created' : 'Member has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Member has been updated'),
    createError: $trans('Error creating member'),
    updateError: $trans('Error updating member'),
  },
  reasonOf: saveErrorReason,
  // The request-mode deviations, on the create only: a signup pins the flags
  // the form hides and derives the QR type from the branches tick.
  createVars: (body) => ({
    body: props.isRequest
      ? {
          ...body,
          equipment_qr_type: body.has_branches ? 'shltr' : 'my24service',
          has_api_users: false,
          is_requested: true,
          is_public: true,
          is_deleted: false,
        }
      : body,
  }),
})

const probe = useCompanyCodeProbe(
  () => member.value.companycode,
  originalCompanycode,
)
probeRef.current = probe

watch(
  () => record.value,
  (data) => {
    if (!data) return
    originalCompanycode.value = data.companycode
  },
  {immediate: true},
)

watch(
  contracts,
  (choices) => {
    if (isCreate.value && member.value.contract === null && choices.length > 0) {
      member.value.contract = choices[0].value
    }
  },
  {immediate: true},
)

const countries = computed(() => mainStore.getCountries)
const memberTypes = vMemberTypeEnum.options.map((value) => ({value, text: value}))
const EQUIPMENT_QR_LABELS = {none: 'none', my24service: 'My24Service', shltr: 'SHLTR'}
const equipmentQrTypes = vEquipmentQrTypeEnum.options.map((value) => ({
  value,
  text: $trans(EQUIPMENT_QR_LABELS[value] ?? value),
}))
const isDeletedOptions = [
  {value: true, text: $trans('Is deleted')},
  {value: false, text: $trans('Not deleted')},
]
const isRequestedOptions = [
  {value: true, text: $trans('Is requested')},
  {value: false, text: $trans('Is accepted')},
]

// The Branches? checkbox is rendered once, in the identity row, which shows it
// in every mode; the flags row below used to repeat it for the superuser
// screens under a second id.
const showRequestedList = computed(() =>
  authStore.isSuperuser && (record.value?.is_requested ?? false))
const showDeletedList = computed(() =>
  authStore.isSuperuser && (record.value?.is_deleted ?? false))

const companyCodeTakenVisible = computed(() =>
  probe.state.value === 'taken' && !errors.value.companycode)

const companyCodeValidationState = probe.validationState

const isLoading = computed(() =>
  baseIsLoading.value ||
  contractsQuery.isLoading.value,
)
</script>
