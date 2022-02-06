<template>
  <div class="container app-grid">
    <b-button @click="backToTop" id="btn-back-to-top">
      <b-icon-arrow-up-circle-fill></b-icon-arrow-up-circle-fill>
    </b-button>

    <b-modal
      id="dispatch-search-modal"
      ref="dispatch-search-modal"
      v-bind:title="$trans('Search')"
      @ok="handleSearchOk"
    >
      <form ref="search-form" @submit.stop.prevent="handleSearchSubmit">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Search')"
                label-for="search-query"
              >
                <b-form-input
                  size="sm"
                  autofocus
                  id="search-query"
                  ref="searchQuery"
                  v-model="searchQuery"
                ></b-form-input>
              </b-form-group>
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
        {{ $trans('Date') }}: {{ selectedOrder.order_date }}<br/>
        <span v-if="selectedOrder.order_reference != ''">
            {{ $trans('Reference') }}: {{ selectedOrder.order_reference }}<br/>
        </span>
      </template>

      <template #modal-footer="{ cancel }">
        <b-row>
          <b-col cols="2">
            <b-button size="sm" variant="info" @click="viewOrder">{{ $trans('Info') }}</b-button>
          </b-col>
          <b-col cols="2">
            <b-button size="sm" variant="primary" @click="editOrder">{{ $trans('Edit') }}</b-button>
          </b-col>
          <b-col cols="4">
            <b-button size="sm" variant="danger" @click="postUnassign">{{ $trans('Remove') }}</b-button>
          </b-col>
          <b-col cols="4">
            <b-button size="sm" @click="cancel()">{{ $trans('Cancel') }}</b-button>
          </b-col>
        </b-row>

      </template>
    </b-modal>

    <div v-if="assignMode && selectedOrders.length > 0">
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
      <b-col cols="2">
        <b-link class="px-1" @click.prevent="timeBackWeek" v-bind:title="$trans('Week back')">
          <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
        </b-link>
        &nbsp;
        <b-link class="px-1" @click.prevent="timeBack" v-bind:title="$trans('Day back') ">
          <b-icon-arrow-left-short font-scale="1.8"></b-icon-arrow-left-short>
        </b-link>
      </b-col>
      <b-col cols="8">
        <b-row>
          <b-col cols="3" class="my-auto">
            <div class="float-right">
              {{ $trans('show from:') }}
            </div>
          </b-col>
          <b-col cols="3">
            <b-form-datepicker
              v-model="startDate"
              size="sm"
              placeholder="Show data from"
              locale="nl"
              :date-format-options="{ day: '2-digit', month: '2-digit', year: 'numeric' }"
            ></b-form-datepicker>
          </b-col>
          <b-col cols="6" class="my-auto">
            <b-link @click="function() { loadToday() }">{{ $trans('today') }}</b-link>
            |
            <b-link @click="function() { showSearchModal() }">{{ $trans('search') }}</b-link>
            |
            <span v-if="newData">
              <b-link @click="function() { dispatch.drawDispatch() }">
                <span class="new-data">{{ $trans('dispatch changed, refresh now') }}</span></b-link>
            </span>
            <span v-if="!newData">
              <b-link @click="function() { dispatch.drawDispatch() }">{{ $trans('refresh') }}</b-link>
            </span>
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <b-link class="px-1" @click.prevent="timeForward" :title="$trans('Day forward')">
            <b-icon-arrow-right-short font-scale="1.8"></b-icon-arrow-right-short>
          </b-link>
          &nbsp;
          <b-link class="px-1" @click.prevent="timeForwardWeek" v-bind:title="$trans('Week forward') ">
            <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
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
import axios from 'axios';
import eachSeries from 'async/eachSeries';
import my24 from '@/services/my24';
import Dispatch from '@/services/dispatch';
import orderModel from '@/models/orders/Order';
import assign from '@/models/mobile/Assign';
import Socket from '@/socket'
const moment = require('moment')

