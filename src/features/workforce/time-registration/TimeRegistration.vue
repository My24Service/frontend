<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill />
          {{ $trans('Time registration') }}
        </h3>
      </div>
    </header>

    <div class="panel">
      <SubNav />

      <div class="app-grid">
        <div class="subnav-pills">
          <b-nav pills>
            <b-nav-item
              v-for="item in MODES"
              :key="item.value"
              :active="item.value === mode"
              @click.prevent="setMode(item.value)"
            >
              {{ item.label() }}
            </b-nav-item>
          </b-nav>
        </div>

        <h3
          v-if="isDetail && fullName"
          align="center"
        >
          {{ fullName }}
        </h3>

        <!-- One window header for all three modes. The legacy screen repeated
             this block three times, once per mode, differing only in the two
             format strings and the two labels. -->
        <BRow align-v="center">
          <BCol cols="2">
            <BLink
              :title="backTitle"
              @click.prevent="step(-1)"
            >
              <IBiArrowLeft font-scale="1.8" />
            </BLink>
          </BCol>
          <BCol
            cols="8"
            class="text-center"
          >
            <h4
              v-if="!isDetail && listTitle"
              align="center"
            >{{ listTitle }} - {{ windowLabel }}</h4>
            <h4
              v-if="isDetail"
              align="center"
            >{{ totalsHeading }} - {{ windowLabel }}</h4>
          </BCol>
          <BCol cols="2">
            <div class="float-end">
              <BLink
                :title="forwardTitle"
                @click.prevent="step(1)"
              >
                <IBiArrowRight font-scale="1.8" />
              </BLink>
            </div>
          </BCol>
        </BRow>

        <BTable
          v-if="!isDetail"
          id="time-registration-table"
          small
          responsive="md"
          class="data-table"
          :fields="fields"
          :items="listRows"
        >
          <template #cell(full_name)="data">
            <router-link
              v-if="data.item.user_id"
              class="px-1"
              :to="{
                name: 'company-time-registration-detail',
                params: {user_id: data.item.user_id},
                query: {date: anchor.format('YYYY-MM-DD'), mode}
              }"
            >
              {{ data.item.full_name }}
            </router-link>
            <span v-else>{{ data.item.full_name }}</span>
          </template>
          <template
            v-for="(dataField, index) in dataFields"
            v-slot:[cellSlot(dataField)]="data"
            :key="dataField"
          >
            <router-link
              v-if="data.item.user_id"
              class="px-1"
              :to="drillLink(data.item.user_id, index)"
            >
              {{ data.item[dataField] }}
            </router-link>
            <span v-else>{{ data.item[dataField] }}</span>
          </template>
        </BTable>

        <BTable
          v-if="isDetail"
          id="time-registration-detail-table"
          small
          responsive="md"
          class="data-table"
          :fields="fields"
          :items="detailRows"
        />

        <div v-if="isDetail && leaveData.length > 0">
          <h4 align="center">{{ $trans('Leave') }}</h4>
          <BTable
            id="leave-hours-table"
            small
            responsive="md"
            class="data-table"
            :fields="leaveFields"
            :items="leaveData"
          />
        </div>

        <div v-if="isDetail">
          <h4 align="center">{{ $trans('Workhours') }}</h4>
          <BTable
            id="workhours-table"
            small
            responsive="md"
            class="data-table"
            :fields="workhourFields"
            :items="workhourData"
          >
            <template #cell(work_times)="{ item }">
              {{ item.work_start }} - {{ item.work_end }}
              <span
                v-if="item.work_correction !== '00:00'"
                style="color:red"
              >{{ item.work_correction }}</span>
            </template>
            <template #cell(work_travel)="{ item }">
              <span
                v-if="item.travel_to === '00:00:00' && item.travel_back === '00:00:00'"
                class="dimmed"
              >&ndash;</span>
              <span v-else>{{ item.travel_to }} / {{ item.travel_back }}</span>
            </template>
            <template #cell(work_distance)="{ item }">
              <span
                v-if="item.distance_to === 0 && item.distance_back === 0"
                class="dimmed"
              >&ndash;</span>
              <span v-else>{{ item.distance_to }} / {{ item.distance_back }}</span>
            </template>
            <template #cell(work_correct)="{ item }">
              <BButton
                v-if="isPlanning"
                variant="outline-primary"
                class="highlight-on-hover-row"
                size="sm"
                @click="editCorrection(item)"
              >
                ±
              </BButton>
            </template>
          </BTable>
        </div>

        <BModal
          id="time-correction-modal"
          ref="time-correction-modal"
          :title="$trans('Work hours correction')"
          @ok="commitCorrection"
        >
          <BContainer fluid>
            <BRow role="group">
              <BCol size="12">
                <p>{{ $trans('Enter a correction value in minutes or in the form hh:mm.') }}</p>
                <!-- The legacy input listened for @xxchange and @update, neither
                     of which BFormInput emits, so a typed correction was never
                     parsed: the preview stayed empty and the value sent was the
                     one the modal opened with. The parse is derived from what
                     the input holds instead, so it cannot drift from it. -->
                <BFormInput
                  v-model="correctionInput"
                  size="sm"
                  autofocus
                  :placeholder="$trans('Enter time value')"
                  style="margin-top:1rem;margin-bottom:1rem;width:10rem;"
                />
                <div class="dimmed">
                  <span>{{ correctionText }}</span>
                </div>
              </BCol>
            </BRow>
          </BContainer>
        </BModal>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment, {
  type Moment,
} from 'moment'
import type { TimeRegistrationLeaveRow, TimeRegistrationWorkhourRow } from '@/api/types.gen'
import {
  companyTimeRegistrationRetrieveOptions,
  companyTimeRegistrationTimeCorrectionPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms'
import SubNav from '../SubNav.vue'
import { invalidateTimeRegistration } from './invalidation'
import {
  detailRows as buildDetailRows,
  dateColumns,
  intervalMoments,
  totalsTitle,
  userRows,
  type PivotField,
  type WindowMode,
} from './pivot'
import { correctionBody, normaliseCorrection, parseCorrection } from './schemas'
import { timeWindowQuery } from './time-window'

/**
 * The time-registration screen: the hours the tenant's people registered, over
 * a week, a month or a year, and - on a user window - that user's worked hours
 * and leave, with the planner's correction on a workhour row.
 *
 * One screen, not the legacy pair. The legacy split it into a panel wrapper
 * that fetched and a 900-line child it pushed the answer into through an
 * exposed `processData`; with the read owned here there is nothing left for
 * the wrapper to do but the header, which is six lines of this template.
 * `pivot.ts` holds the payload-to-rows transforms, which are pure and testable
 * on their own; the route names, the table ids and the cell markup are the
 * legacy screen's.
 */
const props = withDefaults(defineProps<{
  /** The route's `:user_id`. A tenant-wide window has none. */
  user_id?: string | number | null
}>(), {
  user_id: null,
})

const MODES: {value: WindowMode; label: () => string}[] = [
  {value: 'week', label: () => $trans('Per week')},
  {value: 'month', label: () => $trans('Per month')},
  {value: 'year', label: () => $trans('Per year')},
]

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const mainStore = useMainStore()
const authStore = useAuthStore()
const {create: toast} = useToast()

const lang: string = mainStore.getCurrentLanguage || 'nl'
const monday = lang === 'en' ? 1 : 0
moment.locale(lang)

function isWindowMode(value: unknown): value is WindowMode {
  return value === 'week' || value === 'month' || value === 'year'
}

const mode = ref<WindowMode>(isWindowMode(route.query.mode) ? route.query.mode : 'week')
const anchor = ref<Moment>(typeof route.query.date === 'string' && route.query.date
  ? moment(route.query.date)
  : moment().weekday(monday))

const isDetail = computed(() => props.user_id !== null && props.user_id !== undefined && props.user_id !== '')
const isPlanning = computed(() => authStore.isPlanning)

// reads -------------------------------------------------------------------

const registration = useQuery(() => companyTimeRegistrationRetrieveOptions({
  query: timeWindowQuery({
    mode: mode.value,
    anchor: anchor.value.format('YYYY-MM-DD'),
    userId: props.user_id,
  }),
}))

useQueryErrorToast(registration.error, $trans('Error loading time data'))

const payload = registration.data

const fullName = computed(() => payload.value?.full_name ?? null)
const dateList = computed(() => payload.value?.date_list ?? [])
const listTitle = computed(() => (payload.value ? totalsTitle(payload.value.totals_fields) : null))
const workhourData = computed<TimeRegistrationWorkhourRow[]>(() => (isDetail.value ? payload.value?.workhour_data ?? [] : []))
const leaveData = computed<TimeRegistrationLeaveRow[]>(() => (isDetail.value ? payload.value?.leave_data ?? [] : []))
const listRows = computed(() => (!payload.value || isDetail.value ? [] : userRows(payload.value)))
const detailRows = computed(() => (!payload.value || !isDetail.value ? [] : buildDetailRows(payload.value)))
const dataFields = computed(() => dateColumns(dateList.value, mode.value).map((column) => column.key))

const fields = computed<PivotField[]>(() => {
  const columns: PivotField[] = isDetail.value
    ? [{key: 'field', label: $trans('Field')}]
    : [{key: 'full_name', label: $trans('User'), sortable: true}]

  columns.push(...dateColumns(dateList.value, mode.value))
  columns.push({key: 'total', label: $trans('Total'), sortable: true})

  return columns
})

const workhourFields: PivotField[] = [
  {label: $trans('Date'), key: 'date', thClass: 'col-tight'},
  {label: $trans('Source'), key: 'source', thClass: 'col-tight'},
  {key: 'work_times', label: `${$trans('Work start')} - ${$trans('Work end')} ±`, thClass: 'col-wider'},
  {key: 'work_travel', label: `${$trans('Travel to')} / ${$trans('Travel back')}`, thClass: 'col-wide'},
  {key: 'work_distance', label: $trans('Distance to / back'), thClass: 'col-wide'},
  {label: $trans('Project'), key: 'project'},
  {label: $trans('Description'), key: 'description'},
  {key: 'work_correct', label: '', thClass: 'col-tight'},
]

const leaveFields: PivotField[] = [
  {label: $trans('Date'), key: 'date'},
  {label: $trans('Leave hours'), key: 'leave_duration'},
  {label: $trans('Leave type'), key: 'leave_type'},
]

// the window --------------------------------------------------------------

const windowLabel = computed(() => {
  if (mode.value === 'week') return `${anchor.value.format('[week] W')}/${anchor.value.format('Y')}`
  if (mode.value === 'month') return anchor.value.format('MMM YYYY')
  return anchor.value.format('YYYY')
})

const totalsHeading = computed(() => {
  if (mode.value === 'week') return $trans('Week totals')
  if (mode.value === 'month') return $trans('Month totals')
  return $trans('Year totals')
})

const backTitle = computed(() => windowStepTitle(-1))
const forwardTitle = computed(() => windowStepTitle(1))

function windowStepTitle(direction: number): string {
  const word = direction < 0
    ? (mode.value === 'week' ? $trans('Week back') : mode.value === 'month' ? $trans('Month back') : $trans('Year back'))
    : (mode.value === 'week' ? $trans('Next week') : mode.value === 'month' ? $trans('Next month') : $trans('Next year'))
  return word
}

/**
 * Move the window and put it in the address, as the legacy screen did: the
 * window is state the seam can drop, so a reload restores the one that was on
 * screen.
 */
function pushWindow(nextMode: WindowMode) {
  router.push({
    query: {...route.query, date: anchor.value.format('YYYY-MM-DD'), mode: nextMode},
  }).catch(() => {})
}

function setMode(next: WindowMode) {
  if (next === mode.value) return
  mode.value = next
  pushWindow(next)
}

function step(direction: number) {
  if (mode.value === 'week') anchor.value.add(direction * 7, 'days')
  else if (mode.value === 'month') anchor.value.add(direction, 'months')
  else anchor.value.add(direction, 'years')

  pushWindow(mode.value)
}

/** Whether a month or a year window drills down into the next mode along. */
const drillMode = computed<WindowMode>(() => (mode.value === 'year' ? 'month' : 'week'))

function cellSlot(field: string): string {
  return `cell(${field})`
}

function drillLink(userId: string | number, index: number) {
  return {
    name: 'company-time-registration-detail',
    params: {user_id: userId},
    query: {date: intervalMoments(dateList.value)[index].format('YYYY-MM-DD'), mode: drillMode.value},
  }
}

// the correction ----------------------------------------------------------

const correctionModal = useTemplateRef<{show: () => void}>('time-correction-modal')
const entry = ref<TimeRegistrationWorkhourRow | null>(null)
const correctionInput = ref('')
const correction = computed(() => parseCorrection(correctionInput.value))
const correctionText = computed(() => {
  if (correctionInput.value.trim() === '') return ''
  return correction.value?.text ?? $trans('Invalid time')
})

const correctionMutation = useMutation({
  ...companyTimeRegistrationTimeCorrectionPartialUpdateMutation(),
  onSuccess: () => invalidateTimeRegistration(queryClient),
})

function editCorrection(row: TimeRegistrationWorkhourRow) {
  entry.value = row
  correctionInput.value = row.work_correction?.trim() ? row.work_correction : '0'
  correctionModal.value?.show()
}

async function commitCorrection() {
  const row = entry.value
  const parsed = correction.value
  if (!row || !parsed) return
  // Nothing to write when the correction reads the same as the one stored -
  // compared through the same reading, so "00:00" and its "0:00" are one value.
  if (parsed.value === normaliseCorrection(row.work_correction)) return

  try {
    await correctionMutation.mutateAsync({
      path: {id: row.id},
      body: correctionBody(row, parsed, props.user_id),
    })
  } catch {
    errorToast(toast, $trans('Error saving the correction'))
  }
}
</script>

<style scoped>
table#workhours-table thead tr th.col-tight {
  max-width: 5.5rem;
  width: 5rem;
}

table#workhours-table thead tr th.col-wide {
  max-width: 9.5rem;
  width: 9rem;
}

table#workhours-table thead tr th.col-wider {
  max-width: 12.5rem;
  width: 12rem;
}

tr:hover button.highlight-on-hover-row {
  background-color: #ff9933;
}
</style>
