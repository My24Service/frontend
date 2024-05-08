<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="people"></b-icon>{{ $trans("People") }}</h3>
        <div>
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
            <b-link :to="{name: 'planninguser-add'}" class="btn primary"><b-icon icon="person-plus"></b-icon>{{ $trans("Add planner") }}</b-link>
          </b-button-toolbar>
        </div>
      </div>
    </header>


    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-planninguser-modal"
      ref="delete-planninguser-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this planning user?') }}</p>
    </b-modal>

    <div class="page-details panel">

      <PillsCompanyUsers />
      <br>


      <b-table
        id="planninguser-table"
        small
        :busy='isLoading'
        :fields="planninguserFields"
        :items="planningusers"
        responsive="md"
        class="data-table"
        sort-icon-left
      >

        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(full_name)="data">
          <router-link :to="{name:'planninguser-edit', params : {pk: data.item.id} }">{{ data.item.full_name }}</router-link>
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
    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Planning user')"
    />
  </div>
</template>

<script>
import planningUserModel from '@/models/company/UserPlanning.js'
import PillsCompanyUsers from '@/components/PillsCompanyUsers.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'UserPlanningList',
  components: {
    PillsCompanyUsers,
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
      model: planningUserModel,
      isLoading: false,
      planningusers: [],
      planninguserFields: [
        {key: 'full_name', label: this.$trans('Name'), sortable: true},
        {key: 'username', label: this.$trans('Username'), sortable: true},
        {key: 'email', label: this.$trans('Email'), sortable: true},
        {key: 'last_login', label: this.$trans('Last login'), sortable: true},
        {key: 'date_joined', label: this.$trans('Date joined'), sortable: true},
        {key: 'icons', label: ''}
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
      this.$refs['delete-planninguser-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('planning user has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting planning user', error)
        this.errorToast(this.$trans('Error deleting planning user'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.planningusers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching planningusers', error)
        this.errorToast(this.$trans('Error loading planning users'))
        this.isLoading = false
      }
    }
  }
}
</script>
