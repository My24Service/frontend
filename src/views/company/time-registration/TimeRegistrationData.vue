<template>
  <div class="app-grid">

    <div class="subnav-pills">
      <BNav pills>
        <BNavItem
          v-for="item in dateQueryMode"
          :active="item.value === activeDateQueryMode"
          :key="item.value"
          @click.prevent="activeDateQueryMode = item.value"
        >
          {{ item.label }}
        </BNavItem>
      </BNav>
    </div>

    <h3 v-if="isDetail && fullName" align="center">{{ fullName }}</h3>

    <BRow align-v="center" v-if="activeDateQueryMode === 'year'">
      <BCol cols="2">
        <BLink @click.prevent="backYear" v-bind:title="$trans('Year back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </BCol>
      <BCol cols="8" class="text-center">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('YYYY') }}</h4>
        <h4 align="center" v-if="isDetail">{{ $trans('Year totals') }} - {{ today.format('YYYY') }}</h4>
      </BCol>
      <BCol cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextYear" v-bind:title="$trans('Next year') ">
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </BCol>
    </BRow>

    <BRow align-v="center" v-if="activeDateQueryMode === 'month'">
      <BCol cols="2">
        <BLink @click.prevent="backMonth" v-bind:title="$trans('Month back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </BCol>
      <BCol cols="8" class="text-center">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('MMM YYYY') }}</h4>
        <h4 align="center" v-if="isDetail">{{ $trans('Month totals') }} - {{ today.format('MMM YYYY') }}</h4>
      </BCol>
      <BCol cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </BCol>
    </BRow>

    <BRow align-v="center" v-if="activeDateQueryMode === 'week'">
      <BCol cols="2">
        <BLink @click.prevent="backWeek" v-bind:title="$trans('Week back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
      </BCol>
      <BCol cols="8">
        <h4 align="center" v-if="!isDetail && listTitle">{{ listTitle }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
        <h4 align="center" v-if="isDetail">{{ $trans('Week totals') }} - {{ today.format('[week] W') }}/{{ today.format('Y') }}</h4>
      </BCol>
      <BCol cols="2">
        <div class="float-right">
          <BLink @click.prevent="nextWeek" v-bind:title="$trans('Next week') ">
            <IBiArrowRight font-scale="1.8"></IBiArrowRight>
          </BLink>
        </div>
      </BCol>
    </BRow>

    <BTable
      id="time-registration-table"
      :small="true"
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
      :sort-by="sortBy"
      v-if="!isDetail"
    >
      <template #cell(full_name)="data">
        <router-link
          class="px-1"
          v-if="data.item.user_id"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: today.format('YYYY-MM-DD'), mode: activeDateQueryMode}}
          ">
          {{ data.item.full_name }}
        </router-link>
        <span v-if="!data.item.user_id">{{ data.item.full_name }}</span>
      </template>
      <template v-slot:[`cell(${dataField})`]="data" v-for="(dataField, index) in dataFields">
        <!-- Some complicated rendering logic here -->
