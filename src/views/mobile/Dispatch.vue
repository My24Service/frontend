<template>
  <div class="container app-grid">
    <b-button @click="backToTop" id="btn-back-to-top">
      <b-icon-arrow-up-circle-fill></b-icon-arrow-up-circle-fill>
    </b-button>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="dispatch-change-date-modal"
      ref="dispatch-change-date-modal"
      v-bind:title="$trans('Change date')"
      @ok="changeDateOk"
      v-if="assignedOrder !== null"
    >
      <form ref="change-date-form" @submit.stop.prevent="changeDateSubmit">
        <b-container fluid>
          <b-row role="group">
            <b-col size="6">
              <b-form-group
                v-bind:label="$trans('Start date')"
                label-for="alt-start-date"
              >
                <b-form-datepicker
                  id="alt-start-date"
                  size="sm"
                  class="p-sm-0"
                  v-model="assignedOrder.alt_start_date"
                  v-bind:placeholder="$trans('Choose a date')"
                  locale="nl"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                  :min="minDate"
                  :max="maxDate"
                  value-as-date
                ></b-form-datepicker>
              </b-form-group>
            </b-col>
            <b-col size="6">
              <b-form-group
                v-bind:label="$trans('Start time')"
                label-for="alt-start-time"
              >
              <b-form-timepicker
                id="alt-start-time"
                size="sm"
                v-model="assignedOrder.alt_start_time"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a time')"
                :hour12=false
              ></b-form-timepicker>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
            <b-col size="6">
              <b-form-group
                v-bind:label="$trans('End date')"
                label-for="alt-end-date"
              >
                <b-form-datepicker
                  id="alt-end-date"
                  size="sm"
                  class="p-sm-0"
                  v-model="assignedOrder.alt_end_date"
                  v-bind:placeholder="$trans('Choose a date')"
                  locale="nl"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                  :min="minDate"
                  :max="maxDate"
                  value-as-date
                ></b-form-datepicker>
              </b-form-group>
            </b-col>
            <b-col size="6">
              <b-form-group
                v-bind:label="$trans('End time')"
                label-for="alt-end-time"
              >
              <b-form-timepicker
                id="alt-end-time"
                size="sm"
                v-model="assignedOrder.alt_end_time"
                class="mb-2"
                v-bind:placeholder="$trans('Choose a time')"
                :hour12=false
              ></b-form-timepicker>
            </b-form-group>
          </b-col>
          </b-row>
          <b-row>
            <b-col size="6"></b-col>
            <b-col size="6" class="text-right">
              <b-link class="px-1" title="clear" v-on:click.native="clearAssignedorderDates()">
                {{ $trans('clear') }}
              </b-link>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-modal
      id="dispatch-order-actions-modal"
      ref="dispatch-order-actions-modal"
      v-bind:title="$trans('Order actions')"
    >
      <template #default="">
        {{ $trans('Order') }} {{ selectedOrder.order_id }}<br/>
        {{ selectedOrder.order_name }}<br/>
        {{ selectedOrder.order_address }}<br/>
        {{ selectedOrder.order_postal }} {{ selectedOrder.order_city }}<br/>
        {{ $trans('Order date') }}: {{ selectedOrder.order_date }}<br/>
        <span v-if="assignedOrder && assignedOrder.assignedorder_date != ''">
            {{ $trans('User date') }}: {{ assignedOrder.assignedorder_date }}<br/>
        </span>
        <span v-if="selectedOrder.order_reference != ''">
            {{ $trans('Reference') }}: {{ selectedOrder.order_reference }}<br/>
        </span>
      </template>

      <template #modal-footer="{ cancel }">
        <b-row>
          <b-col cols="1" class="mx-1">
            <b-button size="sm" variant="info" @click="viewOrder">{{ $trans('Info') }}</b-button>
          </b-col>
          <b-col cols="1" class="mx-1">
            <b-button size="sm" variant="primary" @click="editOrder">{{ $trans('Edit') }}</b-button>
          </b-col>
          <b-col cols="4" class="mx-1" v-if="assignedOrder">
            <b-button size="sm" variant="primary" @click="changeDate">{{ $trans('Change date') }}</b-button>
          </b-col>
          <b-col cols="4" class="mx-1" v-if="!assignedOrder">&nbsp;</b-col>
          <b-col cols="2" class="mx-1">
            <b-button size="sm" variant="danger" @click="postUnassign">{{ $trans('Remove') }}</b-button>
          </b-col>
          <b-col cols="2" class="mx-1">
            <b-button size="sm" @click="cancel()">{{ $trans('Close') }}</b-button>
          </b-col>
        </b-row>

      </template>
    </b-modal>

    <div class="heading" v-if="assignMode && selectedOrders.length > 0">
      <b-row>
        <b-col cols="12">
          <strong>{{ $trans('Selected orders') }}:</strong>&nbsp;
          <span v-for="(order, index) in selectedOrders" :key="order.id">
            {{ order.order_id }}
            <b-link class="px-1" @click.prevent="removeSelectedOrder(index)">[ x ]</b-link>
          </span>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <strong>{{ $trans('Selected users') }}:</strong>&nbsp;
          <span v-for="(user, index) in selectedUsers" :key="user.submodel_id">
            {{ user.full_name }}
            <b-link class="px-1" @click.prevent="removeSelectedUser(index)">[ x ]</b-link>
          </span>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12">
          <footer class="modal-footer">
            <b-button @click="cancelAssign" :disabled="buttonDisabled" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="assignToUsers" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </b-col>
      </b-row>
    </div>

    <b-row class="py-2">
      <b-col cols="1">
        <b-link class="px-1" @click.prevent="timeBackWeek" v-bind:title="$trans('Week back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
        &nbsp;
        <b-link class="px-1" @click.prevent="timeBack" v-bind:title="$trans('Day back') ">
          <b-icon-arrow-left-short font-scale="1.8"></b-icon-arrow-left-short>
        </b-link>
      </b-col>
      <b-col cols="10">
        <b-row>
          <b-col cols="2" class="my-auto">
            <b-form-datepicker
              v-model="startDate"
              size="sm"
              placeholder="Start date"
              locale="nl"
              :date-format-options="{ day: '2-digit', month: '2-digit', year: 'numeric' }"
            ></b-form-datepicker>
          </b-col>
          <b-col cols="6" class="my-auto">
            <b-link @click="function() { loadToday() }">{{ $trans('today') }}</b-link>
            |
            <b-link @click="function() { showSearchModal() }">{{ $trans('search') }}</b-link>
            |
            <span v-if="newData && !showOverlay">
              <b-link @click="function() { dispatch.drawDispatch() }">
                <span class="new-data">{{ $trans('dispatch changed, refresh now') }}</span></b-link>
            </span>
            <span v-if="!newData">
              <b-link @click="function() { dispatch.drawDispatch() }">{{ $trans('refresh') }}</b-link>
            </span>
          </b-col>
          <b-col cols="4" class="float-right">
            <div>
              <b-form-radio-group
                v-model="mode"
                :options="modeOptions"
                class="mb-1"
                value-field="item"
                text-field="name"
              ></b-form-radio-group>
            </div>
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="1">
        <div class="float-right">
          <b-link class="px-1" @click.prevent="timeForwardWeek" v-bind:title="$trans('Week forward') ">
            <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
          </b-link>
          &nbsp;
          <b-link class="px-1" @click.prevent="timeForward" :title="$trans('Day forward')">
            <b-icon-arrow-right-short font-scale="1.8"></b-icon-arrow-right-short>
          </b-link>
        </div>
      </b-col>
    </b-row>
    <b-overlay :show="showOverlay" rounded="sm">
      <canvas ref="dispatch-canvas" class="dispatchCanvas" width=1080 height=300 @mousemove="mousemove" @click="click"></canvas>
      <canvas id="tip" ref="dispatch-tip-canvas" width=200 height=100></canvas>
    </b-overlay>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import Dispatch from '../../services/dispatch.js'
