<template>
  <b-overlay :show="showOverlay" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiCalendar2Week></IBiCalendar2Week>
            {{ $trans("Dispatch") }} &ndash; {{ $trans("week") }}<strong>{{ +this.startWeek }}</strong>
            {{ mode }}
          </h3>
          <div class="flex-columns">
            <BButton @click="function() { showSearchModal() }">
              <IBiSearch></IBiSearch>
              {{ $trans('search') }}
            </BButton>

            <BButton @click="function() { loadToday() }">
              <IBiPatchExclamationFill v-if="newData" :title="$trans('dispatch changed, refresh now')"></IBiPatchExclamationFill>
              <IBiArrowRepeat v-else></IBiArrowRepeat>
              {{ $trans('refresh') }}
            </BButton>

            <BButton-group>
              <BButton
                variant="primary"
                v-for="item in this.modeOptions"
                :key="item.name"
                :disabled="item.item === mode"
                @click="() => changeViewMode(item.item)">{{  item.name }}</BButton>
            </BButton-group>

            <BButton-group>
              <BButton
                variant="primary"
                v-for="item in this.showUsersOptions"
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
            <IBiArrowLeftSquareFill font-scale="1.2"></IBiArrowLeftSquareFill> week {{ this.startWeek - 1 }}
          </BLink>

          <span class="flex-columns">
            <BLink class="px-1" @click.prevent="timeBack" v-bind:title="$trans('Day back') ">
              <IBiArrowLeftShort font-scale="1.8"></IBiArrowLeftShort>
            </BLink>
            <VueDatePicker
              v-model="startDate"
              size="sm"
              placeholder="Start date"
              locale="nl"
              :date-format-options="{ day: '2-digit', month: '2-digit', year: 'numeric' }"
            ></VueDatePicker>
            <BButton @click="function() { loadToday() }" variant="primary" size="sm" style="color: white; white-space: nowrap;">
              <IBiCalendar2DateFill></IBiCalendar2DateFill>&nbsp;
              {{ $trans('today') }}
            </BButton>
            <BLink class="px-1" @click.prevent="timeForward" :title="$trans('Day forward')">
              <IBiArrowRightShort font-scale="1.8"></IBiArrowRightShort>
            </BLink>
          </span>

          <BLink class="" @click.prevent="timeForwardWeek" v-bind:title="$trans('Week forward') ">
            week {{ (+this.startWeek + 1) }}
            <IBiArrowRightSquareFill font-scale="1.2"></IBiArrowRightSquareFill>
          </BLink>

        </div>
        <hr/>

        <DispatchWeek
          v-if="loadDone"
          :startDate="startDate"
          :orderClickHandler="openActionsModal"
          :mode="mode"
          :is-assign-mode="assignMode"
          :already-assigned-users="alreadyAssignedUsers"
          :show-users-mode="showUsersMode"
          ref="dispatchComponent"
          @addSelectedUser="addSelectedUser"
        />

      </div>

      <SearchAndAssign
        id="search-modal-wide"
        ref="search-modal-wide"
        @search-and-assign-done="searchAndAssignDone"/>

      <!--
      <SearchModal
        id="search-modal"
        ref="search-modal"
        @do-search="handleSearchOk"
      /> -->

      <b-modal
        ref="dispatch-change-date-modal"
        id="dispatch-change-date-modal"
        v-bind:title="$trans('Change date')"
        @ok="changeDateOk"
        v-if="selectedAssignedOrder !== null"
      >
        <form ref="change-date-form" @submit.stop.prevent="changeDateSubmit">
          <b-container fluid v-if="assignedOrder">
            <b-row role="group">
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('Start date')"
                  label-for="dates-order-start-date"
                >
                  <VueDatePicker
                    id="dates-order-start-date"
                    size="sm"
                    class="p-sm-0"
                    v-model="assignedOrder.alt_start_date"
                    v-bind:placeholder="$trans('Choose a date')"
                    locale="nl"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                    :min="minDate"
                    :max="maxDate"
                    value-as-date
                  ></VueDatePicker>
                </BFormGroup>
              </b-col>
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('Start time')"
                  label-for="dates-order-start-time"
                >
                  <TimeInput
                    id="dates-order-start-time"
                    :time-in="assignedOrder.start_time"
                    @timeChanged="(val) => assignedOrder.alt_start_time = val"
                  />
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('End date')"
                  label-for="dates-order-end-date"
                >
                  <VueDatePicker
                    id="dates-order-end-date"
                    size="sm"
                    class="p-sm-0"
                    v-model="assignedOrder.alt_end_date"
                    v-bind:placeholder="$trans('Choose a date')"
                    locale="nl"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                    :min="minDate"
                    :max="maxDate"
                    value-as-date
                  ></VueDatePicker>
                </BFormGroup>
              </b-col>
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('End time')"
                  label-for="dates-order-end-time"
                >
                  <TimeInput
                    id="dates-order-end-time"
                    :time-in="assignedOrder.end_time"
                    @timeChanged="(val) => assignedOrder.alt_end_time = val"
                  />
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col size="6"></b-col>
              <b-col size="6" class="text-right">
                <BLink class="px-1" title="clear" v-on:click="clearAssignedorderDates()">
                  {{ $trans('clear') }}
                </BLink>
              </b-col>
            </b-row>
          </b-container>
        </form>
      </b-modal>

      <b-modal
        ref="dispatch-split-order-modal"
        id="dispatch-split-order-modal"
        :title="$trans('Split order')"
        :hide-footer="true"
        v-if="selectedAssignedOrder&& selectedOrder"
      >
        <form ref="split-order-form">
          <p>
            <b>{{ $trans("Order") }}</b>:
            {{ selectedOrder.order_id }} {{ selectedOrder.order_date }}
          </p>
          <p>
            <b>{{ $trans("Currently assigned") }}</b>:
            {{ selectedOrder.assigned_user_info.map((d) => d.full_name).join(', ') }}
          </p>
          <b-container fluid v-if="assignedOrder">
            <b-row role="group">
              <b-col size="12">
                <BFormGroup
                  v-bind:label="$trans('Engineer')"
                  label-for="split-order-engineer"
                >
                  <multiselect
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
                    <span slot="noResult">
                      {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                    </span>
                  </multiselect>

                </BFormGroup>
              </b-col>
            </b-row>
            <b-row role="group">
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('Start date')"
                  label-for="split-order-start-date"
                >
                  <VueDatePicker
                    id="split-order-start-date"
                    size="sm"
                    class="p-sm-0"
                    v-model="assignedOrder.alt_start_date"
                    :placeholder="$trans('Choose a date')"
                    locale="nl"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                    :min="minDate"
                    :max="maxDate"
                    value-as-date
                  ></VueDatePicker>
                </BFormGroup>
              </b-col>
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('Start time')"
                  label-for="split-order-start-time"
                >
                  <TimeInput
                    id="split-order-start-time"
                    :time-in="assignedOrder.start_time"
                    @timeChanged="(val) => assignedOrder.alt_start_time = val"
                  />
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('End date')"
                  label-for="split-order-end-date"
                >
                  <VueDatePicker
                    id="split-order-end-date"
                    size="sm"
                    class="p-sm-0"
                    v-model="assignedOrder.alt_end_date"
                    v-bind:placeholder="$trans('Choose a date')"
                    locale="nl"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                    :min="minDate"
                    :max="maxDate"
                    value-as-date
                  ></VueDatePicker>
                </BFormGroup>
              </b-col>
              <b-col size="6">
                <BFormGroup
                  v-bind:label="$trans('End time')"
                  label-for="split-order-end-time"
                >
                  <TimeInput
                    id="split-order-end-time"
                    :time-in="assignedOrder.end_time"
                    @timeChanged="(val) => assignedOrder.alt_end_time = val"
                  />
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col size="6"></b-col>
              <b-col size="6" class="text-right">
                <BLink class="px-1" title="clear" v-on:click="clearAssignedorderSplit()">
                  {{ $trans('clear') }}
                </BLink>
              </b-col>
            </b-row>
          </b-container>
        </form>
        <footer class="modal-footer">
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
        </footer>

      </b-modal>

      <b-modal
        id="dispatch-order-actions-modal"
        ref="dispatch-order-actions-modal"
        v-bind:title="`${$trans('Order')} ${selectedAssignedOrder && selectedAssignedOrder.order.order_id || '' }`"
      >
        <template #default="">
          {{ $trans('Order') }} {{ selectedAssignedOrder.order.order_id }}<br/>
          {{ selectedAssignedOrder.order.order_name }}<br/>
          {{ selectedAssignedOrder.order.order_address }}<br/>
          {{ selectedAssignedOrder.order.order_postal }} {{ selectedAssignedOrder.order.order_city }}<br/>
          {{ $trans('Order date') }}: {{ selectedAssignedOrder.order.order_date }}<br/>
          {{ $trans("Assigned order date") }}: {{ selectedAssignedOrder.date_formatted }}<br/>
          <span v-if="selectedAssignedOrder.order.order_reference != ''">
              {{ $trans('Reference') }}: {{ selectedAssignedOrder.order.order_reference }}<br/>
          </span>
        </template>
        <template #modal-footer="{ cancel }">
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

<script>
import moment from 'moment/min/moment-with-locales'

import DispatchWeek from './dispatch/DispatchWeek.vue'
import {OrderService} from '@/models/orders/Order'
import {
  AssignedOrderModel,
  AssignedOrderService
} from '@/models/mobile/AssignedOrder'
import { AssignService } from '@/models/mobile/Assign'
import SearchAndAssign from "@/views/mobile/dispatch/SearchAndAssign.vue";
import MemberNewDataSocket from '../../services/websocket/MemberNewDataSocket.js'
import {NEW_DATA_EVENTS} from '@/constants';
import Multiselect from "vue-multiselect";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import {UserListService} from "@/models/company/UserList";
import TimeInput from "@/components/TimeInput.vue";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import {useMainStore} from "@/stores/main";

const memberNewDataSocket = new MemberNewDataSocket()

class SelectedUser {
  user_id
  full_name
}

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  name: 'DispatchNew',
  components: {
    Multiselect,
    // SearchModal,
    SearchAndAssign,
    DispatchWeek,
    TimeInput
  },
  props: {
    assignModeProp: {
      type: [Boolean],
      default: false
    },
  },
  data() {
    return {
      mode: null,
      showUsersMode: null,
      modeOptions: [
        { item: 'compact', name: $trans('Compact') },
        { item: 'wide', name: $trans('Wide') },
      ],
      showUsersOptions: [
        { item: 'all', name: $trans('All') },
        { item: 'active', name: $trans('Active') },
      ],
      scrollTopButton: null,
      searchQuery: null,
      buttonDisabled: false,
      assignMode: false,
      selectedOrders: [],
      selectedOrderIds: [],
      selectedUsers: [],
      alreadyAssignedUsers: [],
      selectedOrder: null,
      selectedAssignedOrder: null,
      selectedOrderUserId: null,
      selectedOrderIsPartner: false,
      assignedOrder: null,
      assignedOrderPk: null,
      dispatch: null,
      showOverlay: false,
      startDate: null,
      startWeek: null,
      newData: false,
      minDate: null,
      maxDate: null,
      statuscodes: null,
      loadDone: false,
      assignedOrderService: new AssignedOrderService(),
      orderService: new OrderService(),
      assignService: new AssignService(),
      engineers: [],
      selectedEngineers: [],
      getEngineersDebounced: null,
      searchingEngineers: false,
      userListService: new UserListService(),
    }
  },
  watch: {
    mode: function(val) {
      localStorage.setItem('displayMode', JSON.stringify(val))
    },
    showUsersMode: function(val) {
      localStorage.setItem('showUsersMode', JSON.stringify(val))
    },
    startDate: function(val) {
      this.startWeek = moment(val).format('w');
    }
  },
  methods: {
    // get engineers
    async getEngineers(query) {
      if (query === '') return
      this.engineers = []
      this.searchingEngineers = true

      try {
        this.engineers = await this.userListService.search(query, 'engineer')
        // const already_assigned = this.selectedOrder.assigned_user_info.map((d) => d.user_id)
        // this.engineers = result.filter((engineer) => already_assigned.indexOf(parseInt(engineer.id)) === -1)
        this.searchingEngineers = false
      } catch(error) {
        console.log('Error fetching engineers', error)
        errorToast(this.create, $trans('Error fetching engineers'))
        this.searchingEngineers = false
      }
    },
    engineerLabel({ name }) {
      return name
    },

    // change view mode
    changeViewMode(mode) {
      this.mode = mode;
    },
    changeShowUsersMode(mode) {
      this.showUsersMode = mode;
    },
    // dates
    getNewAssignedorderModelDates() {
      return new AssignedOrderModel({
        alt_start_date: this.$moment(this.selectedAssignedOrder.start_date, 'YYYY-MM-DD').toDate(),
        alt_end_date: this.$moment(this.selectedAssignedOrder.end_date, 'YYYY-MM-DD').toDate(),
        start_time: this.selectedAssignedOrder.start_time,
        end_time: this.selectedAssignedOrder.end_time,
      })
    },
    clearAssignedorderDates() {
      this.assignedOrder = this.getNewAssignedorderModelDates()
    },
    changeDate() {
      this.assignedOrder = this.getNewAssignedorderModelDates()
      this.$refs['dispatch-order-actions-modal'].hide()
      this.$refs['dispatch-change-date-modal'].show()
    },
    changeDateOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.changeDateSubmit()
    },
    async changeDateSubmit() {
      this.showOverlay = true

      try {
        await this.assignedOrderService.updateDetailChangeDate(this.selectedAssignedOrder.id, this.assignedOrder)
        this.$refs['dispatch-change-date-modal'].hide();
        this.refreshData()
        this.showOverlay = false

      } catch(error) {
        console.log('error updating assignedOrder dates', error)
        errorToast(this.create, $trans('Error updating dates'))
        this.showOverlay = false
      }
    },
    // split order (create new assignedOrder model)
    getNewAssignedorderModelSplit() {
      return new AssignedOrderModel({
        order: this.selectedOrder.id,
        alt_start_date: this.$moment(this.selectedAssignedOrder.start_date, 'YYYY-MM-DD').toDate(),
        alt_end_date: this.$moment(this.selectedAssignedOrder.end_date, 'YYYY-MM-DD').toDate(),
        start_time: this.selectedAssignedOrder.start_time,
        end_time: this.selectedAssignedOrder.end_time,
      })
    },
    clearAssignedorderSplit() {
      this.assignedOrder = this.getNewAssignedorderModelSplit()
    },
    splitOrder() {
      this.assignedOrder = this.getNewAssignedorderModelSplit()
      this.$refs['dispatch-order-actions-modal'].hide()
      this.$refs['dispatch-split-order-modal'].show()
    },
    cancelSplitOrder() {
      this.$refs['dispatch-split-order-modal'].hide()
    },
    async splitOrderSubmit() {
      this.showOverlay = true

      try {
        // check date types
        if (this.assignedOrder.alt_start_date !== null && typeof this.assignedOrder.alt_start_date === 'object') {
          this.assignedOrder.alt_start_date = moment(this.assignedOrder.alt_start_date).format('YYYY-MM-DD')
        }

        if (this.assignedOrder.alt_end_date !== null && typeof this.assignedOrder.alt_end_date === 'object') {
          this.assignedOrder.alt_end_date = moment(this.assignedOrder.alt_end_date).format('YYYY-MM-DD')
        }

        for (const user of this.selectedEngineers) {
          const obj = {
            ...this.assignedOrder,
            engineer: user.submodel_id
          }
          await this.assignedOrderService.insert(obj)
        }
        this.$refs['dispatch-split-order-modal'].hide();
        infoToast(this.create, $trans('Success'), $trans('Order split'))
        this.refreshData()
        this.showOverlay = false
      } catch(error) {
        console.log('error creating assignedOrder', error)
        errorToast(this.create, $trans('Error splitting order'))
        this.showOverlay = false
      }
    },
    async searchAndAssignDone(newAssignMode) {
      this.loadDone = false
      this.assignMode = newAssignMode

      if (this.assignMode) {
        this.alreadyAssignedUsers = []
        this.selectedOrders = await this.mainStore.getAssignOrders()
        for (const order of this.selectedOrders) {
          this.alreadyAssignedUsers.push(...order.assigned_user_info.map((userInfo) => {
            return {
              user_id: userInfo.user_id,
              full_name: userInfo.full_name
            }
          }))
        }
      } else {
        this.alreadyAssignedUsers = []
      }

      this.loadDone = true
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal-wide'].hide()
      setTimeout(() => {
        // this.dispatch.setSearchQuery(val)
        // this.dispatch.search()
      }, 500)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal-wide'].show()
    },
    // rest
    loadToday() {
      // this.dispatch.loadToday()
      this.startDate = new Date();
    },
    viewOrder() {
      this.$refs['dispatch-order-actions-modal'].hide();
      this.$root.$once('bv::modal::hidden', (bvEvent, modalId) => {
        this.$router.push({name: 'order-view', params: {pk: this.selectedOrder.id}})
      })
    },
    editOrder() {
      this.$refs['dispatch-order-actions-modal'].hide();
      this.$root.$once('bv::modal::hidden', (bvEvent, modalId) => {
        this.$router.push({name: 'order-edit', params: {pk: this.selectedOrder.id}})
      })
    },
    async openActionsModal(userId, order_pk, assignedorder, is_partner) {
      this.selectedAssignedOrder = assignedorder
      this.selectedOrderUserId = userId
      this.selectedOrderIsPartner = is_partner

      try {
        this.showOverlay = true
        this.selectedOrder = await this.orderService.detail(order_pk)
        this.showOverlay = false
        this.$refs['dispatch-order-actions-modal'].show();
      } catch (error) {
        console.log('error fetching order', error)
        errorToast(this.create, $trans('Error fetching order'))
      }
    },
    addSelectedUser(user) {
      if (this.userAlreadyAssigned(user.user_id)) {
        infoToast(this.create, $trans('Already assigned'), $trans('Order(s) already assigned'))
        return
      }
      if (!this.userAlreadySelected(user.user_id)) {
        this.selectedUsers.push(user)
      }
    },
    userAlreadySelected(user_id) {
      return this.selectedUsers.find(user => user.user_id === user_id)
    },
    userAlreadyAssigned(user_id) {
      return this.alreadyAssignedUsers.find(user => user.user_id === user_id)
    },
    async assignToUsers() {
      this.showOverlay = true
      this.buttonDisabled = true
      let user_ids = this.selectedUsers.map(o => o.user_id)

      if (this.selectedOrderIds.length === 0) {
        this.selectedOrderIds = this.selectedOrders.map(o => o.order_id)
      }

      try {
        for (const user_id of user_ids) {
          await this.assignService.assignToUser(user_id, this.selectedOrderIds, true)
        }

        infoToast(this.create, $trans('Success'), $trans('Order(s) assigned'))
        this.cancelAssign()
        this.refreshData()
        this.buttonDisabled = false
        this.showOverlay = false
      } catch (e) {
        errorToast(this.create, $trans('Error assigning order(s)'))
        this.showOverlay = false
        this.buttonDisabled = false
      }
    },
    postUnassign() {
      this.showOverlay = true

      this.$refs['dispatch-order-actions-modal'].hide();
      this.$root.$once('bv::modal::hidden', async (bvEvent, modalId) => {
        try {
          await this.assignService.unAssign(this.selectedOrderUserId, this.selectedOrder.id)
          infoToast(this.create, $trans('Success'), $trans('Order removed from planning'))
          this.refreshData()
          this.showOverlay = false
        } catch (error) {
          console.log('error un-assigning', error)
          errorToast(this.create, $trans('Error un-assigning order'))
          this.showOverlay = false
        }
      })
    },
    cancelAssign() {
      this.selectedUsers = []
      this.selectedOrders = []
      this.alreadyAssignedUsers = []
      this.assignMode = false;
      this.mainStore.setAssignOrders(this.selectedOrders)
    },
    removeSelectedOrder(index) {
      this.selectedOrders.splice(index, 1);
    },
    removeSelectedUser(index) {
      this.selectedUsers.splice(index, 1);
    },
    timeForwardWeek() {
      this.startDate = moment(this.startDate).add(1, 'w').toDate()
    },
    timeForward() {
      this.startDate = moment(this.startDate).add(1, 'd').toDate()
    },
    timeBackWeek() {
      this.startDate = moment(this.startDate).subtract(1, 'w').toDate()
    },
    timeBack() {
      this.startDate = moment(this.startDate).subtract(1, 'd').toDate()
    },
    onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.DISPATCH) {
        this.newData = true
      }
    },
    refreshData() {
      this.$refs['dispatchComponent'].loadData()
    }
  },
  async mounted() {
    await memberNewDataSocket.init(NEW_DATA_EVENTS.DISPATCH)
    memberNewDataSocket.setOnmessageHandler(this.onNewData)
    memberNewDataSocket.getSocket()

    this.getEngineersDebounced = AwesomeDebouncePromise(this.getEngineers, 500)

    const displayMode = JSON.parse(localStorage.getItem('displayMode'))
    this.mode = displayMode ? displayMode : 'wide'

    const showUsersMode = JSON.parse(localStorage.getItem('showUsersMode'))
    this.showUsersMode = showUsersMode ? showUsersMode : 'active'

    const lang = this.mainStore.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)
    this.startDate = this.$moment().weekday(monday)
    this.startWeek = this.startDate.format('w')

    this.assignMode = this.assignModeProp

    if (this.assignMode) {
      this.alreadyAssignedUsers = []
      this.selectedOrders = await this.mainStore.getAssignOrders()
      for (const order of this.selectedOrders) {
        this.alreadyAssignedUsers.push(...order.assigned_user_info.map((userInfo) => {
          return {
            user_id: userInfo.user_id,
            full_name: userInfo.full_name
          }
        }))
      }
    } else {
      this.alreadyAssignedUsers = []
    }

    this.statuscodes = await this.mainStore.getStatuscodes()

    this.loadDone = true
  },
  beforeDestroy() {
    memberNewDataSocket.removeOnmessageHandler(NEW_DATA_EVENTS.DISPATCH)
  }
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