<!--        {{ date_list_moment[index] }} {{ index }}-->
        <router-link
          :key="index"
          v-if="activeDateQueryMode === 'month' && data.item.user_id"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'week'}
          }">
          {{ data.item[dataField] }}
        </router-link>
        <span
          :key="index"
          v-if="activeDateQueryMode === 'month' && !data.item.user_id"
        >
          {{ data.item[dataField] }}
        </span>

        <router-link
          v-if="activeDateQueryMode === 'year' && data.item.user_id"
          :key="index"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'month'}
          }">
          {{ data.item[dataField] }}
        </router-link>
        <span
          :key="index"
          v-if="activeDateQueryMode === 'year' && !data.item.user_id"
        >
          {{ data.item[dataField] }}
        </span>

        <router-link
          v-if="activeDateQueryMode === 'week' && data.item.user_id"
          :key="index"
          class="px-1"
          :to="{
            name: 'company-time-registration-detail',
            params: {user_id: data.item.user_id},
            query: {date: date_list_moment[index].format('YYYY-MM-DD'), mode: 'week'}
          }">
          {{ data.item[dataField] }}
        </router-link>
        <span
          :key="index"
          v-if="activeDateQueryMode === 'week' && !data.item.user_id"
        >
          {{ data.item[dataField] }}
        </span>
      </template>
    </BTable>

    <BTable
      id="time-registration-detail-table"
      small
      :fields="fields"
      :items="data"
      responsive="md"
      class="data-table"
      v-if="isDetail"
    >
    </BTable>

    <div v-if="isDetail && leaveData.length > 0">
      <h4 align="center">{{ $trans("Leave") }}</h4>
      <BTable
        small
        id="workhours-table"
        :fields="leaveDataFields"
        :items="leaveData"
        responsive="md"
        class="data-table"
      >
      </BTable>
    </div>

    <div v-if="isDetail">
      <h4 align="center">{{ $trans("Workhours") }}</h4>
      <BTable
        small
        id="workhours-table"
        :fields="workhourDataFields"
        :items="workhourData"
        responsive="md"
        class="data-table"
      >
          <template v-slot:cell(work_times)="{ item }">
            {{ item.work_start }} - {{ item.work_end }}
            <span v-if="item.work_correction !== '00:00'" style="color:red">{{ item.work_correction }}</span>
          </template>
          <template v-slot:cell(work_travel)="{ item }">
            <span v-if="item.travel_to === '00:00:00' && item.travel_back === '00:00:00'" class="dimmed">&ndash;</span>
            <span v-else>{{ item.travel_to }} / {{ item.travel_back }}</span>
          </template>
          <template v-slot:cell(work_distance)="{ item }">
            <span v-if="item.distance_to === 0 && item.distance_back === 0" class="dimmed">&ndash;</span>
            <span v-else>{{ item.distance_to }} / {{ item.distance_back }}</span>
          </template>
          <template v-slot:cell(work_correct)="{ item }">
            <BButton
              v-if="isPlanning"
              variant="outline-primary"
              class="highlight-on-hover-row"
              size="sm" @click="editCorrection(item)"
            >+ / -</BButton>
          </template>
      </BTable>
    </div>

    <BModal ref="time-correction-modal" id="time-correction-modal" v-bind:title="$trans('Work hours correction')" @ok="commitTimeCorrection()">
      <form ref="edit-correction-form">
        <BContainer fluid>
          <BRow role="group">
            <BCol size="12">
              <p>{{ $trans('Enter a correction value in minutes or in the form hh:mm.')}}</p>
              <BFormInput size="sm" autofocus v-model="timeEntryCorrection" v-bind:placeholder="$trans('Enter time value')" @xxchange="onChangeTimeCorrection()" @update="onChangeTimeCorrection()" style="margin-top:1rem;margin-bottom:1rem;width:10rem;"/>
              <div class="dimmed"><span v-html="timeEntryCorrectionAsText"></span></div>
              <!--
              <BFormCheckbox
                id="notify-user"
                name="notify-user"
                v-model="timeEntryCorrectionNotify"
                value="notify"
                unchecked-value="no">{{ this.$trans('Notify user') }}</BFormCheckbox> -->
            </BCol>
          </BRow>
        </BContainer>
      </form>
    </BModal>

  </div>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'
import type {Moment} from 'moment'
import {TimeRegistrationService} from "@/models/company/TimeRegistration";
import {$trans} from "@/services/i18n";
import {useAuthStore} from "@/features/auth/store";
import {useMainStore} from "@/stores/main";

interface TableField {
  key: string
  label: string
  sortable?: boolean
  thClass?: string
}

type SortOrder = 'asc' | 'desc'

interface SortBy {
  key: string
  order: SortOrder
}

interface TotalEntry {
  total: string | number
  field: string
}

interface TotalCell {
  total: string | number
  interval_total: string | number
}

type TotalsRow = {
  user_id: string | number
  full_name: string
  interval: string
} & Record<string, TotalCell>

type UserSummary = {
  full_name: string
  user_id: string | number
} & Record<string, string | number>

interface NormalizedUser {
  user: UserSummary
  interval_totals: TotalEntry[][]
  user_totals: TotalEntry[]
}

interface WorkhourRow {
  id: number
  source: string
  work_start: string
  work_end: string
  work_correction: string
  travel_to: string
  travel_back: string
  distance_to: number
  distance_back: number
  [key: string]: string | number
}

