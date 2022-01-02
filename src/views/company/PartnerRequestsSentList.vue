<template>
  <div class="app-grid">

    <div class="subnav-pills">
      <PillsCompanyPartners />
    </div>

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
      id="delete-partner-request-modal"
      ref="delete-partner-request-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this partner request?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.partnerRequestsSentModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.partnerRequestsSentModel.count"
      :per-page="this.partnerRequestsSentModel.perPage"
      aria-controls="partnerRequestsSent-table"
    ></b-pagination>

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
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="partner-request-add"
                v-bind:title="$trans('New partner request')"
              />
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
</template>

<script>
import PillsCompanyPartners from '@/components/PillsCompanyPartners'
import partnerRequestsSentModel from '@/models/company/PartnerRequestsSent'
import IconLinkDelete from '@/components/IconLinkDelete'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'

export default {
  name: 'PartnerRequestsSentList',
  components: {
    PillsCompanyPartners,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      partnerRequestsSentModel,
      isLoading: false,
      partnerRequests: [],
      partnerRequestsSentFields: [
        {key: 'to_member_view.name', label: this.$trans('Name'), sortable: true},
        {key: 'to_member_view.companycode', label: this.$trans('Company code'), sortable: true},
        {key: 'to_member_view.city', label: this.$trans('City'), sortable: true},
        {key: 'to_member_view.email', label: this.$trans('Email'), sortable: true},
        {key: 'status', label: this.$trans('Status'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.partnerRequestsSentModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.partnerRequestsSentModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      partnerRequestsSentModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-partner-request-modal'].show()
    },
    doDelete(id) {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        partnerRequestsSentModel.delete(token, this.pk).then(() => {
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

      partnerRequestsSentModel.list().then((data) => {
        this.partnerRequests = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching partnerRequestsSent', error);
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
