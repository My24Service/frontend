<template>
  <div class="app-grid">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-purchaseorder-modal"
      ref="delete-purchaseorder-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this purchase order?') }}</p>
    </b-modal>

    <b-modal
      id="purchaseorder-change-status-modal"
      ref="purchaseorder-change-status-modal"
      v-bind:title="$trans('Add status')"
      @ok="changeStatus"
    >
      <form ref="purchaseorder-change-status-form">
        <b-container fluid>
          <b-row role="group">
            <b-col size="6">
              <b-form-group
                v-bind:label="$trans('New status')"
                label-for="change-status-status"
              >
                <b-form-input
                  size="sm"
                  autofocus
                  id="change-status-status"
                  v-model="status.status"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Purchase order')"
      />

      <b-table
        id="purchaseorder-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="purchaseOrders"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="purchaseorder-add"
                  v-bind:title="$trans('New purchase order')"
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
        <template #cell(purchase_order_id)="data">
          <p>
            <router-link :to="{name: 'purchaseorder-view', params: {pk: data.item.id}}">{{ data.item.purchase_order_id }}</router-link>
          </p>
          {{ data.item.order_name }}<br/>
          {{ data.item.order_address }}<br/>
          {{ data.item.order_country_code }}-{{ data.item.order_postal }} {{ data.item.order_city }}<br/>

          <span v-if="data.item.supplier_reservation">
            {{ $trans('Reservation: ')}}: <router-link :to="{name: 'supplier-reservation-view', params: {pk: data.item.supplier_reservation}}">{{ data.item.supplier_reservation }}</router-link>
          </span>
        </template>
        <template #cell(totals)="data">
          {{ data.item.total_entries || 0 }} / {{ data.item.total_materials }}
          <b-progress :value="(data.item.total_entries/data.item.total_materials)*100" class="mb-3"></b-progress>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkPlus
              type="tr"
              v-bind:title="$trans('Change status')"
              v-bind:method="function() { showChangeStatusModal(data.item.id) }"
            />
            <IconLinkEdit
              router_name="purchaseorder-edit"
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
import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import purchaseOrderStatusModel from '@/models/inventory/PurchaseOrderStatus.js'
import IconLinkPlus from '@/components/IconLinkPlus.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  components: {
    IconLinkPlus,
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
      searchQuery: null,
      model: purchaseOrderModel,
      purchaseOrderPk: null,
      isLoading: false,
      purchaseOrders: [],
      fields: [
        {key: 'purchase_order_id', label: this.$trans('Order'), sortable: true, thAttr: {width: '40%'}},
        {key: 'expected_entry_date', label: this.$trans('Expected entry date'), sortable: true,thAttr: {width: '15%'}},
        {key: 'created', label: this.$trans('Created'), sortable: true,thAttr: {width: '15%'}},
        {key: 'totals', label: this.$trans('# entries / # materials'),thAttr: {width: '15%'}},
        {key: 'icons', thAttr: {width: '15%'}}
      ],
      status: {
        status: '',
        new_status: ''
      },
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
    // change status
    async changeStatus() {
      const status = {
        purchase_order: this.purchaseOrderPk,
        status: this.status.status
      }

      try {
        await this.model.insert(status)
        this.infoToast(this.$trans('Created'), this.$trans('Status has been created'))
        await this.loadData()
      } catch(error) {
        console.log('Error creating status', error)
        this.errorToast(this.$trans('Error creating status'))
      }
    },
    showChangeStatusModal(id) {
      this.purchaseOrderPk = id
      this.$refs['purchaseorder-change-status-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.purchaseOrderPk = id
      this.$refs['delete-purchaseorder-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.purchaseOrderPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Purchase order has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting purchase order', error)
        this.errorToast(this.$trans('Error deleting purchase order'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.purchaseOrders = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching purchase orders', error)
        this.errorToast(this.$trans('Error loading purchase orders'))
        this.isLoading = false
      }
    }
  }
}
</script>