export default {
  name: 'Dispatch',
  props: {
    assignModeProp: {
      type: [Boolean],
      default: false
    },
  },
  data() {
    return {
      scrollTopButton: null,
      searchQuery: null,
      buttonDisabled: false,
      assignMode: false,
      selectedOrders: [],
      selectedOrderIds: [],
      selectedUsers: [],
      selectedOrder: null,
      selectedOrderUserId: null,
      dispatch: null,
      showOverlay: false,
      startDate: null,
      newData: false
    }
  },
  watch: {
    startDate: function(val) {
      this.dispatch.setStartDate(val)
      this.dispatch.drawDispatch()
    }
  },
  methods: {
    backToTop() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    },
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['dispatch-search-modal'].hide()
      this.$bvModal.hide('dispatch-search-modal')

      setTimeout(() => {
        this.dispatch.setSearchQuery(this.searchQuery)
        this.dispatch.search()
      }, 500)
    },
    showSearchModal() {
      this.$refs['dispatch-search-modal'].show()
    },
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
    openActionsModal(order_pk) {
      this.dispatch.hideTipCanvas()

      orderModel.detail(order_pk)
        .then((order) => {
          this.selectedOrder = order;
          this.$refs['dispatch-order-actions-modal'].show();
        })
        .catch((error) => {
          console.log('error fetching order', error);
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error fetching order')
          });
        })

    },
    async assignToUser(user_id, callback) {
      if (this.selectedOrderIds.length === 0) {
        for (let i=0; i<this.selectedOrders.length; i++) {
          this.selectedOrderIds.push(this.selectedOrders[i].order_id);
        }
      }

      this.$store.dispatch('getCsrfToken').then(async token => {
        try {
          await assign.assignToUser(token, user_id, this.selectedOrderIds, true)
          callback()
        } catch (e) {
          callback(e)
        }
      })
    },
    assignToUsers() {
      this.showOverlay = true
      this.buttonDisabled = true;
      let user_ids = [];
      for (let i=0; i<this.selectedUsers.length; i++) {
        user_ids.push(this.selectedUsers[i].user_id)
      }

      eachSeries(user_ids, this.assignToUser, (err) => {
        if (err) {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error assigning order(s)')
          })

          this.showOverlay = false
        } else {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Success'),
            message: this.$trans('Order(s) assigned')
          })

          this.cancelAssign()
          this.dispatch.drawDispatch()
          this.buttonDisabled = false
        }
      });
    },
    postUnassign() {
      this.showOverlay = true

      this.$refs['dispatch-order-actions-modal'].hide();
      this.$root.$once('bv::modal::hidden', async (bvEvent, modalId) => {
        try {
          this.$store.dispatch('getCsrfToken').then(async token => {
            await assign.unAssign(token, this.selectedOrderUserId, this.selectedOrder.id)

            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Success'),
              message: this.$trans('Order unassigned')
            })

            this.showOverlay = false
            this.dispatch.drawDispatch()
          })
        } catch (error) {
          console.log('error unassigning', error)
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error unassigning order')
          })

          this.showOverlay = false
        }
      })
    },
    cancelAssign() {
      this.selectedUsers = [];
      this.selectedOrders = [];
      this.assignMode = false;
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
      if (data.type === 'dispatch') {
        this.newData = true
      }
    }
  },
  mounted() {
    const memberPk = this.$store.getters.getMemberPk
    Socket.getSocketMemberNewData(memberPk)
    Socket.setOnmessageHandlerMemberNewData(memberPk, this.onNewData)

    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.scrollTopButton = document.getElementById('btn-back-to-top')
    this.assignMode = this.assignModeProp

    if (this.assignMode) {
      this.$store.dispatch('getAssignOrders').then((orders) => {
        this.selectedOrders = orders
      })
    }

    this.$store.dispatch('getStatuscodes').then((statuscodes) => {
      const canvas = this.$refs['dispatch-canvas'];
      const tipCanvas = this.$refs['dispatch-tip-canvas'];

      this.dispatch = new Dispatch(canvas, tipCanvas, statuscodes, this);
      this.startDate = this.dispatch.startDate.toDate();
      this.setHandlers();
    }).catch((error) => {
      console.log('error in get statuscodes', error);
    });
  },
  beforeDestroy() {
    const memberPk = this.$store.getters.getMemberPk
    Socket.removeOnmessageHandlerMemberNewData(memberPk)
    Socket.removeSocketMemberNewData(memberPk)
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
</style>
