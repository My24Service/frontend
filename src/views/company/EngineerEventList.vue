<template>
  <div class="mt-4">

    <div class="subnav-pills">
      <PillsCompanyUsers />
    </div>

    <PillsEngineer v-if="companycode === 'grm'" />

    <b-modal
      id="delete-event-modal"
      ref="delete-event-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this event?') }}</p>
    </b-modal>

    <EngineerEventOrderForm
      id="attach-order-modal"
      ref="attach-order-modal"
      @assigned="assignedOk"
    />

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Event')"
      />

      <b-table
        id="event-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="events"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkRefresh
                  v-bind:method="function() { loadData() }"
                  v-bind:title="$trans('Refresh')"
                />
                <ButtonLinkDownload
                  v-bind:method="function() { downloadList() }"
                  v-bind:title="$trans('Download events')"
                />
              </b-button-group>
            </b-button-toolbar>
          </div>
        </template>
        <template #cell(secs_since_last_measure_event_type)="data">
          <span v-if="data.item.secs_since_last_measure_event_type">
            {{ displayDurationFromSeconds(data.item.secs_since_last_measure_event_type) }}
          </span>
        </template>
        <template #cell(event_dts)="data">
          {{ moment(data.item.event_dts).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template #cell(assigned_order)="data">
          <span v-if="data.item.assigned_order">
            {{ data.item.assigned_order.order_name }}, {{ data.item.assigned_order.order_city }}
          </span>
          <span v-if="!data.item.assigned_order && data.item.last_measure_event">
              <b-button @click="function() { showOrderModal(data.item.id, data.item.user_id) }"
                        class="btn btn-info" type="button" variant="primary"
              >
            {{ $trans("No order, create one") }}
              </b-button>
          </span>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import engineerEventModel from '../../models/company/EngineerEvent.js'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import Pagination from "../../components/Pagination.vue"
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import PillsEngineer from "./PillsEngineer";

import EngineerEventOrderForm from "./EngineerEventOrderForm";
import {NEW_DATA_EVENTS} from "../../constants";
import MemberNewDataSocket from "../../services/websocket/MemberNewDataSocket";
import my24 from "../../services/my24";
import ButtonLinkDownload from "../../components/ButtonLinkDownload";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

const memberNewDataSocket = new MemberNewDataSocket()

export default {

  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    Pagination,
    PillsCompanyUsers,
    PillsEngineer,
    EngineerEventOrderForm,
    ButtonLinkDownload,
  },
  data() {
    return {
      moment,
      companycode: null,
      searchQuery: null,
      model: engineerEventModel,
      engineerEventModelPk: null,
      isLoading: false,
      events: [],
      fields: [
        {key: 'engineer_name', label: $trans('Engineer')},
        {key: 'event_dts', label: $trans('Date')},
        {key: 'event_type', label: $trans('Type')},
        {key: 'measure_last_event_type', label: $trans('Last event')},
        {key: 'secs_since_last_measure_event_type', label: $trans('Last event duration')},
        {key: 'assigned_order', label: $trans('Order')},
        {key: 'created', label: $trans('Created')},
        {key: 'icons'}
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // download
    downloadList() {
      if (confirm($trans('Are you sure you want to export all events?'))) {
        const url = "/company/events-export-xls/"

        my24.downloadItem(url, 'events.xlsx')
      }
    },
    // create order
    showOrderModal(event_id, engineer_user_id) {
      this.$refs['attach-order-modal'].show(event_id, engineer_user_id)
    },
    assignedOk() {
      infoToast(create, $trans('Assigned'), $trans('Order created and assigned'))
    },

    // delete
    showDeleteModal(id) {
      this.engineerEventTypeModelPk = id
      this.$refs['delete-event-type-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.engineerEventModelPk)
        infoToast(create, $trans('Deleted'), $trans('Event has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting event', error)
        errorToast(create, $trans('Error deleting event'))
      }
    },
    // rest
    async loadData() {
      // get companycode
      this.companycode = await this.$store.getters.getMemberCompanycode

      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.events = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching events', error)
        errorToast(create, $trans('Error loading events'))
        this.isLoading = false
      }
    },
    async onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.ENGINEER_EVENT) {
        await this.loadData()
      }
    },
  },
  async mounted() {
    await memberNewDataSocket.init(NEW_DATA_EVENTS.ENGINEER_EVENT)
    memberNewDataSocket.setOnmessageHandler(this.onNewData)
    memberNewDataSocket.getSocket()
  },
  beforeDestroy() {
    memberNewDataSocket.removeOnmessageHandler(NEW_DATA_EVENTS.ENGINEER_EVENT)
  },
}
</script>
