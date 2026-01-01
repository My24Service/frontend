<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><b-icon icon="person-square"></b-icon>{{ $trans('Partners') }}</h3>
        <b-button-toolbar>
          <b-button-group>
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
          </b-button-group>
          <router-link :to="{name: 'partner-request-add'}" class="btn">{{$trans('New partner request')}}</router-link>

        </b-button-toolbar>
      </div>
    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-partner-request-modal"
      ref="delete-partner-request-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this partner request?') }}</p>
    </b-modal>

    <div class="page-detail panel">
      <PillsCompanyPartners />


      <b-table
        id="partnerRequestsSent-table"
        small
        :busy='isLoading'
        :fields="partnerRequestsSentFields"
        :items="partnerRequests"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">

          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Request')"
      />
  </div>
</template>

<script>
import partnerRequestsSentModel from '@/models/company/PartnerRequestsSent.js'
import PillsCompanyPartners from '@/components/PillsCompanyPartners.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  name: 'PartnerRequestsSentList',
  components: {
    PillsCompanyPartners,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      pk: null,
      searchQuery: null,
      model: partnerRequestsSentModel,
      isLoading: false,
      partnerRequests: [],
      partnerRequestsSentFields: [
        {key: 'to_member_view.name', label: $trans('Name'), sortable: true},
        {key: 'to_member_view.companycode', label: $trans('Company code'), sortable: true},
        {key: 'to_member_view.city', label: $trans('City'), sortable: true},
        {key: 'to_member_view.email', label: $trans('Email'), sortable: true},
        {key: 'status', label: $trans('Status'), sortable: true},
        {key: 'created', label: $trans('Created'), sortable: true},
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
      this.pk = id
      this.$refs['delete-partner-request-modal'].show()
    },
    async doDelete() {
      try {
        this.model.delete(this.pk)
        infoToast(create, $trans('Deleted'), $trans('Partner request has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting partner request', error)
        errorToast(create, $trans('Error deleting partner request'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.partnerRequests = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching partnerRequestsSent', error)
        errorToast(create, $trans('Error loading partner requests sent'))
        this.isLoading = false
      }
    }
  }
}
</script>