interface LeaveRow {
  date: string
  leave_duration: string | number
  leave_type: string
  [key: string]: string | number
}

interface TimeEntry {
  id: number
  source: string
  work_correction: string
  [key: string]: string | number
}

interface TimeRegistrationListPayload {
  totals_fields: string[]
  totals: TotalsRow[]
  intervals: string[]
  date_list: string[]
}

interface TimeRegistrationDetailPayload extends TimeRegistrationListPayload {
  full_name: string
  workhour_data: WorkhourRow[]
  leave_data: LeaveRow[]
}

const props = withDefaults(defineProps<{
  user_id?: string | number | null
}>(), {
  user_id: null,
})

const emit = defineEmits<{
  (event: 'reloadData'): void
}>()

const mainStore = useMainStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const lang: string = mainStore.getCurrentLanguage || 'nl'
const monday = lang === 'en' ? 1 : 0
moment.locale(lang)
const dateQuery = typeof route.query.date === 'string' ? route.query.date : undefined
const today = ref<Moment>(dateQuery ? moment(dateQuery) : moment().weekday(monday))
const startDate = ref<string | undefined>(undefined)

const data = ref<Record<string, string | number | undefined>[]>([])
const fields = ref<TableField[]>([])
const dataFields = ref<string[]>([])
const sortBy = ref<SortBy[]>([{key: 'full_name', order: 'asc'}])
const date_list = ref<string[]>([])
const date_list_moment = ref<Moment[]>([])
const activeDateQueryMode = ref('week')
const fullName = ref<string | null>(null)
// excludeDays: ['Su', 'Sa'],
const excludeDays = ref<string[]>([])
const workhourData = ref<WorkhourRow[]>([])
const leaveData = ref<LeaveRow[]>([])
const listTitle = ref<string | null>(null)
const timeEntry = ref<TimeEntry | null>(null)
const timeEntryCorrection = ref('00:00')
const timeEntryParsed = ref('')
const timeEntryCorrectionAsText = ref('')
const timeEntryCorrectionNotify = ref(false)
const timeRegistrationService = new TimeRegistrationService()

const timeCorrectionModal = useTemplateRef<{show: () => void}>('time-correction-modal')

const workhourDataFields: TableField[] = [
  {label: $trans('Date'), key: 'date', thClass: 'col-tight'},
  {label: $trans('Source'), key: 'source', thClass: 'col-tight'},
  {key: 'work_times', label: $trans('Work start') + ' - ' + $trans('Work end') + ' ±', thClass: 'col-wider'},
  // {label: $trans('Work start'), key: 'work_start', thClass: 'col-wide'},
  // {label: $trans('Work end'), key: 'work_end', thClass: 'col-wide'},
  {key: 'work_travel', label: $trans('Travel to') + ' / ' + $trans('Travel back'), thClass: 'col-wide'},
  // {label: $trans('Travel to'), key: 'travel_to', thClass: 'col-wide'},
  // {label: $trans('Travel back'), key: 'travel_back', thClass: 'col-wide'},
  {key: 'work_distance', label: $trans('Distance to / back'), thClass: 'col-wide'},
  // {label: $trans('Distance to'), key: 'distance_to', thClass: 'col-wide'},
  // {label: $trans('Distance back'), key: 'distance_back', thClass: 'col-wide'},
  {label: $trans('Project'), key: 'project'},
  {label: $trans('Description'), key: 'description'},
  {key: 'work_correct', label:'', thClass:'col-tight'},
];

/*
// The breaks are calculated over an entire day, so showing these /per entry/ makes no
// sense, as this would be invalid if multiple entries happen on a single days. If the
// breaks are calculated on a /per registration/ basis, then this would make sense to
// include. It's now intentionally disabled and left as a comment in case this should
// be enabled in the future.
const break_calculation_settings = this.$store.getters.getAutomaticBreakCalculationSettings;
if (break_calculation_settings
  && break_calculation_settings.after > 0
  && break_calculation_settings.duration > 0) {
  workHourDataFields.splice( 4, 0, {
    label: this.$trans('Break'),
    key: 'break_duration',
    thClass: 'col-tight'
  } );
}
*/

