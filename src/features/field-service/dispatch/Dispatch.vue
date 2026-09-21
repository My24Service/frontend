<template>
  <b-overlay :show="showOverlay" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiCalendar2Week></IBiCalendar2Week>
            {{ $trans("Dispatch") }} &ndash; {{ $trans("week") }}<strong>{{ startWeek }}</strong>
            {{ mode }}
          </h3>
          <div class="flex-columns">
            <BButton @click="showSearchModal">
              <IBiSearch></IBiSearch>
              {{ $trans('search') }}
            </BButton>

            <BButton @click="refreshBoard">
              <IBiPatchExclamationFill v-if="newData" :title="$trans('dispatch changed, refresh now')"></IBiPatchExclamationFill>
              <IBiArrowRepeat v-else></IBiArrowRepeat>
              {{ $trans('refresh') }}
            </BButton>

            <BButton-group>
              <BButton
                variant="primary"
                v-for="item in modeOptions"
                :key="item.name"
                :disabled="item.item === mode"
                @click="() => changeViewMode(item.item)">{{  item.name }}</BButton>
            </BButton-group>

            <BButton-group>
              <BButton
                variant="primary"
                v-for="item in showUsersOptions"
                :key="item.name"
                :disabled="item.item === showUsersMode"
                @click="() => changeShowUsersMode(item.item)">{{  item.name }}</BButton>
            </BButton-group>
          </div>
        </div>
      </header>

      <div class="panel">
        <div class="heading" v-if="assignMode && selectedOrders.length > 0">
          <b-row>
            <b-col cols="12">
              <strong>{{ $trans('Selected orders') }}:</strong>&nbsp;
              <span v-for="(order, index) in selectedOrders" :key="order.id">
                {{ order.order_id }}
                <BLink class="px-1" @click.prevent="removeSelectedOrder(index)">[ x ]</BLink>
              </span>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="6">
              <strong>{{ $trans('Selected users') }}:</strong>&nbsp;
              <span v-for="(user, index) in selectedUsers" :key="user.user_id">
                {{ user.full_name }} {{ user.user_id }}
                <BLink class="px-1" @click.prevent="removeSelectedUser(index)">[ x ]</BLink>
              </span>
            </b-col>
            <b-col cols="6">
              <strong>{{ $trans('Already assigned users') }}:</strong>&nbsp;
              <span v-for="user in alreadyAssignedUsers" :key="user.user_id">
                {{ user.full_name }} {{ user.user_id }}
              </span>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12">
              <footer class="modal-footer">
                <BButton @click="cancelAssign" :disabled="buttonDisabled" class="btn btn-secondary" type="button" variant="secondary">
                  {{ $trans('Cancel') }}</BButton>
                <BButton @click="assignToUsers" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
                  {{ $trans('Submit') }}</BButton>
              </footer>
            </b-col>
          </b-row>
        </div>

        <div class="flex-columns" style="justify-content: space-between;">

          <BLink class="px-1" @click.prevent="timeBackWeek" v-bind:title="$trans('Week back')">
            <IBiArrowLeftSquareFill font-scale="1.2"></IBiArrowLeftSquareFill> week {{ startWeek - 1 }}
          </BLink>

          <span class="flex-columns">
            <BLink class="px-1" @click.prevent="timeBack" v-bind:title="$trans('Day back') ">
              <IBiArrowLeftShort font-scale="1.8"></IBiArrowLeftShort>
            </BLink>
            <VueDatePicker
              v-model="startDate"
              size="sm"
              :placeholder="$trans('Start date')"
              :locale="nl"
              auto-apply
              arrow-navigation
              :formats="{ input: 'dd/MM/yyyy' }"
            ></VueDatePicker>
            <BButton @click="loadToday" variant="primary" size="sm" style="color: white; white-space: nowrap;">
              <IBiCalendar2DateFill></IBiCalendar2DateFill>&nbsp;
              {{ $trans('today') }}
            </BButton>
            <BLink class="px-1" @click.prevent="timeForward" :title="$trans('Day forward')">
              <IBiArrowRightShort font-scale="1.8"></IBiArrowRightShort>
            </BLink>
          </span>

          <BLink class="" @click.prevent="timeForwardWeek" v-bind:title="$trans('Week forward') ">
            week {{ startWeek + 1 }}
            <IBiArrowRightSquareFill font-scale="1.2"></IBiArrowRightSquareFill>
          </BLink>

        </div>
        <hr/>

        <DispatchWeek
          v-if="loadDone"
          :start-date="startDate"
          :order-click-handler="openActionsModal"
          :mode="mode"
          :is-assign-mode="assignMode"
          :already-assigned-users="alreadyAssignedUsers"
          :show-users-mode="showUsersMode"
          @add-selected-user="addSelectedUser"
        />

      </div>

      <SearchAndAssign
        id="search-modal-wide"
        ref="search-modal-wide"
        @search-and-assign-done="searchAndAssignDone"/>

      <b-modal
        ref="dispatch-change-date-modal"
        id="dispatch-change-date-modal"
        v-bind:title="$trans('Change date')"
        @ok="changeDateOk"
        v-if="selectedAssignedOrder !== null"
      >
        <form ref="change-date-form" @submit.stop.prevent="changeDateSubmit">
          <AssignedOrderDatesForm
            v-model="assignedOrder"
            id-prefix="dates-order"
            @clear="resetAssignedOrderDates"
          />
        </form>
      </b-modal>

      <b-modal
        ref="dispatch-split-order-modal"
        id="dispatch-split-order-modal"
        :title="$trans('Split order')"
        :hide-footer="true"
        v-if="selectedAssignedOrder && selectedOrder"
      >
        <form ref="split-order-form">
          <p>
            <b>{{ $trans("Order") }}</b>:
            {{ selectedOrder.order_id }} {{ selectedOrder.order_date }}
          </p>
          <p>
            <b>{{ $trans("Currently assigned") }}</b>:
            {{ (selectedOrder.assigned_user_info ?? []).map((d) => d.full_name).join(', ') }}
          </p>
          <b-container fluid>
            <b-row role="group">
              <b-col size="12">
                <BFormGroup
                  v-bind:label="$trans('Engineer')"
                  label-for="split-order-engineer"
                >
                  <VueMultiselect
                    v-model="selectedEngineers"
                    track-by="id"
                    :max-height="600"
                    :placeholder="$trans('Type to search engineers')"
                    open-direction="bottom"
                    :options="engineers"
                    :multiple="true"
                    :custom-label="engineerLabel"
                    :loading="searchingEngineers"
                    @search-change="getEngineersDebounced"
                  >
                    <template #noResult>
                      {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                    </template>
                  </VueMultiselect>

                </BFormGroup>
              </b-col>
            </b-row>
          </b-container>
          <AssignedOrderDatesForm
            v-model="assignedOrder"
            id-prefix="split-order"
            :min-date="minDate"
            :max-date="maxDate"
            @clear="resetAssignedOrderDates"
          />
        </form>
        <template #footer="{}">
          <BButton
            @click="cancelSplitOrder"
            class="btn btn-secondary"
            type="button"
            variant="secondary"
          >
            {{ $trans('Cancel') }}</BButton>
          <BButton
            @click="splitOrderSubmit"
            :disabled="selectedEngineers.length <= 0"
            class="btn btn-primary"
            type="button"
            variant="primary"
          >
            {{ $trans('Submit') }}</BButton>
        </template>

      </b-modal>

      <b-modal
        id="dispatch-order-actions-modal"
        ref="dispatch-order-actions-modal"
        v-if="selectedAssignedOrder"
        v-bind:title="`${$trans('Order')} ${selectedAssignedOrder && selectedAssignedOrder.order.order_id || '' }`"
      >
        <template #default="">
          {{ $trans('Order') }} {{ selectedAssignedOrder.order.order_id }}<br/>
          {{ selectedAssignedOrder.order.order_name }}<br/>
          {{ selectedAssignedOrder.order.order_address }}<br/>
          {{ selectedAssignedOrder.order.order_postal }} {{ selectedAssignedOrder.order.order_city }}<br/>
          {{ $trans('Order date') }}: {{ selectedAssignedOrder.order.order_date }}<br/>
          {{ $trans("Assigned order date") }}: {{ selectedAssignedOrder.date_formatted }}<br/>
          <span v-if="selectedAssignedOrder.order.order_reference !== ''">
              {{ $trans('Reference') }}: {{ selectedAssignedOrder.order.order_reference }}<br/>
          </span>
        </template>
        <template #footer="{cancel}">
          <b-container>
            <b-row v-if="selectedOrderIsPartner">
              <b-col cols="1" class="mx-2">
                <BButton size="sm" variant="info" @click="viewOrder">{{ $trans('Info') }}</BButton>
              </b-col>
              <b-col cols="1" class="mx-2">
                <BButton size="sm" variant="primary" @click="editOrder">{{ $trans('Edit') }}</BButton>
              </b-col>
              <b-col cols="6" class="mx-1">
                <div class="float-right">
                  <BButton size="sm" variant="secondary" @click="cancel()">{{ $trans('Close') }}</BButton>
                </div>
              </b-col>
            </b-row>
            <b-row v-else>
              <b-col cols="8">
                <div class="flex-columns" style="justify-content: space-between;">
                  <BButton size="sm" variant="info" @click="viewOrder">{{ $trans('Info') }}</BButton>
                  <BButton size="sm" variant="primary" @click="editOrder">{{ $trans('Edit') }}</BButton>
                  <BButton size="sm" variant="primary" @click="changeDate">{{ $trans('Change date') }}</BButton>
                  <BButton size="sm" variant="primary" @click="splitOrder">{{ $trans('Split') }}</BButton>
                </div>
              </b-col>
              <b-col cols="4" v-if="selectedAssignedOrder">
                <div class="flex-columns" style="justify-content: space-between;">
                  <BButton size="sm" variant="danger" @click="postUnassign">{{ $trans('Remove') }}</BButton>
                  <BButton size="sm" variant="secondary" @click="cancel()">{{ $trans('Close') }}</BButton>
                </div>
              </b-col>
            </b-row>
          </b-container>
        </template>
      </b-modal>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'
import { nl } from 'date-fns/locale'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import VueMultiselect from 'vue-multiselect'

import {
  companyDispatchAssignedordersUserListV4RetrieveQueryKey,
  companyUserListListOptions,
  mobileAssignedorderCreateMutation,
  mobileAssignedorderDetailChangeDatePartialUpdateMutation,
  orderOrderRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Order, OrderDetail, UserSelectRow } from '@/api/types.gen'
import MemberNewDataSocket from '@/services/websocket/MemberNewDataSocket'
import { NEW_DATA_EVENTS } from '@/constants'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { completeTime } from '@/features/forms/time-strings'
import { useQueryClient } from '@tanstack/vue-query'

import { useOrderAssignment } from '../assignment/use-order-assignment'
import { assignedUsersOf, type AssignedUser } from '../assignment/assigned-user'
import DispatchWeek from './DispatchWeek.vue'
import SearchAndAssign from './SearchAndAssign.vue'
import AssignedOrderDatesForm, { type AssignedOrderDates } from './AssignedOrderDatesForm.vue'
import type { DispatchBoardAssignedOrder, DispatchBoardOrder } from './dispatch-window'

/**
 * The dispatch week board: the planning screen for the mobile workforce.
 *
 * It reads nothing itself — the grid is `DispatchWeek`'s one query — and owns
 * the state a planner works with while it is open: which view they picked, who
 * they selected, and the five writes this screen offers (assign, unassign,
 * change the dates, split an order across engineers, open the order).
 *
 * A write invalidates the window's query key rather than calling back into the
 * board, which is how a screen knows the week it is looking at has changed
 * underneath it.
 */
// The legacy screen named itself 'DispatchNew' (a single-word filename is not
// a component name the lint rule accepts); the name is kept, and made
// multi-word for the new file, because a keep-alive include would match on it.
defineOptions({name: 'DispatchBoard'})

const props = withDefaults(defineProps<{
  /** The route's `assignModeProp`, a JSON boolean in the URL. */
  assignModeProp?: string
}>(), {
  assignModeProp: 'false',
})

const router = useRouter()
const store = useMainStore()
const queryClient = useQueryClient()
const { create: toast } = useToast()
const { assignOrders, unassignOrder } = useOrderAssignment()

const socket = new MemberNewDataSocket()

// The socket is not a reactive source: it is subscribed once here and tells
// `newData` that the planning moved.
const newData = ref(false)

const mode = ref(localStorage.getItem('displayMode') ? JSON.parse(localStorage.getItem('displayMode') as string) : 'wide')
const showUsersMode = ref(localStorage.getItem('showUsersMode') ? JSON.parse(localStorage.getItem('showUsersMode') as string) : 'active')

const modeOptions = [
  {item: 'compact', name: $trans('Compact')},
  {item: 'wide', name: $trans('Wide')},
]
const showUsersOptions = [
  {item: 'all', name: $trans('All')},
  {item: 'active', name: $trans('Active')},
]

const startDate = ref<Date>(new Date())
const loadDone = ref(false)
const buttonDisabled = ref(false)
const showOverlay = ref(false)

const assignMode = ref(false)
const selectedOrders = ref<Order[]>([])
const selectedOrderIds = ref<string[]>([])
const selectedUsers = ref<AssignedUser[]>([])
const alreadyAssignedUsers = ref<AssignedUser[]>([])

const selectedOrder = ref<OrderDetail | null>(null)
const selectedAssignedOrder = ref<DispatchBoardAssignedOrder | null>(null)
const selectedOrderUserId = ref<number | null>(null)
const selectedOrderIsPartner = ref(false)
const minDate = ref<Date | null>(null)
const maxDate = ref<Date | null>(null)

/** Always an object: the modals render their pickers from it unconditionally. */
const assignedOrder = ref<AssignedOrderDates>({
  alt_start_date: null,
  alt_start_time: null,
  alt_end_date: null,
  alt_end_time: null,
  start_time: null,
  end_time: null,
})

const getEngineersDebounced = AwesomeDebouncePromise(getEngineers, 500)

const engineers = ref<UserSelectRow[]>([])
const selectedEngineers = ref<UserSelectRow[]>([])
const searchingEngineers = ref(false)

const searchAssignModal = useTemplateRef<InstanceType<typeof SearchAndAssign>>('search-modal-wide')
const changeDateModal = useTemplateRef<{show: () => void; hide: () => void}>('dispatch-change-date-modal')
const splitOrderModal = useTemplateRef<{show: () => void; hide: () => void}>('dispatch-split-order-modal')
const actionsModal = useTemplateRef<{show: () => void; hide: () => Promise<unknown>}>('dispatch-order-actions-modal')

const startWeek = computed(() => Number(moment(startDate.value).format('w')))

const changeDateMutation = useMutation({...mobileAssignedorderDetailChangeDatePartialUpdateMutation()})
const createAssignedOrderMutation = useMutation({...mobileAssignedorderCreateMutation()})

watch(mode, (value) => localStorage.setItem('displayMode', JSON.stringify(value)))
watch(showUsersMode, (value) => localStorage.setItem('showUsersMode', JSON.stringify(value)))

function onNewData(data: {type: string}) {
  if (data.type === NEW_DATA_EVENTS.DISPATCH) {
    newData.value = true
  }
}

onMounted(async () => {
  await socket.init(NEW_DATA_EVENTS.DISPATCH)
  socket.setOnmessageHandler(onNewData)
  socket.getSocket()

  moment.locale(store.getCurrentLanguage || 'nl')
  const monday = store.getCurrentLanguage === 'en' ? 1 : 0
  startDate.value = moment().weekday(monday).toDate()

  assignMode.value = props.assignModeProp ? JSON.parse(props.assignModeProp) : false
  if (assignMode.value) {
    selectedOrders.value = [...store.getAssignOrders]
    alreadyAssignedUsers.value = assignedUsersOf(selectedOrders.value)
  } else {
    alreadyAssignedUsers.value = []
  }

  loadDone.value = true
})

onBeforeUnmount(() => {
  socket.removeOnmessageHandler()
})

// view mode ------------------------------------------------------------------

function changeViewMode(value: string) {
  mode.value = value
}

function changeShowUsersMode(value: string) {
  showUsersMode.value = value
}

// dates ----------------------------------------------------------------------

/**
 * Move the board to today and re-read the week.
 *
 * The re-read is explicit: the week's query is keyed by the date string, so a
 * board already showing this week would keep its rows — and the refresh button
 * would do nothing, which is what the legacy screen did.
 */
function refreshBoard() {
  loadToday()
  void invalidateWeek()
}

function loadToday() {
  startDate.value = new Date()
}

function timeForwardWeek() {
  startDate.value = moment(startDate.value).add(1, 'w').toDate()
}

function timeForward() {
  startDate.value = moment(startDate.value).add(1, 'd').toDate()
}

function timeBackWeek() {
  startDate.value = moment(startDate.value).subtract(1, 'w').toDate()
}

function timeBack() {
  startDate.value = moment(startDate.value).subtract(1, 'd').toDate()
}

// the selected order ---------------------------------------------------------

async function openActionsModal(userId: number, order_pk: number, assignedorder: DispatchBoardAssignedOrder, is_partner: boolean) {
  selectedAssignedOrder.value = assignedorder
  selectedOrderUserId.value = userId
  selectedOrderIsPartner.value = is_partner

  try {
    showOverlay.value = true
    // The retrieve path is declared as a string — it accepts an order pk or a
    // uuid — so the number the grid carries is stringified for the request.
    selectedOrder.value = await queryClient.fetchQuery(
      orderOrderRetrieveOptions({path: {id: String(order_pk)}}))
    showOverlay.value = false
    await actionsModal.value?.show()
  } catch (error) {
    console.log('error fetching order', error)
    errorToast(toast, $trans('Error fetching order'))
    showOverlay.value = false
  }
}

async function viewOrder() {
  await actionsModal.value?.hide()
  router.push({name: 'order-view', params: {pk: selectedOrder.value?.id}})
}

async function editOrder() {
  await actionsModal.value?.hide()
  router.push({name: 'order-edit', params: {pk: selectedOrder.value?.id}})
}

// change date ----------------------------------------------------------------

/** The dates a modal starts from: the assignment's own, as Dates. */
function newDatesModel(): AssignedOrderDates {
  const assigned = selectedAssignedOrder.value

  return {
    alt_start_date: assigned?.start_date ? moment(assigned.start_date, 'YYYY-MM-DD').toDate() : null,
    alt_end_date: assigned?.end_date ? moment(assigned.end_date, 'YYYY-MM-DD').toDate() : null,
    // Seeded from the assignment's own times, so an untouched field sends the
    // time it was showing rather than a blank.
    alt_start_time: assigned?.start_time ?? null,
    alt_end_time: assigned?.end_time ?? null,
    start_time: assigned?.start_time ?? null,
    end_time: assigned?.end_time ?? null,
  }
}

/**
 * Re-seed the dates both modals edit from the selected assignment.
 *
 * The split's `order` rides along so a clear inside the split modal keeps the
 * order the new assigned orders belong to; the change-date submit only sends
 * the four `alt_*` values, so the extra key is ignored there.
 */
function resetAssignedOrderDates() {
  assignedOrder.value = newSplitModel()
}

function changeDate() {
  assignedOrder.value = newDatesModel()
  actionsModal.value?.hide()
  changeDateModal.value?.show()
}

function changeDateOk(event: {preventDefault: () => void}) {
  event.preventDefault()
  changeDateSubmit()
}

async function changeDateSubmit() {
  if (!selectedAssignedOrder.value) return

  showOverlay.value = true

  try {
    await changeDateMutation.mutateAsync({
      path: {id: selectedAssignedOrder.value.id},
      body: {
        alt_start_date: toIsoDate(assignedOrder.value.alt_start_date),
        alt_end_date: toIsoDate(assignedOrder.value.alt_end_date),
        alt_start_time: toIsoTime(assignedOrder.value.alt_start_time),
        alt_end_time: toIsoTime(assignedOrder.value.alt_end_time),
      },
    })

    changeDateModal.value?.hide()
    await invalidateWeek()
    showOverlay.value = false
  } catch (error) {
    console.log('error updating assignedOrder dates', error)
    errorToast(toast, $trans('Error updating dates'))
    showOverlay.value = false
  }
}

// split ----------------------------------------------------------------------

/** The split's dates, and the order they belong to. */
function newSplitModel(): AssignedOrderDates {
  const assigned = selectedAssignedOrder.value

  return {
    ...newDatesModel(),
    order: selectedOrder.value?.id,
  }
}

function splitOrder() {
  assignedOrder.value = newSplitModel()
  actionsModal.value?.hide()
  splitOrderModal.value?.show()
}

function cancelSplitOrder() {
  splitOrderModal.value?.hide()
}

/** One assigned order per picked engineer, so a job can be shared out. */
async function splitOrderSubmit() {
  showOverlay.value = true

  try {
    for (const engineer of selectedEngineers.value) {
      await createAssignedOrderMutation.mutateAsync({
        body: {
          order: assignedOrder.value.order as number,
          engineer: engineer.submodel_id,
          alt_start_date: toIsoDate(assignedOrder.value.alt_start_date),
          alt_end_date: toIsoDate(assignedOrder.value.alt_end_date),
          alt_start_time: toIsoTime(assignedOrder.value.alt_start_time),
          alt_end_time: toIsoTime(assignedOrder.value.alt_end_time),
        },
      })
    }

    splitOrderModal.value?.hide()
    infoToast(toast, $trans('Success'), $trans('Order split'))
    await invalidateWeek()
    showOverlay.value = false
  } catch (error) {
    console.log('error creating assignedOrder', error)
    errorToast(toast, $trans('Error splitting order'))
    showOverlay.value = false
  }
}

// assigning ------------------------------------------------------------------

/** The engineers the split modal offers, searched as the box is typed into. */
async function getEngineers(query: string) {
  if (query === '') return

  engineers.value = []
  searchingEngineers.value = true

  try {
    engineers.value = await queryClient.fetchQuery(
      companyUserListListOptions({query: {q: query, user_type: 'engineer'}}))
    searchingEngineers.value = false
  } catch (error) {
    console.log('Error fetching engineers', error)
    errorToast(toast, $trans('Error fetching engineers'))
    searchingEngineers.value = false
  }
}

function engineerLabel(engineer: {name: string}) {
  return engineer.name
}

function showSearchModal() {
  searchAssignModal.value?.show()
}

/**
 * Take the orders the search modal staged, and work out who is already on them.
 *
 * The board cannot offer a user who is already assigned to one of the selected
 * orders, so the modal's choice and the board's list are read together. The
 * selection is left alone when the modal closes without one, which is what the
 * legacy board did.
 */
async function searchAndAssignDone(newAssignMode: boolean) {
  loadDone.value = false
  assignMode.value = newAssignMode

  if (newAssignMode) {
    selectedOrders.value = [...store.getAssignOrders]
    alreadyAssignedUsers.value = assignedUsersOf(selectedOrders.value)
  } else {
    alreadyAssignedUsers.value = []
  }

  loadDone.value = true
}

function addSelectedUser(user: AssignedUser) {
  if (userAlreadyAssigned(user.user_id)) {
    infoToast(toast, $trans('Already assigned'), $trans('Order(s) already assigned'))
    return
  }

  if (!userAlreadySelected(user.user_id)) {
    selectedUsers.value.push(user)
  }
}

function userAlreadySelected(user_id: number) {
  return selectedUsers.value.find((user) => user.user_id === user_id)
}

function userAlreadyAssigned(user_id: number) {
  return alreadyAssignedUsers.value.find((user) => user.user_id === user_id)
}

/**
 * Assign every selected order to every selected user, and notify them.
 *
 * `selectedOrderIds` is the `order_id` the API looks orders up by, not the
 * pk; it is remembered so a second assign from the same board sends the same
 * set without the planner re-picking.
 */
async function assignToUsers() {
  showOverlay.value = true
  buttonDisabled.value = true

  const userIds = selectedUsers.value.map((user) => user.user_id)

  if (selectedOrderIds.value.length === 0) {
    selectedOrderIds.value = selectedOrders.value.map((order) => String(order.order_id))
  }

  try {
    await assignOrders(userIds, selectedOrderIds.value, true)
    infoToast(toast, $trans('Success'), $trans('Order(s) assigned'))
    cancelAssign()
    buttonDisabled.value = false
    showOverlay.value = false
  } catch (error) {
    errorToast(toast, $trans('Error assigning order(s)'))
    showOverlay.value = false
    buttonDisabled.value = false
  }
}

async function postUnassign() {
  if (selectedOrderUserId.value === null || !selectedOrder.value) return

  showOverlay.value = true

  await actionsModal.value?.hide()
  try {
    const result = await unassignOrder(selectedOrderUserId.value, selectedOrder.value.id)
    // A zero result is the backend refusing: the engineer has booked hours
    // or materials on the order — reported distinctly from a failed request.
    if (!result.result) {
      errorToast(toast, $trans('has booked hours or materials'))
    } else {
      infoToast(toast, $trans('Success'), $trans('Order removed from planning'))
    }
    showOverlay.value = false
  } catch (error) {
    console.error('error un-assigning', error)
    errorToast(toast, $trans('Error un-assigning order'))
    showOverlay.value = false
  }
}

function cancelAssign() {
  selectedUsers.value = []
  selectedOrders.value = []
  alreadyAssignedUsers.value = []
  assignMode.value = false
  store.setAssignOrders([])
}

function removeSelectedOrder(index: number) {
  selectedOrders.value.splice(index, 1)
}

function removeSelectedUser(index: number) {
  selectedUsers.value.splice(index, 1)
}

/** A date the request schema accepts, whatever the picker held. */
function toIsoDate(value: Date | string | null): string | null {
  if (value === null || value === '') return null
  return typeof value === 'object' ? moment(value).format('YYYY-MM-DD') : value
}

/**
 * A time the request schema accepts.
 *
 * `alt_start_time` is declared `isoTimeSecond`, so `08:00` is refused — the
 * generated client validates the body before it sends it. The time field hands
 * over `HH:mm`, which is what a person types and what the column shows, and
 * seconds are appended here rather than in the field.
 */
function toIsoTime(value: string | null): string | null {
  if (!value) return null
  return completeTime(value)
}

async function invalidateWeek() {
  await queryClient.invalidateQueries({queryKey: companyDispatchAssignedordersUserListV4RetrieveQueryKey()})
}

</script>

<style scoped>
.heading {
  position: sticky;
  top: 0;
  background: #fff;
  opacity: .9;
  z-index: 1000;
}
.flex-columns a {
  align-self: center;
}
</style>