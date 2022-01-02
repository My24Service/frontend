<template>
  <div class="app-grid">

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

    <b-pagination
      v-if="this.purchaseOrderModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.purchaseOrderModel.count"
      :per-page="this.purchaseOrderModel.perPage"
      aria-controls="purchaseorder-table"
    ></b-pagination>

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
        <router-link :to="{name: 'purchaseorder-view', params: {pk: data.item.id}}">{{ data.item.purchase_order_id }}</router-link>
      </template>
      <template #cell(totals)="data">
        {{ data.item.total_entries }} / {{ data.item.total_materials }}
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
</template>

<script>
import purchaseOrderModel from '@/models/inventory/PurchaseOrder'
import purchaseOrderStatusModel from '@/models/inventory/PurchaseOrderStatus';
import IconLinkPlus from '@/components/IconLinkPlus'
import IconLinkEdit from '@/components/IconLinkEdit'
import IconLinkDelete from '@/components/IconLinkDelete'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'

export default {
  components: {
    IconLinkPlus,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      purchaseOrderModel,
      purchaseOrderPk: null,
      isLoading: false,
      purchaseOrders: [],
      fields: [
        {key: 'purchase_order_id', label: this.$trans('Order ID'), sortable: true, thAttr: {width: '10%'}},
        {key: 'order_name', label: this.$trans('Supplier'), sortable: true, thAttr: {width: '15%'}},
        {key: 'order_reference', label: this.$trans('Reference'), sortable: true, thAttr: {width: '15%'}},
        {key: 'expected_entry_date', label: this.$trans('Expected extry date'), sortable: true,thAttr: {width: '15%'}},
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
  watch: {
    currentPage: function(val) {
      this.purchaseOrderModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.purchaseOrderModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      purchaseOrderModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    changeStatus() {
      const status = {
        purchase_order: this.purchaseOrderPk,
        status: this.status.status
      }

      return this.$store.dispatch('getCsrfToken').then((token) => {
        purchaseOrderStatusModel.insert(token, status).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Created'),
            message: this.$trans('Status has been created')
          })

          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error creating status')
          })
        })
      })
    },
    showChangeStatusModal(id) {
      this.purchaseOrderPk = id
      this.$refs['purchaseorder-change-status-modal'].show()
    },
    showDeleteModal(id) {
      this.purchaseOrderPk = id
      this.$refs['delete-purchaseorder-modal'].show()
    },
    doDelete() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        purchaseOrderModel.delete(token, this.purchaseOrderPk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Purchase order has been deleted')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting purchase order')
          })
        })
      })
    },
    async loadData() {
      this.isLoading = true;

      purchaseOrderModel.list().then((data) => {
        this.purchaseOrders = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching purchase orders', error);
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading purchase orders')
        })
        this.isLoading = false
      })
    }
  }
}
</script>
