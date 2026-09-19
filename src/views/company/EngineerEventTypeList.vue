<template>
  <div class="mt-4">

    <div class="subnav-pills">
      <PillsNav :items="userPills" />
    </div>

    <PillsEngineer v-if="companycode === 'grm'" />

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-event-type-modal"
      ref="delete-event-type-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this event type?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Event type')"
      />

      <b-table
        id="event-type-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="eventTypes"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ActionButton icon="add"
                  router_name="engineer-event-type-add"
                  v-bind:title="$trans('New event type')"
                />
                <ActionButton icon="refresh"
                  v-bind:method="function() { loadData() }"
                  v-bind:title="$trans('Refresh')"
                />
                <ActionButton icon="search"
                  v-bind:method="function() { showSearchModal() }"
                />
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <RowAction icon="edit"
              router_name="engineer-event-type-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
            <RowAction icon="delete"
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
import engineerEventTypeModel from '../../models/company/EngineerEventType.js'
import RowAction from '../../components/RowAction.vue'
import ActionButton from '../../components/ActionButton.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import PillsNav, { useCompanyUserPills } from '../../components/PillsNav.vue'
import PillsEngineer from "./PillsEngineer";

import {errorToast, infoToast, $trans} from "@/services/i18n";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()
    const userPills = useCompanyUserPills()

    // expose to template and other options API hooks
    return {
      create,
      mainStore,
      userPills
    }
  },
  components: {
    RowAction,
    ActionButton,
    SearchModal,
    Pagination,
    PillsNav,
    PillsEngineer,
  },
  data() {
    return {
      companycode: null,
      searchQuery: null,
      model: engineerEventTypeModel,
      engineerEventTypeModelPk: null,
      isLoading: false,
      eventTypes: [],
      fields: [
        {key: 'event_type', label: $trans('Event type'), sortable: true},
        {key: 'measure_last_event_type', label: $trans('Measure last event type'), sortable: true},
        {key: 'statuscode_view.statuscode', label: $trans('Status'), sortable: true},
        {key: 'created', label: $trans('Created'), sortable: true},
        {key: 'modified', label: $trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.engineerEventTypeModelPk = id
      this.$refs['delete-event-type-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.engineerEventTypeModelPk)
        infoToast(this.create, $trans('Deleted'), $trans('Event type has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting event type', error)
        errorToast(this.create, $trans('Error deleting event type'))
      }
    },
    // rest
    async loadData() {
      // get companycode
      this.companycode = await this.mainStore.getMemberCompanycode

      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.eventTypes = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching event types', error)
        errorToast(this.create, $trans('Error loading event types'))
        this.isLoading = false
      }
    }
  }
}
</script>
