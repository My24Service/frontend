<template>
  <div class="app-page">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-branch-modal"
      ref="delete-branch-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this branch?') }}</p>
    </b-modal>

    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="shop"></b-icon>
          {{  $trans('Branches') }}
        </h3>
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
          <router-link 
            :to="{name: 'company-branch-add'}"
            class="btn"
            >{{ $trans('New branch') }}</router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class="page-detail panel">

      <b-table
        id="branch-table"
        small
        :busy='isLoading'
        :fields="branchFields"
        :items="branches"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            
          </div>
        </template>
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>

        <template #cell(id)="data">

          <router-link :to="{name: 'company-branch-view', params: {pk: data.item.id}}">
            {{ data.item.name }}, {{ data.item.city }}, {{ data.item.country_code }}
          </router-link>
        </template>

        <template #cell(contact)="data">
          <span v-if="data.item.contact && data.item.contact.trim() !== ''">
            <span v-if="data.item.email">
              <b-link class="px-1" v-bind:href="`mailto:${data.item.email}`">{{ data.item.contact }} <b-icon icon="envelope"></b-icon></b-link>
            </span>
            <span v-else>
              {{ data.item.contact }}
            </span>
          </span>
        </template>
        
        <template #cell(tel)="data">
          {{  data.item.tel }}
          <span v-if="data.item.mobile && data.item.mobile.trim() !== ''">
            &mdash; <b>{{ $trans('mobile') }}</b>: {{ data.item.mobile }}
          </span>
        </template>

        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="company-branch-edit"
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
    <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Branch')"
      />
  </div>
</template>

<script>
import branchModel from '../../models/company/Branch.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"

export default {
  name: 'BranchList',
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      pk: null,
      searchQuery: null,
      model: branchModel,
      isLoading: false,
      branches: [],
      branchFields: [
        {key: 'id', label: this.$trans('Branch'), sortable: true, },
        {key: 'contact', label: this.$trans('Contact'), sortable: true, },
        {key: 'tel', label: this.$trans('Phone'), sortable: true, },
        {key: 'address', label: this.$trans('Address'), sortable: true, },
        {key: 'country_code', label: this.$trans('Postal'), sortable: true, },
        {key: 'city', label: this.$trans('City'), sortable: true, },
        {key: 'icons', }
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
      this.$refs['delete-branch-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Branch has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting branch', error)
        this.errorToast(this.$trans('Error deleting branch'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.branches = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching branches', error)
        this.errorToast(this.$trans('Error loading branches'))
        this.isLoading = false
      }
    }
  }
}
</script>