import orderModel from '../../models/orders/Order.js'
import assignedOrderModel from '../../models/mobile/AssignedOrder.js'
import assign from '../../models/mobile/Assign.js'
import SearchModal from '../../components/SearchModal.vue'
import MemberNewDataSocket from '../../services/websocket/MemberNewDataSocket.js'
import {NEW_DATA_EVENTS} from '../../constants';

const memberNewDataSocket = new MemberNewDataSocket()

export default {
  name: 'DispatchComponent',
  components: {
    SearchModal,
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
      modeOptions: [
        { item: 'compact', name: this.$trans('Compact') },
        { item: 'wide', name: this.$trans('Wide') },
      ],
      scrollTopButton: null,
      searchQuery: null,
      buttonDisabled: false,
      assignMode: false,
      selectedOrders: [],
      selectedOrderIds: [],
      selectedUsers: [],
      selectedOrder: null,
      selectedOrderUserId: null,
      assignedOrder: null,
      assignedOrderPk: null,
      dispatch: null,
      showOverlay: false,
      startDate: null,
      newData: false,
      minDate: null,
      maxDate: null
    }
  },
  watch: {
    mode: function(val) {
      localStorage.setItem('displayMode', JSON.stringify(val))
      this.dispatch.setMode(val)
      this.dispatch.drawDispatch()
    },
    startDate: function(val) {
      this.dispatch.setStartDate(val)
      this.dispatch.drawDispatch()
    }
  },
  methods: {
    // dates
    clearAssignedorderDates() {
      this.assignedOrder.alt_start_date = null
      this.assignedOrder.alt_end_date = null
      this.assignedOrder.alt_start_time = null
      this.assignedOrder.alt_end_time = null
    },
    changeDate() {
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
          await assignedOrderModel.updateDetailChangeDate(this.assignedOrderPk, this.assignedOrder)
          this.$refs['dispatch-change-date-modal'].hide();
          this.showOverlay = false
          this.dispatch.drawDispatch()
        } catch(error) {
          console.log('error updating assignedOrder dates', error)
          this.errorToast(this.$trans('Error updating dates'))
          this.showOverlay = false
        }
    },
    // nav
    backToTop() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      setTimeout(() => {
        this.dispatch.setSearchQuery(val)
        this.dispatch.search()
      }, 500)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // rest
    loadToday() {
      this.dispatch.loadToday()
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
    async openActionsModal(order_pk, assignedorder_pk) {
      this.dispatch.hideTipCanvas()
      this.assignedOrderPk = assignedorder_pk

      try {
        this.showOverlay = true
        this.selectedOrder = await orderModel.detail(order_pk)

        if (assignedorder_pk) {
          this.assignedOrder = await assignedOrderModel.getDetailChangeDate(assignedorder_pk)

          this.assignedOrder.alt_start_date = this.$moment(this.assignedOrder.alt_start_date, 'DD/MM/YYYY').toDate()
          this.assignedOrder.alt_end_date = this.$moment(this.assignedOrder.alt_end_date, 'DD/MM/YYYY').toDate()

          this.minDate = this.assignedOrder.order_start_date
          this.maxDate = this.assignedOrder.order_end_date
        } else {
          this.assignedOrder = null
        }
        this.showOverlay = false
        this.$refs['dispatch-order-actions-modal'].show();
      } catch (error) {
          console.log('error fetching order', error)
          this.errorToast(this.$trans('Error fetching order'))
      }
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
          await assign.assignToUser(user_id, this.selectedOrderIds, true)
        }

        this.infoToast(this.$trans('Success'), this.$trans('Order(s) assigned'))
        this.cancelAssign()
        this.dispatch.drawDispatch()
        this.buttonDisabled = false
        this.showOverlay = false
      } catch (e) {
        this.errorToast(this.$trans('Error assigning order(s)'))
        this.showOverlay = false
        this.buttonDisabled = false
      }
    },
    postUnassign() {
      this.showOverlay = true

      this.$refs['dispatch-order-actions-modal'].hide();
      this.$root.$once('bv::modal::hidden', async (bvEvent, modalId) => {
        try {
          await assign.unAssign(this.selectedOrderUserId, this.selectedOrder.id)
          this.infoToast(this.$trans('Success'), this.$trans('Order removed from planning'))
          this.showOverlay = false
          this.dispatch.drawDispatch()
        } catch (error) {
          console.log('error un-assigning', error)
          this.errorToast(this.$trans('Error un-assigning order'))
          this.showOverlay = false
        }
      })
    },
    cancelAssign() {
      this.selectedUsers = [];
      this.selectedOrders = [];
      this.assignMode = false;
      this.$store.dispatch('setAssignOrders', this.selectedOrders)
    },
    removeSelectedOrder(index) {
      this.selectedOrders.splice(index, 1);
    },
    removeSelectedUser(index) {
      this.selectedUsers.splice(index, 1);
    },
    timeForwardWeek() {
      this.dispatch.timeForwardWeek();
    },
    timeForward() {
      this.dispatch.timeForward();
    },
    timeBackWeek() {
      this.dispatch.timeBackWeek();
    },
    timeBack() {
      this.dispatch.timeBack();
    },
    mousemove(e) {
      this.dispatch.handleMouseMove(e);
    },
    click(e) {
      this.dispatch.handleClick(e);
    },
    setHandlers() {
      window.onscroll = (e) => {
        this.dispatch.reOffset()

        if (
          document.body.scrollTop > 20 ||
          document.documentElement.scrollTop > 20
        ) {
          this.scrollTopButton.style.display = "block"
        } else {
          this.scrollTopButton.style.display = "none"
        }
      }

      window.onresize = (e) => {
        this.dispatch.reOffset();
      };
    },
    onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.DISPATCH) {
        this.newData = true
      }
    }
  },
  async mounted() {
    await memberNewDataSocket.init(NEW_DATA_EVENTS.DISPATCH)
    memberNewDataSocket.setOnmessageHandler(this.onNewData)
    memberNewDataSocket.getSocket()

    const displayMode = JSON.parse(localStorage.getItem('displayMode'))
    const mode = displayMode ? displayMode : 'wide'

    const lang = this.$store.getters.getCurrentLanguage
    const monday = lang === 'en' ? 1 : 0
    this.$moment = moment
    this.$moment.locale(lang)

    this.scrollTopButton = document.getElementById('btn-back-to-top')
    this.assignMode = this.assignModeProp

    if (this.assignMode) {
      this.selectedOrders = await this.$store.dispatch('getAssignOrders')
    }

    const statuscodes = await this.$store.dispatch('getStatuscodes')
    const canvas = this.$refs['dispatch-canvas']
    const tipCanvas = this.$refs['dispatch-tip-canvas']

    this.dispatch = new Dispatch(canvas, tipCanvas, statuscodes, this, monday)
    this.mode = mode
    // this.dispatch.setMode(mode)
    // this.startDate = this.dispatch.startDate.toDate()
    this.setHandlers()
  },
  beforeDestroy() {
    memberNewDataSocket.removeOnmessageHandler(NEW_DATA_EVENTS.DISPATCH)
  }
}
</script>

<style scoped>
span.new-data {
  color: red;
  font-style: italic;
  font-weight: bold;
}
#tip {
  background-color:white;
  border:1px solid blue;
  position:absolute;
  left:-2000px;
}
.dispatchCanvas {
  position: relative !important;
  width: 1080px;
}
#btn-back-to-top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: none;
}
.heading {
  position: sticky;
  top: 0;
  background: #fff;
  opacity: .9;
  z-index: 1000;
}
</style>
