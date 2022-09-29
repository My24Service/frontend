<template>
  <div class="app-grid">

    <div class="subnav-pills">
      <PillsCompanyPartners />
    </div>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-partner-modal"
      ref="delete-partner-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this partner relation?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Partner')"
      />

      <b-table
        id="partner-table"
        small
        :busy='isLoading'
        :fields="partnerFields"
        :items="partners"
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
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
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
      </b-table>
    </div>
  </div>
</template>

<script>
import PillsCompanyPartners from '@/components/PillsCompanyPartners.vue'
import partnerModel from '@/models/company/Partner.js'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'PartnerList',
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
      model: partnerModel,
      isLoading: false,
      partners: [],
      partnerFields: [
        {key: 'partner_view.name', label: this.$trans('Name'), sortable: true},
        {key: 'partner_view.companycode', label: this.$trans('Company code'), sortable: true},
        {key: 'partner_view.city', label: this.$trans('City'), sortable: true},
        {key: 'partner_view.email', label: this.$trans('Email'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
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
      this.$refs['delete-partner-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('partner has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting partner', error)
        this.errorToast(this.$trans('Error deleting partner'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.partners = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching partners', error);
        this.errorToast(this.$trans('Error loading partners'))
        this.isLoading = false
      }
    }
  }
}
</script>
