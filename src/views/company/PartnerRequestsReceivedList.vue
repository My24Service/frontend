<template>
  <div class="app-grid">

    <b-modal
      id="search-modal"
      ref="search-modal"
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

    <b-pagination
      v-if="this.partnerRequestsReceivedModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.partnerRequestsReceivedModel.count"
      :per-page="this.partnerRequestsReceivedModel.perPage"
      aria-controls="partnerRequestsReceived-table"
    ></b-pagination>

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
</template>

<script>
import PillsCompanyPartners from '@/components/PillsCompanyPartners'
import partnerRequestsReceivedModel from '@/models/company/PartnerRequestsReceived'
import IconLinkDelete from '@/components/IconLinkDelete'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'

export default {
  name: 'PartnerRequestsReceivedList',
  components: {
    PillsCompanyPartners,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      partnerRequestsReceivedModel,
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
  watch: {
    currentPage: function(val) {
      this.partnerRequestsReceivedModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.partnerRequestsReceivedModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      partnerRequestsReceivedModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showAcceptRequestModal(id) {
      this.pk = id
      this.$refs['accept-receievd-partner-request-modal'].show()
    },
    acceptRequest() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        partnerRequestsReceivedModel.accept(token, this.pk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Accepted'),
            message: this.$trans('Partner request has been accepted')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error accepting partner request')
          })
        })
      })
    },
    showRejectRequestModal(id) {
      this.pk = id
      this.$refs['reject-receievd-partner-request-modal'].show()
    },
    rejectRequest() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        partnerRequestsReceivedModel.reject(token, this.pk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Rejected'),
            message: this.$trans('Partner request has been rejected')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error rejecting partner request')
          })
        })
      })
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-receievd-partner-request-modal'].show()
    },
    doDelete(id) {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        partnerRequestsReceivedModel.delete(token, this.pk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Partner request has been deleted')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting partner request')
          })
        })
      })
    },
    loadData() {
      this.isLoading = true;

      partnerRequestsReceivedModel.list().then((data) => {
        this.partnerRequests = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching partnerRequestsReceived', error);
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading partner requests sent')
        })

        this.isLoading = false
      })
    }
  }
}
</script>
