<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="tools"></b-icon>Equipment</h3>
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
          <router-link class="btn primary" :to="{name: newLink}">Add equipment</router-link>
        </b-button-toolbar>
      </div>
    </header>
    <div class="panel overflow-auto">
      <b-table
        id="equipment-table"
        small
        :busy='isLoading'
        :fields="equipmentFields"
        :items="equipmentObjects"
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
        <template #cell(name)="data">
          <router-link :to="{name: viewLink, params: {pk: data.item.id}}">
            {{ data.item.name }}
          </router-link>
        </template>
        <template #cell(latest_state)="data">
          <span v-if="data.item.latest_state">
            {{ data.item.latest_state.state }}
            ({{ $trans('replace in ') }} {{ data.item.latest_state.replace_months }} {{ $trans('months') }})
          </span>
        </template>
        <template #cell(customer)="data">
            {{ data.item.customer_branch_view.name }} <span class="dimmed"> &middot; {{ data.item.customer_branch_view.city }}</span>
        </template>
        <template #cell(branch)="data">
          <router-link :to="{name: 'company-branch-view', params: {pk: data.item.branch}}">
            {{ data.item.customer_branch_view.name }} <span class="dimmed"> &middot; {{ data.item.customer_branch_view.city }}</span>
          </router-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkPlus
              type="tr"
              v-bind:title="$trans('Add state')"
              v-bind:method="function() { showAddStateModal(data.item.id) }"
            />
            <IconLinkEdit
              :router_name="editLink"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
              class="h2"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
              class="h2"
            />
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Equipment')"
    />
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-equipment-modal"
      ref="delete-equipment-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this equipment?') }}</p>
    </b-modal>
  </div>
</template>

<script>
import equipmentModel from '../../models/equipment/equipment.js'

import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {componentMixin} from "../../utils";
import locationModel from "../../models/equipment/location";
import statusModel from "../../models/orders/Status";
import equipmentStateService, {EquipmentStateModel} from "../../models/equipment/EquipmentState";
import IconLinkPlus from "../../components/IconLinkPlus";

export default {
  mixins: [componentMixin],
  name: 'EquipmentList',
  components: {
    IconLinkDelete,
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    IconLinkPlus,
  },
  computed: {
    editLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-edit'
      } else {
        return 'customers-equipment-edit'
      }
    },
    viewLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-view'
      } else {
        return 'customers-equipment-view'
      }
    },
    newLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-add'
      } else {
        return 'customers-equipment-add'
      }
    },
  },
  data() {
    return {
      searchQuery: null,
      model: equipmentModel,
      isLoading: false,
      equipmentObjects: [],
      equipmentFields: [],
      equipmentFieldsCustomerPlanning: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'customer', label: this.$trans('Customer')},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'brand', label: this.$trans('Brand')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons', label: ''}
      ],
      equipmentFieldsBranchPlanning: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'branch', label: this.$trans('Branch')},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'brand', label: this.$trans('Brand')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ''}
      ],
      equipmentFieldsCustomerNonPlanning: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ''}
      ],
      equipmentFieldsBranchNonPlanning: [
        {key: 'name', label: this.$trans('Equipment')},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'created', label: this.$trans('Created')},
        {key: 'modified', label: this.$trans('Modified')},
        {key: 'icons', label: ''}
      ],
      equipment_pk: null,
      state: new EquipmentStateModel({}),
    }
  },
  async created() {
    equipmentModel.resetListArgs()
    this.isLoading = true
    this.model.currentPage = this.$route.query.page || 1

    if (this.hasBranches) {
      if (this.isEmployee) {
        this.equipmentFields = this.equipmentFieldsBranchNonPlanning
      } else {
        this.equipmentFields = this.equipmentFieldsBranchPlanning
      }
    } else {
      if (this.isCustomer) {
        this.equipmentFields = this.equipmentFieldsCustomerNonPlanning
      } else {
        this.equipmentFields = this.equipmentFieldsCustomerPlanning
      }
    }

    await this.loadData()
    this.isLoading = false
  },
  methods: {
    showAddStateModal(id) {
      this.state.equipment = id
      this.$refs['add-state-modal'].show()
    },
    async addState() {
      try {
        await equipmentStateService.insert(this.state)
        this.state = new EquipmentStateModel({})
        this.infoToast(this.$trans('Created'), this.$trans('State added'))
        await this.loadData()
      } catch(error) {
        console.log('Error adding state', error)
        this.errorToast(this.$trans('Error adding state'))
      }
    },
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
      this.$refs['delete-equipment-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Equipment has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting equipment', error)
        this.errorToast(this.$trans('Error deleting equipment'))
      }
    },
    // rest
    async loadData() {
      try {
        const data = await this.model.list()
        this.equipmentObjects = data.results
      } catch(error) {
        console.log('error fetching equipment', error)
        this.errorToast(this.$trans('Error loading equipment'))
      }
    }
  }
}
</script>