const leaveDataFields: TableField[] = [
  {label: $trans('Date'), key: 'date'},
  {label: $trans('Leave hours'), key: 'leave_duration'},
  {label: $trans('Leave type'), key: 'leave_type'},
]

const dateQueryMode: {label: string; value: string}[] = [
  {
    label: 'Per week',
    value: 'week'
  },
  {
    label: 'Per month',
    value: 'month'
  },
  {
    label: 'Per year',
    value: 'year'
  },
]

const isPlanning = computed(() => authStore.isPlanning)
const isDetail = computed(() => Boolean(props.user_id))

const breadcrumb = computed(() => [
  {
    text: $trans('Time registration'),
    to: {
      name: 'company-time-registration',
      query: {date: startDate.value, mode: activeDateQueryMode.value}
    }
  },
  {
    text: $trans('User time registration'),
    active: true
  },
])

const modeQuery = route.query.mode
activeDateQueryMode.value = typeof modeQuery === 'string' && modeQuery ? modeQuery : 'week'
const sortField = typeof route.query.sort_field === 'string' ? route.query.sort_field : undefined
const sortDir = typeof route.query.sort_dir === 'string' ? route.query.sort_dir : undefined
const sortOrder: SortOrder = sortDir === 'desc' ? 'desc' : 'asc'
sortBy.value = [{key: sortField ?? 'full_name', order: sortOrder}]

watch(activeDateQueryMode, () => {
  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({query}).catch(() => {})
})

function translateHoursField(field: string): string | undefined {
  const allFields: Record<string, string> = {
    'work_total': $trans("Work total"),
    'break_total': $trans('Breaks total'),
    'travel_total': $trans('Travel total'),
    'distance_total': $trans('Distance total'),
    'extra_work': $trans('Total extra work'),
    'actual_work': $trans('Total actual work'),
    'unforeseen_work': $trans('Total unforeseen work'),
    'distance_fixed_rate_amount': $trans('Total trips'),
  }

  return allFields[field]
}

async function commitTimeCorrection() {
  const entry = timeEntry.value
  if (entry === null) {
    return
  }
  if (timeEntryParsed.value === entry.work_correction) {
    return
  }
  const result: {result?: boolean} | null = await timeRegistrationService.editCorrection(entry.id, {
    'source': entry.source,
    'work_correction': timeEntryParsed.value,
    'work_correction_by_user': props.user_id,
    'notify_engineer': timeEntryCorrectionNotify.value
  } );
  if (result && result.result) {
    emit('reloadData')
  }
}

function onChangeTimeCorrection() {
  timeEntryCorrection.value = timeEntryCorrection.value.trim();
  const parsed = (timeEntryCorrection.value === '' || timeEntryCorrection.value === '-')
    ? null
    : timeEntryCorrection.value.split(':');

  if (parsed != null && parsed.length > 0 && parsed.length < 3) {
    let hh = 0, mm = 0;
    const is_negative = parsed[0][0] === '-';
    if (parsed.length === 1) {
      mm = parseInt( parsed[0] );
      if (isNaN( mm )) mm = 0;
      if (is_negative) mm = 0 - mm;
      hh = Math.floor(mm / 60)
      mm -= (hh * 60)
    } else { // if (parsed.length === 2) {
      hh = parseInt( parsed[0] );
      if (isNaN( hh )) hh = 0;
      if (is_negative) hh = 0 - hh;
      mm = parseInt( parsed[1] );
      if (isNaN(mm)) mm = 0;
    }
    const display_time = ''+hh+':'+(mm < 10 ? '0': '')+mm
    timeEntryParsed.value = (is_negative ? '-' : '')+display_time;
    timeEntryCorrectionAsText.value = $trans( is_negative ? 'Subtract' : 'Add ') + ' ' + display_time;
  } else {
    timeEntryCorrectionAsText.value = $trans('Invalid time');
  }
}

function editCorrection(entry: TimeEntry) {
  timeEntry.value = entry;
  timeEntryCorrectionNotify.value = false;
  if (entry) {
    timeEntryCorrectionAsText.value = ''

    timeEntryCorrection.value = entry.work_correction;
    if (timeEntryCorrection.value.trim().length === 0) {
      timeEntryCorrection.value = '0';
    }
    onChangeTimeCorrection()

    timeCorrectionModal.value?.show();
  }
}

