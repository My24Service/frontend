<template>
  <div class="app-grid">

    <div class="subnav-pills">
      <PillsCompanyUsers />
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
      id="delete-salesuser-modal"
      ref="delete-salesuser-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this sales user?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.salesUserModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.salesUserModel.count"
      :per-page="this.salesUserModel.perPage"
      aria-controls="salesuser-table"
    ></b-pagination>

    <b-table
      id="salesuser-table"
      small
      :busy='isLoading'
      :fields="salesuserFields"
      :items="salesusers"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="salesuser-add"
                v-bind:title="$trans('New sales user')"
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
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="salesuser-edit"
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
</template>

<script>
import PillsCompanyUsers from '@/components/PillsCompanyUsers.vue'
import salesUserModel from '@/models/company/UserSales.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'

export default {
  name: 'UserSalesList',
  components: {
    PillsCompanyUsers,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkAdd,
    ButtonLinkRefresh,
    ButtonLinkSearch
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      salesUserModel,
      isLoading: false,
      salesusers: [],
      salesuserFields: [
        {key: 'full_name', label: this.$trans('Name'), sortable: true},
        {key: 'username', label: this.$trans('Username'), sortable: true},
        {key: 'email', label: this.$trans('Email'), sortable: true},
        {key: 'last_login', label: this.$trans('Last login'), sortable: true},
        {key: 'date_joined', label: this.$trans('Date joined'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.salesUserModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.salesUserModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      salesUserModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-salesuser-modal'].show()
    },
    async doDelete() {
      try {
        await salesUserModel.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Sales user has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('Error deleting sales user', error)
        this.errorToast(this.$trans('Error deleting sales user'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await salesUserModel.list()
        this.salesusers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching salesusers', error)
        this.errorToast(this.$trans('Error loading sales users'))
        this.isLoading = false
      }
    }
  }
}
</script>
