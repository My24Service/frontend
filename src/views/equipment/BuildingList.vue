<template>
  <div class="mt-4 app-grid">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-building-modal"
      ref="delete-building-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this building?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('building')"
      />

      <b-table
        id="building-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="buildings"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  :router_name="newLink"
                  v-bind:title="$trans('New building')"
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
        <template #cell(name)="data">
          <router-link :to="{name: viewLink, params: {pk: data.item.id}}">
            {{ data.item.name }}
          </router-link><br/>
        </template>
        <template #cell(customer)="data">
          <router-link :to="{name: 'customer-view', params: {pk: data.item.id}}">
            {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
          </router-link><br/>
        </template>
        <template #cell(branch)="data">
          <router-link :to="{name: 'company-branch-view', params: {pk: data.item.id}}">
            {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
          </router-link><br/>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              :router_name="editLink"
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
import buildingModel from '../../models/equipment/building.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {componentMixin} from "../../utils";

export default {
  mixins: [componentMixin],
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  computed: {
    editLink() {
      if (this.hasBranches) {
        return 'equipment-building-edit'
      } else {
        return 'customers-building-edit'
      }
    },
    viewLink() {
      if (this.hasBranches) {
        return 'equipment-building-view'
      } else {
        return 'customers-building-view'
      }
    },
    newLink() {
      if (this.hasBranches) {
        return 'equipment-building-add'
      } else {
        return 'customers-building-add'
      }
    },
  },
  data() {
    return {
      searchQuery: null,
      model: buildingModel,
      buildingPk: null,
      isLoading: false,
      buildings: [],
      fieldsCustomerPlanning: [
        {key: 'customer', label: this.$trans('Customer')},
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fieldsBranchPlanning: [
        {key: 'branch', label: this.$trans('Branch')},
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fieldsCustomerNonPlanning: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fieldsBranchNonPlanning: [
        {key: 'name', label: this.$trans('Name'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons'}
      ],
      fields: [],
    }
  },
  created() {
    buildingModel.resetListArgs()
    if (this.hasBranches) {
      if (this.isEmployee) {
        this.fields = this.fieldsBranchNonPlanning
      } else {
        this.fields = this.fieldsBranchPlanning
      }
    } else {
      if (this.isCustomer) {
        this.fields = this.fieldsCustomerNonPlanning
      } else {
        this.fields = this.fieldsCustomerPlanning
      }
    }
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
      this.buildingPk = id
      this.$refs['delete-building-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.buildingPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('building has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting building', error)
        this.errorToast(this.$trans('Error deleting building'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.buildings = data.results
        this.isLoading = false
      } catch(error){
        console.log('error fetching buildings', error)
        this.errorToast(this.$trans('Error loading buildings'))
        this.isLoading = false
      }
    }
  }
}
</script>