function getListTitle(totalsFields: string[]): string {
  const result: (string | undefined)[] = []
  for (const key of totalsFields) {
    result.push(translateHoursField(key))
  }
  return result.join(' / ')
}

function nextWeek() {
  today.value.add(7, 'days')
  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({ query }).catch(() => {})
}

function backWeek() {
  today.value.subtract(7, 'days')

  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({ query }).catch(() => {})
}

function nextMonth() {
  today.value.add(1, 'months')
  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({ query }).catch(() => {})
}

function backMonth() {
  today.value.subtract(1, 'months')

  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({ query }).catch(() => {})
}

function nextYear() {
  today.value.add(1, 'years')
  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({ query }).catch(() => {})
}

function backYear() {
  today.value.subtract(1, 'years')

  const query = {
    ...route.query,
    date: today.value.format('YYYY-MM-DD'),
    mode: activeDateQueryMode.value
  }
  router.push({ query }).catch(() => {})
}

function formatFields(day_data: TotalEntry[] | undefined): string {
  const result: (string | number)[] = []
  if (day_data) {
    for(let i=0; i<day_data.length; i++) {
      if (day_data[i]) {
        result.push(day_data[i].total)
      }
    }
  }

  return result.length ? result.join(' | ') : ''
}

function addUserDataToResults(userData: Record<string, NormalizedUser>, results: NormalizedUser[]): NormalizedUser[] {
  const keys = Object.keys(userData)
  const first = userData[keys[0]]
  results.push(first)

  return results
}

function formatValue(valObj: TotalEntry): string | number {
  return valObj.total
}

function getIntervalData(result: TotalsRow[], totalsFields: string[], intervals: string[], userId: string | number): TotalEntry[][] {
  const intervalResult: TotalEntry[][] = []

  for (let i = 0; i < intervals.length; i++) {
    const intervalData: TotalEntry[] = []

    for (let j = 0; j < result.length; j++) {
      if (result[j].user_id === userId && result[j].interval === intervals[i]) {
        for (let k = 0; k < totalsFields.length; k++) {
          const field = totalsFields[k]
          const total = result[j][field].interval_total
          intervalData.push({
            total,
            field
          });
        }
      }
    }

    intervalResult.push(intervalData)
  }

  return intervalResult
}

function getUserTotals(result: TotalsRow[], totalsFields: string[], userId: string | number): TotalEntry[] {
  for (let i = 0; i < result.length; i++) {
    if (result[i].user_id === userId) {
      const intervalResult: TotalEntry[] = []
      for (let k = 0; k < totalsFields.length; k++) {
        const field = totalsFields[k]
        const total = result[i][field].total
        intervalResult.push({
          total,
          field,
        });
      }

      return intervalResult;
    }
  }

  return [];
}

function normalizeData(result: TotalsRow[], totalsFields: string[], intervals: string[]): NormalizedUser[] {
  let userData: Record<string, NormalizedUser> = {}
  let results: NormalizedUser[] = []
  // for(let i=0; i<20; i++) {
  for(let i=0; i<result.length; i++) {
    const obj: UserSummary = {
      'full_name': result[i].full_name,
      'user_id': result[i].user_id,
    }

    if (!(obj.user_id in userData)) {
      if (Object.keys(userData).length > 0) {
        results = addUserDataToResults(userData, results)
        userData = {}
      }

      userData[obj.user_id] = {
        user: obj,
        interval_totals: getIntervalData(result, totalsFields, intervals, obj.user_id),
        user_totals: getUserTotals(result, totalsFields, obj.user_id)
      }
    }
  }

  // add the final user
  if (Object.keys(userData).length > 0) {
    results = addUserDataToResults(userData, results)
  }

  return results
}

function processData(payload: TimeRegistrationListPayload | TimeRegistrationDetailPayload) {
  if (isDetail.value && 'full_name' in payload) {
    _processDataDetail(payload)
  } else {
    _processData(payload)
  }
}

