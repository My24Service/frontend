<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiPersonSquare />{{ $trans('Partners') }}</h3>
      </div>
    </header>

    <b-form class="page-detail">
      <div class="flex-columns">
        <div class="col-1-3" />
        <div class="panel col-1-3">
          <h6>{{ $trans('New partner request') }}</h6>
          <br>
          <BFormGroup
            label-size="sm"
            label-class="p-sm-0"
            label-for="partner_request_member_search"
            :label="$trans('Send partner request to')"
          >
            <VueMultiselect
              id="partner_request_member_search"
              track-by="id"
              :placeholder="`${$trans('Member')} ${$trans('(type to search)')}`"
              open-direction="bottom"
              :options="members"
              :multiple="false"
              :loading="isSearching"
              :internal-search="false"
              :clear-on-select="true"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="true"
              :hide-selected="true"
              :custom-label="memberLabel"
              @search-change="searchTerm = $event"
              @select="selectMember"
            >
              <template #noResult>
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </template>
            </VueMultiselect>
          </BFormGroup>

          <BFormGroup
            v-if="memberInfo"
            label-size="sm"
            label-for="partner_request_company_info"
          >
            <BFormInput
              id="partner_request_company_info"
              v-model="memberInfo"
              size="sm"
              readonly
              :state="submitClicked ? !errors.to_member : null"
            />
            <b-form-invalid-feedback :state="submitClicked ? !errors.to_member : null">
              {{ errors.to_member }}
            </b-form-invalid-feedback>
          </BFormGroup>
          <BButton-toolbar
            v-if="memberInfo"
            class="flex-columns"
          >
            <div />
            <BButton
              type="button"
              variant="secondary"
              @click="cancelForm"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="submitForm"
            >
              {{ $trans('Submit') }}
            </BButton>
          </BButton-toolbar>
        </div>

        <div class="col-1-3" />
      </div>
    </b-form>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'
import {
  companyPartnerRequestCreateMutation,
  memberMemberGetForPartnerSelectListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PartnerSelect } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { invalidatePartnerRequestSentList } from './invalidation'
import {
  emptyPartnerRequest,
  parsePartnerRequest,
  validatePartnerRequest,
  type PartnerRequestFormErrors,
} from './schemas'

/**
 * The new partner request form: pick a member, confirm the choice, send.
 *
 * One generated read (the member picker, narrowed server-side per keystroke)
 * and one generated write. The picked id is the only state; the info line
 * echoes the choice. The member search already ran on the generated client
 * in the legacy screen; the write is what moves over here.
 */
const router = useRouter()
const queryClient = useQueryClient()
const { create: toast } = useToast()

const values = ref(emptyPartnerRequest())
const errors = ref<PartnerRequestFormErrors>({})
const submitClicked = ref(false)
const saving = ref(false)
const memberInfo = ref('')
const searchTerm = ref('')

const pickerQuery = useQuery(() => ({
  ...memberMemberGetForPartnerSelectListOptions({ query: { q: searchTerm.value } }),
}))
useQueryErrorToast(pickerQuery.error, $trans('Error fetching members'))

const members = computed(() => pickerQuery.data.value ?? [])
const isSearching = computed(() => pickerQuery.isFetching.value)

const createMutation = useMutation(companyPartnerRequestCreateMutation())
const buttonDisabled = computed(() => saving.value || createMutation.isPending.value)

function memberLabel(member: PartnerSelect): string {
  return `${member.name} - ${member.city ?? ''}`
}

function selectMember(option: PartnerSelect) {
  values.value.to_member = option.id
  memberInfo.value = `${option.name}, ${option.city ?? ''}`
}

async function submitForm() {
  if (saving.value) return
  saving.value = true

  try {
    submitClicked.value = true
    const found = validatePartnerRequest(values.value)
    errors.value = found
    if (Object.keys(found).length > 0) return

    try {
      await createMutation.mutateAsync({ body: parsePartnerRequest(values.value) })
    } catch {
      // The toast below already reported the failure; the form keeps the pick.
      errorToast(toast, $trans('Error sending partner request'))
      return
    }
    infoToast(toast, $trans('Created'), $trans('Partner request has been sent'))
    await invalidatePartnerRequestSentList(queryClient)
    router.go(-1)
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  router.go(-1)
}
</script>
