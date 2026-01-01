<template>
  <div class="mt-4">

    <div class="subnav-pills">
      <PillsCompanyUsers />
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
                <ButtonLinkAdd
                  router_name="engineer-event-type-add"
                  v-bind:title="$trans('New event type')"
                />
                <ButtonLinkRefresh
                  v-bind:method="function() { loadData() }"
                  v-bind:title="$trans('Refresh')"
                />
                <ButtonLinkSearch
                  v-bind:method="function() { showSearchModal() }"
                />
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="engineer-event-type-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
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
import engineerEventTypeModel from '../../models/company/EngineerEventType.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import PillsEngineer from "./PillsEngineer";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    PillsCompanyUsers,
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
        infoToast(create, $trans('Deleted'), $trans('Event type has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting event type', error)
        errorToast(create, $trans('Error deleting event type'))
      }
    },
    // rest
    async loadData() {
      // get companycode
      this.companycode = await this.$store.getters.getMemberCompanycode

      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.eventTypes = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching event types', error)
        errorToast(create, $trans('Error loading event types'))
        this.isLoading = false
      }
    }
  }
}
</script>