function _getHeaderLabel(dateIn: string): string {
  let label: string
  if (activeDateQueryMode.value === 'week') {
    label = moment(dateIn).format('ddd DD')
  }

  else if (activeDateQueryMode.value === 'month') {
    // if (['Su', 'Sa'].indexOf(this.$moment(dateIn).format("dd")) === -1) {
      label = moment(dateIn).format('[week] W')
    // } else {
    //   label = 'w'
    // }
  }

  else if (activeDateQueryMode.value === 'year') {
    label = moment(dateIn).format('MM')
  } else {
    label = 'HELLUP'
  }

  return label
}

function _processData(payload: TimeRegistrationListPayload) {
  workhourData.value = []
  leaveData.value = []
  listTitle.value = getListTitle(payload.totals_fields)
  date_list.value = payload.date_list.map((dateIn) => {
    return moment(dateIn).format('YYYY-MM-DD')
  })
  date_list_moment.value = payload.date_list.map((dateIn) => {
    return moment(dateIn)
  })
  const header_columns: TableField[] = []

  header_columns.push({
    key: 'full_name',
    label: $trans('User'),
    sortable: true
  })

  // add intervals
  dataFields.value = []
  for(let i=0; i<payload.date_list.length; i++) {
    const label = _getHeaderLabel(payload.date_list[i])

    header_columns.push({
      key: `field${i}`,
      label,
      sortable: true
    })
    dataFields.value.push(`field${i}`)
  }

  header_columns.push({
    key: 'total',
    label: $trans('Total'),
    sortable: true
  })

  fields.value = header_columns

  const normalizedData = normalizeData(payload.totals, payload.totals_fields, payload.intervals)
  const results: Record<string, string | number | undefined>[] = []

  // create array for table
  for(let i=0; i<normalizedData.length; i++) {
    const obj = normalizedData[i].user

    for(let j=0; j<normalizedData[i].interval_totals.length; j++) {
      obj[`field${j}`] = formatFields(normalizedData[i].interval_totals[j])
    }

    // add week totals
    const user_totals = formatFields(normalizedData[i].user_totals)
    if (user_totals) {
      obj['total'] = user_totals
      // obj['total'] = `${week_totals} (${data.result[i].perc})`
    } else {
      obj['total'] = ''
    }

    results.push(obj)
  }

  data.value = results
}

function _processDataDetail(payload: TimeRegistrationDetailPayload) {
  fullName.value = payload.full_name;
  workhourData.value = payload.workhour_data;
  leaveData.value = payload.leave_data
  date_list.value = payload.date_list.map((dateIn) => {
    return moment(dateIn).format('YYYY-MM-DD')
  })

  const header_columns: TableField[] = [{label: $trans('Field'), key: 'field'}]

  // add intervals
  for(let i=0; i<payload.date_list.length; i++) {
    const label = _getHeaderLabel(payload.date_list[i])
    header_columns.push({
      key: `field${i}`,
      label,
      sortable: true
    })
  }

  header_columns.push({
    key: 'total',
    label: $trans('Total'),
    sortable: true
  })

  fields.value = header_columns

  // create array for table
  const normalizedData = normalizeData(payload.totals, payload.totals_fields, payload.intervals)[0]
  const results: Record<string, string | number | undefined>[] = []

  if (payload.totals.length) {
    for (const field of payload.totals_fields) {
      const row: Record<string, string | number | undefined> = {
        field: translateHoursField(field)
      }

      for(let j=0; j<normalizedData.interval_totals.length; j++) {
        if (!normalizedData.interval_totals[j]) {
          continue
        }

        for(let k=0; k<normalizedData.interval_totals[j].length; k++) {
          if (!normalizedData.interval_totals[j][k]) {
            continue
          }

          if (normalizedData.interval_totals[j][k].field === field) {
            row[`field${j}`] = normalizedData.interval_totals[j][k].total
          }
        }
      }

      for (let i=0; i<normalizedData.user_totals.length; i++) {
        if (normalizedData.user_totals[i].field === field) {
          row['total'] = normalizedData.user_totals[i].total
        }
      }

      results.push(row)
    }
  }

  data.value = results
}

defineExpose({processData})
</script>

<style>
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
