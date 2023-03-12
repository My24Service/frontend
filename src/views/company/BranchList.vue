<template>
  <div class="app-grid">

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

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Branch')"
      />

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
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="company-branch-add"
                  v-bind:title="$trans('New branch')"
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
        <template #cell(id)="data">
          <h4>{{ data.item.name }}</h4>
          <span v-if="data.item.contact && data.item.contact.trim() !== ''">
              <b>{{ $trans('Contact') }}</b>: {{ data.item.contact }}<br/>
          </span>
          <span v-if="data.item.email">
            {{ $trans('Email') }}: <b-link class="px-1" v-bind:href="`mailto:${data.item.email}`">{{ data.item.email }}</b-link><br/>
          </span>
          <span v-if="data.item.mobile && data.item.mobile.trim() !== ''">
              <b>{{ $trans('Mobile') }}</b>: {{ data.item.mobile }}<br/>
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
        {key: 'id', label: this.$trans('Branch'), sortable: true, thAttr: {width: '25%'}},
        {key: 'tel', label: this.$trans('Tel.'), sortable: true, thAttr: {width: '10%'}},
        {key: 'address', label: this.$trans('Address'), sortable: true, thAttr: {width: '20%'}},
        {key: 'country_code', label: this.$trans('Postal'), sortable: true, thAttr: {width: '10%'}},
        {key: 'city', label: this.$trans('City'), sortable: true, thAttr: {width: '20%'}},
        {key: 'icons', thAttr: {width: '15%'}}
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
