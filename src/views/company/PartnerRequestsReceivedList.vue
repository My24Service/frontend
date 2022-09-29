<template>
  <div class="app-grid">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-receievd-partner-request-modal"
      ref="delete-receievd-partner-request-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this partner request?') }}</p>
    </b-modal>

    <b-modal
      id="accept-receievd-partner-request-modal"
      ref="accept-receievd-partner-request-modal"
      v-bind:title="$trans('Accept?')"
      @ok="acceptRequest"
    >
      <p class="my-4">{{ $trans('Are you sure you want to accept this partner request?') }}</p>
    </b-modal>

    <b-modal
      id="reject-receievd-partner-request-modal"
      ref="reject-receievd-partner-request-modal"
      v-bind:title="$trans('Accept?')"
      @ok="rejectRequest"
    >
      <p class="my-4">{{ $trans('Are you sure you want to reject this partner request?') }}</p>
    </b-modal>

    <div class="subnav-pills">
      <PillsCompanyPartners />
    </div>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Request')"
      />

      <b-table
        id="partnerRequestsReceived-table"
        small
        :busy='isLoading'
        :fields="partnerRequestsReceivedFields"
        :items="partnerRequests"
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
                <ButtonLinkSearch
                  v-bind:method="function() { showSearchModal() }"
                />
              </b-button-group>
            </b-button-toolbar>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkDelete
              v-if="data.item.status !== 'requested'"
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
            <b-button
              v-if="data.item.status === 'requested'"
              @click="function() { showAcceptRequestModal(data.item.id) }"
              type="button"
              size="sm"
              variant="secondary"
            >
              {{ $trans('Accept') }}
            </b-button>
            &nbsp;
            <b-button
              v-if="data.item.status === 'requested'"
              @click="function() { showRejectRequestModal(data.item.id) }"
              type="button"
              size="sm"
              variant="warning"
            >
              {{ $trans('Reject') }}
            </b-button>

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
  </div>
</template>

<script>
import PillsCompanyPartners from '@/components/PillsCompanyPartners.vue'
import partnerRequestsReceivedModel from '@/models/company/PartnerRequestsReceived.js'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'PartnerRequestsReceivedList',
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
      model: partnerRequestsReceivedModel,
      isLoading: false,
      partnerRequests: [],
      partnerRequestsReceivedFields: [
        {key: 'from_member_view.name', label: this.$trans('Name'), sortable: true},
        {key: 'from_member_view.companycode', label: this.$trans('Company code'), sortable: true},
        {key: 'from_member_view.city', label: this.$trans('City'), sortable: true},
        {key: 'from_member_view.email', label: this.$trans('Email'), sortable: true},
        {key: 'status', label: this.$trans('Status'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'icons'},
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
    // requests
    showAcceptRequestModal(id) {
      this.pk = id
      this.$refs['accept-receievd-partner-request-modal'].show()
    },
    async acceptRequest() {
      try {
        await this.model.accept(this.pk)
        this.infoToast(this.$trans('Accepted'), this.$trans('Partner request has been accepted'))
        await this.loadData()
      } catch(error) {
        console.log('Error accepting partner request', error)
        this.errorToast(this.$trans('Error accepting partner request'))
      }
    },
    showRejectRequestModal(id) {
      this.pk = id
      this.$refs['reject-receievd-partner-request-modal'].show()
    },
    async rejectRequest() {
      try {
        await this.model.reject(this.pk)
        this.infoToast(this.$trans('Rejected'), this.$trans('Partner request has been rejected'))
        await this.loadData()
      } catch(error) {
        console.log('Error rejecting partner request', error)
        this.errorToast(this.$trans('Error rejecting partner request'))
      }
    },
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-receievd-partner-request-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Partner request has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting partner request', error)
        this.errorToast(this.$trans('Error deleting partner request'))
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
        console.log('error fetching partnerRequestsReceived', error);
        this.errorToast(this.$trans('Error loading partner requests sent'))
        this.isLoading = false
      }
    }
  }
}
</script>
