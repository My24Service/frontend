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
              </b-button-group>
            </b-button-toolbar>
          </div>
        </template>
        <template #cell(secs_since_last_measure_event_type)="data">
          {{ displayDurationFromSeconds(data.item.secs_since_last_measure_event_type) }}
        </template>
        <template #cell(assigned_order)="data">
          <span v-if="data.item.assigned_order">
            {{ data.item.assigned_order.order_name }}, {{ data.item.assigned_order.order_city }}
          </span>
          <span v-if="!data.item.assigned_order">
            {{ $trans("No order") }}
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
import engineerEventModel from '../../models/company/EngineerEvent.js'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import Pagination from "../../components/Pagination.vue"
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import PillsEngineer from "./PillsEngineer";
import {componentMixin} from "../../utils";

export default {
  mixins: [componentMixin],
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    Pagination,
    PillsCompanyUsers,
    PillsEngineer,
  },
  data() {
    return {
      companycode: null,
      searchQuery: null,
      model: engineerEventModel,
      engineerEventModelPk: null,
      isLoading: false,
      events: [],
      fields: [
        {key: 'engineer_name', label: this.$trans('Engineer')},
        {key: 'event_dts', label: this.$trans('Date')},
        {key: 'event_type', label: this.$trans('Type')},
        {key: 'measure_last_event_type', label: this.$trans('Last event')},
        {key: 'secs_since_last_measure_event_type', label: this.$trans('Last event duration')},
        {key: 'assigned_order', label: this.$trans('Order')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'icons'}
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // delete
    showDeleteModal(id) {
      this.engineerEventTypeModelPk = id
      this.$refs['delete-event-type-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.engineerEventModelPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Event has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting event', error)
        this.errorToast(this.$trans('Error deleting event'))
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
        this.errorToast(this.$trans('Error loading events'))
        this.isLoading = false
      }
    }
  }
}
</script>
