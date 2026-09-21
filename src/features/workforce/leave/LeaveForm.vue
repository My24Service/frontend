<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
  >
    <div
      v-if="isCreate || record"
      class="app-page"
    >
      <header>
        <div class="page-title">
          <h3>
            <IBiFileEarmarkCheckFill />
            <router-link :to="{name: 'leave-list'}">{{ $trans('Leave') }}</router-link>
            /
            <span class="dimmed">
              <span v-if="isCreate">{{ $trans('new') }}</span>
              <span v-else>{{ $trans('edit') }}</span>
            </span>
          </h3>
          <div class="flex-columns">
            <BButton
              type="button"
              variant="secondary"
              @click="form.cancelForm"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="form.submitForm"
            >
              {{ $trans('Submit') }}
            </BButton>
          </div>
        </div>
      </header>

      <div class="page-detail flex-columns">
        <div class="panel">
          <h6>{{ $trans('Request leave') }}</h6>

          <BFormGroup
            v-if="isCreate"
            label-size="sm"
            label-class="p-sm-0"
            :label="$trans('Search existing user')"
            label-for="user-search"
          >
            <VueMultiselect
              id="user-search"
              track-by="id"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="options"
              :multiple="false"
              :loading="searching"
              :internal-search="false"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :hide-selected="true"
              :custom-label="userLabel"
              @search-change="onSearch"
              @select="selectUser"
            >
              <template #noResult>{{ $trans('Nothing found.') }}</template>
            </VueMultiselect>
          </BFormGroup>

          <BFormGroup
            v-if="isCreate"
            :label="$trans('User')"
            label-for="user_name"
          >
            <BFormInput
              id="user_name"
              v-model="userName"
              placeholder="User"
              readonly
              :state="submitClicked ? !errors.user : null"
            />
            <b-form-invalid-feedback :state="submitClicked ? !errors.user : null">
              {{ errors.user }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <BFormGroup
            :label="$trans('Leave type')"
            label-for="leave_type"
            label-cols="3"
          >
            <BFormSelect
              id="leave_type"
              v-model="values.leave_type"
              :options="leaveTypes"
              value-field="id"
              text-field="name"
              :state="submitClicked ? !errors.leave_type : null"
            />
            <b-form-invalid-feedback :state="submitClicked ? !errors.leave_type : null">
              {{ errors.leave_type }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <BFormGroup
            label-cols="3"
            :label="$trans('Description')"
            label-for="leave_description"
          >
            <BFormTextarea
              id="leave_description"
              v-model="values.description"
              rows="3"
            />
          </BFormGroup>

          <div class="flex-columns">
            <BFormGroup
              :label="$trans('Start date')"
              label-for="start_date"
            >
              <VueDatePicker
                id="start_date"
                v-model="values.start_date"
                :placeholder="$trans('Select date')"
                :locale="nl"
                auto-apply
                arrow-navigation
                :formats="{input: 'dd/MM/yyyy'}"
                :state="submitClicked ? !errors.start_date : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.start_date : null">
                {{ errors.start_date }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup :label="$trans('Whole day')">
              <BFormCheckbox
                id="leave_start_date_is_whole_day"
                v-model="values.start_date_is_whole_day"
                name="leave_start_date_is_whole_day"
              />
            </BFormGroup>
            <!-- The legacy time picker beside this input was a bootstrap-vue 2
                 component that does not exist here: it rendered nothing and was
                 bound to nothing. The text input is the whole control. -->
            <BFormGroup
              v-if="!values.start_date_is_whole_day"
              :label="$trans('Start time')"
              label-for="start_time"
            >
              <BFormInput
                id="start_time"
                v-model="values.start_time"
                type="text"
                placeholder="HH:mm"
                :state="submitClicked ? !errors.start_time : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.start_time : null">
                {{ errors.start_time }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>

          <div class="flex-columns">
            <BFormGroup
              :label="$trans('End date')"
              label-for="end_date"
            >
              <VueDatePicker
                id="end_date"
                v-model="values.end_date"
                :placeholder="$trans('Select date')"
                :locale="nl"
                auto-apply
                arrow-navigation
                :formats="{input: 'dd/MM/yyyy'}"
                :state="submitClicked ? !errors.end_date : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.end_date : null">
                {{ errors.end_date }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup :label="$trans('Whole day')">
              <BFormCheckbox
                id="leave_end_date_is_whole_day"
                v-model="values.end_date_is_whole_day"
                name="leave_end_date_is_whole_day"
              />
            </BFormGroup>
            <BFormGroup
              v-if="!values.end_date_is_whole_day"
              :label="$trans('End time')"
              label-for="end_time"
            >
              <BFormInput
                id="end_time"
                v-model="values.end_time"
                type="text"
                placeholder="HH:mm"
                :state="submitClicked ? !errors.end_time : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.end_time : null">
                {{ errors.end_time }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </div>

          <b-overlay :show="probing" rounded="sm">
            <div class="flex-columns">
              <BFormGroup
                label-class=""
                :label="$trans('Total time')"
                label-for="total_time"
              >
                <BFormInput
                  id="total_time"
                  v-model="values.total_time"
                  placeholder="Total time"
                  readonly
                />
              </BFormGroup>
            </div>
          </b-overlay>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import moment from 'moment'
import { nl } from 'date-fns/locale'
import VueMultiselect from 'vue-multiselect'
import IBiFileEarmarkCheckFill from '~icons/bi/file-earmark-check-fill'
import { companyLeaveTypeListOptions } from '@/api/@tanstack/vue-query.gen'
import { companyUserLeaveHoursAdminGetTotalsCreate } from '@/api/sdk.gen'
import type { LeaveHoursTotals, UserLeaveHours, UserSelectRow } from '@/api/types.gen'
import { companyUserLeaveHoursAdmin } from '@/api/resources.gen'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import { useQueryErrorToast } from '@/features/forms'
import { useResourceForm } from '@/features/forms'
import { $trans } from '@/services/i18n'
import { useUserSearch } from '../use-user-search'
import {
  FIELD_LABELS,
  emptyLeave,
  humanizeDuration,
  leaveFromRecord,
  leaveProbeBody,
  parseLeave,
  validateLeave,
  type LeaveFieldErrors,
  type LeaveFormValues,
} from './schemas'

/**
 * The leave create/edit form.
 *
 * Three reads stand beside the record: the leave types the picker offers (the
 * whole collection - a dropdown cannot page), the user search (create only, the
 * tenant-wide people search), and the totals probe, which re-runs whenever the
 * window changes. The probe's answer is display-only state derived from unsaved
 * values, so it calls the generated op directly rather than through a query -
 * there is no query key to cache a POST under. The ledger records it.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const {create: toast} = useToast()
void toast

const today = moment().format('YYYY-MM-DD')
const now = moment().format('HH:mm')

const leaveTypesQuery = useQuery(() => companyLeaveTypeListOptions({
  query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
}))
useQueryErrorToast(leaveTypesQuery.error, $trans('Error loading leave types'))
const leaveTypes = computed(() => leaveTypesQuery.data.value?.results ?? [])

const {term, options, loading: searching} = useUserSearch()

const form = useResourceForm<LeaveFormValues, UserLeaveHours, unknown, LeaveFieldErrors>({
  pk: () => props.pk,
  resource: companyUserLeaveHoursAdmin,
  empty: () => emptyLeave(today, now),
  fromRecord: leaveFromRecord,
  validate: validateLeave,
  parse: parseLeave,
  copy: {
    fetchError: $trans('Error loading leave'),
    created: $trans('Created'),
    createdDetail: $trans('Leave has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Leave has been updated'),
    createError: $trans('Error creating leave'),
    updateError: $trans('Error updating leave'),
  },
})

const {values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record} = form

/** The chosen user's name; the wire carries the id. */
const userName = ref('')

watch(record, (data) => {
  if (data) userName.value = data.full_name
}, {immediate: true})

function userLabel(option: UserSelectRow): string {
  return option.name
}

function onSearch(value: string) {
  term.value = value
}

function selectUser(option: UserSelectRow) {
  values.value.user = option.id
  userName.value = option.name
}

// ---------------------------------------------------------------------------
// The totals probe

const probing = ref(false)

/**
 * Ask the endpoint what the window adds up to and print its answer. Fired on
 * mount and whenever the window changes - the legacy probe fired from a date
 * widget's `input` event and from the two time inputs, so a changed whole-day
 * flag or a newly picked leave type left the number stale.
 */
async function probeTotals(): Promise<void> {
  probing.value = true
  try {
    const {data, error} = await companyUserLeaveHoursAdminGetTotalsCreate({
      body: leaveProbeBody(values.value),
    })
    if (error || !data) throw new Error('leave totals probe failed')
    const totals = (data as LeaveHoursTotals).result
    values.value.total_time = humanizeDuration(totals.total_hours, totals.total_minutes)
  } catch {
    // The totals are a preview: a tenant whose settings refuse the window
    // leaves the box as it was, and the save reports anything that matters.
  } finally {
    probing.value = false
  }
}

watch(
  () => [
    values.value.start_date,
    values.value.end_date,
    values.value.start_date_is_whole_day,
    values.value.end_date_is_whole_day,
    values.value.start_time,
    values.value.end_time,
    values.value.leave_type,
  ],
  () => { void probeTotals() },
  {immediate: true},
)
</script>
