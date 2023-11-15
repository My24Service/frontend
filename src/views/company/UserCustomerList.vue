<template>
  <div class="app-page">
    <header>
      <div class="page-title">
      <h3><b-icon icon="people"></b-icon>People</h3>
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
        <b-link :to="{name: 'customeruser-add'}" class="btn primary" v-if="isStaff || isSuperuser">{{$trans('Add customer user')}}</b-link>
      </b-button-toolbar>
    </div>
    </header>
    
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-customeruser-modal"
      ref="delete-customeruser-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this customer user?') }}</p>
    </b-modal>

    <div class="page-details panel">
      
      <PillsCompanyUsers />
      <br>

      <b-table
        id="customeruser-table"
        small
        :busy='isLoading'
        :fields="customeruserFields"
        :items="customerusers"
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
          <router-link :to="{name:'customeruser-edit', params : {pk: data.item.id} }">{{ data.item.full_name }}</router-link>
        </template>
        <template #cell(customer)="data">
          <div v-if="data.item.customer_user.customer">
            {{ data.item.customer_details.name }}, {{ data.item.customer_details.city }}
          </div>
          <div v-if="!data.item.customer_user.customer">
            <i>{{ $trans('No customer selected') }}</i>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="customeruser-edit"
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
        :model_name="$trans('Customer user')"
      />
  </div>
</template>

<script>
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import customerUserModel from '../../models/company/UserCustomer.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '../../utils.js'

export default {
  mixins: [componentMixin],
  name: 'UserCustomerList',
  components: {
    PillsCompanyUsers,
    IconLinkEdit,
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
      model: customerUserModel,
      isLoading: false,
      customerusers: [],
      customeruserFields: [
        {key: 'full_name', label: this.$trans('Name'), sortable: true},
        {key: 'username', label: this.$trans('Username'), sortable: true},
        {key: 'email', label: this.$trans('Email'), sortable: true},
        {key: 'customer', label: this.$trans('Customer'), sortable: true},
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
      this.$refs['delete-customeruser-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Customer user has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting customer user', error)
        this.errorToast(this.$trans('Error deleting customer user'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.customerusers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching customerusers', error)
        this.errorToast(this.$trans('Error loading customer users'))
        this.isLoading = false
      }
    }
  }
}
</script>
