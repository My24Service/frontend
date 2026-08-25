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
          <b-form>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Name')"
                  label-for="member_name"
                >
                  <BFormInput
                    v-model="member.name"
                    id="member_name"
                    size="sm"
                    :state="isSubmitClicked ? !errors.name : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_name-feedback"
                    :state="isSubmitClicked ? !errors.name : null">
                    {{ errors.name || $trans('Please enter a name') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
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
                    {{ $trans('Company code is already in use') }}
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
              <b-col cols="1" role="group" v-if="isRequest || (!showRequestedList && !showDeletedList)">
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
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Address')"
                  label-for="member_address"
                >
                  <BFormInput
                    id="member_address"
                    size="sm"
                    v-model="member.address"
                    :state="isSubmitClicked ? !errors.address : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_address-feedback"
                    :state="isSubmitClicked ? !errors.address : null">
                    {{ errors.address || $trans('Please enter an address') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Postal')"
                  label-for="member_postal"
                >
                  <BFormInput
                    id="member_postal"
                    size="sm"
                    v-model="member.postal"
                    :state="isSubmitClicked ? !errors.postal : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_postal-feedback"
                    :state="isSubmitClicked ? !errors.postal : null">
                    {{ errors.postal || $trans('Please enter a postal') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('City')"
                  label-for="member_city"
                >
                  <BFormInput
                    id="member_city"
                    size="sm"
                    v-model="member.city"
                    :state="isSubmitClicked ? !errors.city : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_city-feedback"
                    :state="isSubmitClicked ? !errors.city : null">
                    {{ errors.city || $trans('Please enter a city') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
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
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Chamber of commerce')"
                  label-for="member_chamber_of_commerce"
                >
                  <BFormInput
                    id="member_chamber_of_commerce"
                    size="sm"
                    v-model="member.chamber_of_commerce"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('VAT number')"
                  label-for="member_vat_number"
                >
                  <BFormInput
                    id="member_vat_number"
                    size="sm"
                    v-model="member.vat_number"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Tel.')"
                  label-for="member_tel"
                >
                  <BFormInput
                    id="member_tel"
                    size="sm"
                    v-model="member.tel"
                    :state="isSubmitClicked ? !errors.tel : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_tel-feedback"
                    :state="isSubmitClicked ? !errors.tel : null">
                    {{ errors.tel || $trans('Please enter a number') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Email')"
                  label-for="member_email"
                >
                  <BFormInput
                    id="member_email"
                    size="sm"
                    v-model="member.email"
                    :state="isSubmitClicked ? !errors.email : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_email-feedback"
                    :state="isSubmitClicked ? !errors.email : null">
                    {{ errors.email || $trans('Please enter a valid email') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Website (http://...)')"
                  label-for="member_www"
                >
                  <BFormInput
                    id="member_www"
                    size="sm"
                    v-model="member.www"
                    :state="isSubmitClicked ? !errors.www : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    id="member_www-feedback"
                    :state="isSubmitClicked ? !errors.www : null">
                    {{ errors.www || $trans('Please enter a website') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
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
              <b-col cols="1" role="group" v-if="showRequestedList || showDeletedList">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Branches?')"
                  label-for="member_has_branches_extra"
                >
                  <BFormCheckbox
                    id="member_has_branches_extra"
                    v-model="member.has_branches"
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
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Contacts')"
                  label-for="member_contacts"
                >
                  <BFormTextarea
                    id="member_contacts"
                    v-model="member.contacts"
                    rows="5"
                    :state="isSubmitClicked ? !errors.contacts : null"
                  ></BFormTextarea>
                  <b-form-invalid-feedback
                    id="member_contacts-feedback"
                    :state="isSubmitClicked ? !errors.contacts : null">
                    {{ errors.contacts || $trans('Please enter some contacts') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Activities')"
                  label-for="member_activities"
                >
                  <BFormTextarea
                    id="member_activities"
                    v-model="member.activities"
                    rows="5"
                    :state="isSubmitClicked ? !errors.activities : null"
                  ></BFormTextarea>
                  <b-form-invalid-feedback
                    id="member_activities-feedback"
                    :state="isSubmitClicked ? !errors.activities : null">
                    {{ errors.activities || $trans('Please enter some activities') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Info')"
                  label-for="member_info"
                >
                  <BFormTextarea
                    id="member_info"
                    v-model="member.info"
                    rows="5"
                    :state="isSubmitClicked ? !errors.info : null"
                  ></BFormTextarea>
                  <b-form-invalid-feedback
                    id="member_info-feedback"
                    :state="isSubmitClicked ? !errors.info : null">
                    {{ errors.info || $trans('Please enter some info') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Company logo')"
                  label-for="member_companylogo"
                  :description="`${$trans('Accepted file formats')}: ${ALLOWED_EXTENSIONS.join(', ')}`"
                >
                  <b-form-file
                    id="member_companylogo"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here...')"
                    @change="companyLogoSelected"
                  ></b-form-file>
                  <b-form-invalid-feedback
                    id="member_companylogo-feedback"
                    :state="isSubmitClicked && errors.companylogo ? false : null">
                    {{ $trans('Please upload a company logo') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Current image') }}</h3>
                <img width="200px" :src="currentImage" alt=""/>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Upload preview') }}</h3>
                <img width="200px" :src="uploadPreview" alt=""/>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4">
                <BFormGroup
                  label-size="sm"
                  :label="$trans('Optional logo for on the workorder')"
                  label-for="member_companylogo_workorder"
                >
                  <b-form-file
                    id="member_companylogo_workorder"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here...')"
                    @change="workorderLogoSelected"
                  ></b-form-file>
                </BFormGroup>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Current image') }}</h3>
                <img width="200px" :src="currentWorkorderImage" alt=""/>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Upload preview') }}</h3>
                <img width="200px" :src="uploadPreviewWorkorder" alt=""/>
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
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  memberCompanycodeExistsRetrieve,
} from '@/api/sdk.gen'
import { vEquipmentQrTypeEnum } from '@/api/valibot.gen'
import {
  memberContractListOptions,
  memberMemberCreateMutation,
  memberMemberPartialUpdateMutation,
  memberMemberRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import {
  COMPANYCODE_DEBOUNCE_MS,
  COMPANYCODE_TAKEN_MESSAGE,
  emptyMember,
  memberFromRecord,
  parseMemberForm,
  validateMemberForm,
  type MemberFieldErrors,
  type MemberFormValues,
} from './schemas'
import { invalidateMemberListQueries } from './list-invalidation'
import { NO_IMAGE_URL } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import { useMainStore } from '@/stores/main'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Member create/edit form (#325) — the Slice's largest screen.
 *
 * Reads go through the generated query options (the record under edit, the
 * contract dropdown); writes go through the generated mutations and
 * invalidate the member-list queries, so the list shows the saved change when
 * the user comes back even inside vue-query's stale window.
 *
 * Validation parses the form against the generated request schema
 * (`./schemas.ts`) — the same schema the network seam holds request bodies
 * to. The parsed output is exactly what goes on the wire, which is why the
 * saved bodies carry only the fields the API declares: the readonly response
 * fields the old model round-tripped (`id`, `contract_text`, the logo URLs)
 * never leave this component.
 *
 * One deliberate divergence from the sibling forms: they toast from the
 * mutations' `onError`, this one reports from `submitForm`'s catch instead,
 * because "a failed save says what went wrong" needs the API's response body
 * (`saveErrorReason` below) and the same handler already knows create from
 * edit.
 *
 * Logos are strings, not multipart: the request schema declares them
 * `nullish(string)` and the backend stores base64 data URLs, which is what
 * FileReader hands over. The stored logos of the record under edit are
 * display-only — they are shown from their `_url` fields and never ride back
 * out; only a newly chosen file adds a `companylogo*` key to the body.
 */

const props = defineProps({
  pk: {
    type: [String, Number],
    default: null,
  },
  // The staff "request a new member" flow: five fields are fixed at submit,
  // whatever the form showed.
  isRequest: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const queryClient = useQueryClient()
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create} = useToast()

const isCreate = computed(() => !props.pk)
// Route params arrive as strings; the generated operations want the number.
const memberId = computed(() => Number(props.pk))

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg']

// reads -----------------------------------------------------------------

const contractsQuery = useQuery(memberContractListOptions({query: {page: 1}}))

watch(
  () => contractsQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading contracts'))
  },
)

const contracts = computed(() =>
  (contractsQuery.data.value?.results ?? []).map((contract) => ({
    value: contract.id,
    text: contract.name,
  })),
)

const detailQuery = useQuery({
  ...memberMemberRetrieveOptions({path: {id: memberId.value}}),
  // A create form has no record to fetch; without this the retrieve fires
  // against `undefined`.
  enabled: !isCreate.value,
})

watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error fetching member'))
  },
)

// form state ------------------------------------------------------------

const member = ref<MemberFormValues>(emptyMember())

/** What the record under edit owns; a changed code is what gets probed. */
const originalCompanycode = ref<string | null>(null)

// An edit fills itself once the record arrives. originalCompanycode is set
// first so the probe watcher below sees the seeded code as unchanged and
// stays quiet. Stored logos are deliberately not copied across: they are
// display-only, and only a newly chosen file may put one on the wire.
watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    originalCompanycode.value = data.companycode
    member.value = memberFromRecord(data)
  },
  {immediate: true},
)

// Default a new member to the first contract offered — guarded, because a
// tenant with no contracts has no first offer.
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
const memberTypes = [
  {value: 'temps', text: 'temps'},
  {value: 'maintenance', text: 'maintenance'},
]
// Labels as the legacy screen translated them; the values come from the
// schema's own enum, so a new backend value cannot be missed.
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

// Only a superuser may flip a requested or deleted member's status, and only
// while editing one that already is.
const showRequestedList = computed(() =>
  authStore.isSuperuser && (detailQuery.data.value?.is_requested ?? false))
const showDeletedList = computed(() =>
  authStore.isSuperuser && (detailQuery.data.value?.is_deleted ?? false))

// validation state -----------------------------------------------------

const errors = ref<MemberFieldErrors>({})
const submitClicked = ref(false)
const isSubmitClicked = computed(() => submitClicked.value)
const saving = ref(false)

// logos -----------------------------------------------------------------

const uploadPreview = ref(NO_IMAGE_URL)
const uploadPreviewWorkorder = ref(NO_IMAGE_URL)

const currentImage = computed(() => detailQuery.data.value?.companylogo_url || NO_IMAGE_URL)
const currentWorkorderImage = computed(() =>
  detailQuery.data.value?.companylogo_workorder_url || NO_IMAGE_URL)

function extensionOf(filename: string): string {
  const parts = filename.split('.')
  return parts[parts.length - 1].toLowerCase()
}

/** The chosen file, wherever b-form-file put it.
 *
 * The component re-emits `change` with a synthesized event that carries the
 * `FileList` on the event itself (its `target` is null by then); a plain
 * native event keeps them under `target`. Both are read here, which is also
 * what the legacy screen's `event.files[0]` leaned on.
 */
function chosenFile(event: Event | {files?: FileList, detail?: {files?: FileList}} | null | undefined): File | undefined {
  const shaped = event as {files?: FileList, detail?: {files?: FileList}, target?: EventTarget | null}
  const source = shaped?.files ?? shaped?.detail?.files ?? (shaped?.target as HTMLInputElement | null)?.files
  return source?.[0]
}

/** Read a chosen image file into its preview and its payload slot. */
function readLogo(event: Event, onLoaded: (dataUrl: string) => void) {
  const file = chosenFile(event)
  if (!file) return

  const reader = new FileReader()
  reader.onload = (f) => onLoaded((f.target as FileReader).result as string)
  reader.readAsDataURL(file)
}

function companyLogoSelected(event: Event) {
  const file = chosenFile(event)
  if (!file) return

  // The extension guard is on the company logo only, as the legacy screen had
  // it, and it bails before the reader runs.
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) return

  readLogo(event, (dataUrl) => {
    uploadPreview.value = dataUrl
    member.value.companylogo = dataUrl
  })
}

function workorderLogoSelected(event: Event) {
  readLogo(event, (dataUrl) => {
    uploadPreviewWorkorder.value = dataUrl
    member.value.companylogo_workorder = dataUrl
  })
}

/**
 * The company-code availability probe — **the worked example of the raw-SDK
 * exception**, as #325 puts it against ADR-0002's letter.
 *
 * Reads a component displays go through the query layer and writes go through
 * mutations. This call is the declared exception: its verdict shows nowhere
 * but this field's own state, and caching it would be worse than useless —
 * availability is only meaningful for the exact keystrokes that triggered it,
 * and a cached "available" from thirty seconds ago would wave through a code
 * another admin took meanwhile. So it calls the generated SDK function
 * directly: one request, one answer, nothing stored.
 *
 * It is debounced rather than fired per keystroke — the legacy screen asked
 * once per character, twelve requests for a thirteen-character code — because
 * the ticket asks for a check that does not fire on every keystroke. Every
 * keystroke resets the timer; only a pause sends anything. An in-flight save
 * waits out the pending probe rather than racing it, and a probe for an
 * abandoned value never overwrites the verdict for the current one.
 */
const companyCodeState = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
let pendingProbe: Promise<void> = Promise.resolve()

/** Whether this code owes the backend a verdict at all. */
function shouldProbe(value: string): boolean {
  return value.length >= 2 && value !== originalCompanycode.value
}

// The code as of half a second after typing stopped — the only moment at
// which asking is worth anything. The debouncer lives in this component's
// scope, so an unmounted form takes its pending timer with it.
const companycodeAtRest = refDebounced(
  computed(() => member.value.companycode),
  COMPANYCODE_DEBOUNCE_MS,
)

// Scheduling is immediate even though asking is not: the moment a code owes
// a verdict, the save also owes a barrier to wait behind — `pendingProbe`
// must exist before the debounce fires, or a fast Submit would race it.
let settleLatestProbe = () => {}

watch(
  () => member.value.companycode,
  (value) => {
    if (!shouldProbe(value)) {
      companyCodeState.value = 'idle'
      pendingProbe = Promise.resolve()
      return
    }

    companyCodeState.value = 'checking'
    pendingProbe = new Promise<void>((resolve) => {
      settleLatestProbe = resolve
    })
  },
)

// A probe for an abandoned value never overwrites the verdict for the
// current one: only an answer for the code still in the field may speak.
watch(companycodeAtRest, async (value) => {
  if (!shouldProbe(value)) return

  try {
    const {data, error} = await memberCompanycodeExistsRetrieve({
      query: {companycode: value},
    })
    if (!error && data && value === member.value.companycode) {
      companyCodeState.value = data.available ? 'available' : 'taken'
    }
  } catch {
    // A failed probe says nothing about availability; the backend
    // re-validates uniqueness on save regardless.
    if (value === member.value.companycode) companyCodeState.value = 'idle'
  } finally {
    settleLatestProbe()
  }
})

const companyCodeTakenVisible = computed(() =>
  companyCodeState.value === 'taken' && !errors.value.companycode)

/** The probe's verdict, as the input's validation colour: taken is red,
 *  available green, and while checking or idle nothing is claimed yet. */
const companyCodeValidationState = computed(() => {
  if (companyCodeState.value === 'taken') return false
  if (companyCodeState.value === 'available') return true
  return undefined
})

// writes ----------------------------------------------------------------

const saveMutation = useMutation({
  ...memberMemberCreateMutation(),
  onSuccess: async () => {
    infoToast(
      create,
      $trans(props.isRequest ? 'Requested' : 'Created'),
      $trans(props.isRequest ? 'Request has been created' : 'Member has been created'),
    )
    await invalidateMemberListQueries(queryClient)
    router.go(-1)
  },
})

const updateMutation = useMutation({
  ...memberMemberPartialUpdateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Updated'), $trans('Member has been updated'))
    await invalidateMemberListQueries(queryClient)
    router.go(-1)
  },
})

const isLoading = computed(() =>
  contractsQuery.isLoading.value ||
  detailQuery.isLoading.value ||
  saveMutation.isPending.value ||
  updateMutation.isPending.value,
)
const buttonDisabled = computed(() =>
  saveMutation.isPending.value || updateMutation.isPending.value || saving.value)

// validation ------------------------------------------------------------

/**
 * What a failed save told the user: the API's own reason when it gave one —
 * DRF's field errors joined into readable lines — or the plain failure copy
 * when it did not.
 */
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

async function submitForm() {
  if (saving.value) return
  saving.value = true

  try {
    submitClicked.value = true

    const found = validateMemberForm(member.value, {requireLogo: isCreate.value})
    errors.value = found
    if (Object.keys(found).length > 0) return

    // A save inside the debounce window waits for the pending probe's
    // verdict rather than submitting an availability question unasked.
    await pendingProbe

    if (member.value.companycode !== originalCompanycode.value && companyCodeState.value === 'taken') {
      errors.value.companycode = COMPANYCODE_TAKEN_MESSAGE()
      return
    }

    // The parsed output is the body — typed by the request schema and stripped
    // of anything it does not declare.
    const body = parseMemberForm(member.value)

    try {
      if (isCreate.value) {
        if (props.isRequest) {
          Object.assign(body, {
            equipment_qr_type: member.value.has_branches ? 'shltr' : 'my24service',
            has_api_users: false,
            is_requested: true,
            is_public: true,
            is_deleted: false,
          })
        }
        await saveMutation.mutateAsync({body})
      } else {
        await updateMutation.mutateAsync({path: {id: memberId.value}, body})
      }
    } catch (error) {
      errorToast(
        create,
        saveErrorReason(
          error,
          isCreate.value ? $trans('Error creating member') : $trans('Error updating member'),
        ),
        $trans(isCreate.value ? 'Error creating member' : 'Error updating member'),
      )
    }
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  router.go(-1)
}
</script>

<style scoped>
</style>
