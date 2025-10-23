<template>
  <div class="app-page" v-if="!isLoading">

    <b-modal
      id="add-state-modal"
      ref="add-state-modal"
      v-bind:title="$trans('Add state')"
      @ok="addState"
    >
      <form ref="add-state-form">
        <b-container>
          <b-row>
            <b-col cols="7">
              <b-form-group
                v-bind:label="$trans('State')"
                label-for="add-state-state"
              >
                <b-form-input
                  size="sm"
                  id="add-state-state"
                  v-model="state.state"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="5">
              <b-form-group
                v-bind:label="$trans('Lifespan')"
                label-for="add-state-replace_months"
              >
                <b-form-input
                  size="sm"
                  id="add-state-replace_months"
                  v-model="state.replace_months"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

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

    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="tools"></b-icon>
          {{ $trans("Equipment") }}
        </h3>
        <b-button-toolbar>
          <b-button-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
            <ButtonLinkDownload
              v-bind:method="function() { downloadList() }"
              v-bind:title="$trans('Download QR-codes')"
            />
          </b-button-group>
          <router-link :to="{name: newLink}" class="btn">{{ $trans("Add Equipment") }}</router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class="page-detail panel">

      <b-table
        id="equipment-table"
        small
        :busy='isLoading'
        :fields="equipmentFields"
        :items="equipmentObjects"
        responsive="md"
        class="data-table"
        sort-icon-left
        :no-local-sorting="true"
        @sort-changed="sortingChanged"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
      >
        <template #head(icons)="">
          <div class="float-right">

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
        <template #cell(latest_state)="data">
          <span v-if="data.item.latest_state">
            {{ data.item.latest_state.state }}
            ({{ $trans('replace in ') }} {{ data.item.latest_state.replace_months }} {{ $trans('months') }})
          </span>
        </template>
        <template #cell(customer)="data">
          <router-link v-if="data.item.customer_branch_view" :to="{name: 'customer-view', params: {pk: data.item.customer}}">
            {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
          </router-link><br/>
        </template>
        <template #cell(branch)="data">
          <router-link v-if="data.item.customer_branch_view" :to="{name: 'company-branch-view', params: {pk: data.item.branch}}">
            {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
          </router-link><br/>
        </template>
        <template #cell(created)="data">
          <small>{{ data.item.created }}</small>
        </template>
        <template #cell(modified)="data">
          <small>{{ data.item.modified }}</small>
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
        :model="equipmentService"
        :model_name="$trans('Equipment')"
      />

  </div>
</template>

<script>

import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {componentMixin} from "@/utils";
import { EquipmentStateModel, EquipmentStateService } from "@/models/equipment/EquipmentState";
import { EquipmentService } from '@/models/equipment/equipment'
import IconLinkPlus from "../../components/IconLinkPlus";
import ButtonLinkDownload from "@/components/ButtonLinkDownload.vue";
import my24 from "@/services/my24";

export default {
  mixins: [componentMixin],
  name: 'EquipmentList',
  components: {
    ButtonLinkDownload,
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
      equipmentStateService: new EquipmentStateService(),
      equipmentService: new EquipmentService(),
      isLoading: false,
      equipmentObjects: [],
      equipmentFields: [],
      equipmentFieldsCustomerPlanning: [
        {key: 'name', label: this.$trans('Equipment'), sortable: true},
        {key: 'customer', label: this.$trans('Customer'), sortable: true},
        {key: 'brand', label: this.$trans('Brand'), sortable: true},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'num_orders', label: this.$trans('Orders'), sortable: true},
        {key: 'brand', label: this.$trans('Brand'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons', label: ''}
      ],
      equipmentFieldsBranchPlanning: [
        {key: 'name', label: this.$trans('Equipment'), sortable: true},
        {key: 'branch', label: this.$trans('Branch'), sortable: true},
        {key: 'brand', label: this.$trans('Brand'), sortable: true},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'num_orders', label: this.$trans('Orders'), sortable: true},
        {key: 'brand', label: this.$trans('Brand'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons', label: ''}
      ],
      equipmentFieldsCustomerNonPlanning: [
        {key: 'name', label: this.$trans('Equipment'), sortable: true},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'num_orders', label: this.$trans('Orders'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons', label: ''}
      ],
      equipmentFieldsBranchNonPlanning: [
        {key: 'name', label: this.$trans('Equipment'), sortable: true},
        {key: 'location_name', label: this.$trans('Location')},
        {key: 'latest_state', label: this.$trans('State')},
        {key: 'num_orders', label: this.$trans('Orders'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'modified', label: this.$trans('Modified'), sortable: true},
        {key: 'icons', label: ''}
      ],
      equipment_pk: null,
      state: new EquipmentStateModel({}),
      sortBy: 'name',
      sortDesc: false,
    }
  },
  async created() {
    this.equipmentService.resetListArgs()
    this.isLoading = true
    this.equipmentService.currentPage = this.$route.query.page || 1

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
    // download
    downloadList() {
      const url = this.equipmentService.getExportUrl()
      my24.downloadItemAuth(url, 'equipment.xlsx', () => {})
    },
    // sorting
    async sortingChanged(ctx) {
      this.equipmentService.setSorting(ctx.sortBy, ctx.sortDesc)
      await this.loadData()
    },
    // add state
    showAddStateModal(id) {
      this.state.equipment = id
      this.$refs['add-state-modal'].show()
    },
    async addState() {
      try {
        await this.equipmentStateService.insert(this.state)
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
      this.equipmentService.setSearchQuery(val)
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
        await this.equipmentService.delete(this.pk)
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
        const data = await this.equipmentService.list()
        this.equipmentObjects = data.results;
      } catch(error) {
        console.log('error fetching equipment', error)
        this.errorToast(this.$trans('Error loading equipment'))
      }
    }
  }
}
</script>
