<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkMedical></IBiFileEarmarkMedical>{{ $trans("Purchase orders") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
          </BButton-group>
          <router-link :to="{name: 'purchaseorder-add'}" class="btn">{{$trans('Add purchase order')}}</router-link>
        </BButton-toolbar>
      </div>
    </header>
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
              <BFormGroup
                v-bind:label="$trans('New status')"
                label-for="change-status-status"
              >
                <BFormInput
                  size="sm"
                  autofocus
                  id="change-status-status"
                  v-model="status.status"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <div class="panel overflow-auto">

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

          </div>
        </template>
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner><br><br>
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(purchase_order_id)="data">

            <router-link :to="{name: 'purchaseorder-view', params: {pk: data.item.id}}">{{ data.item.purchase_order_id }} {{ data.item.order_name }}</router-link>

          <!--
          {{ data.item.order_address }}<br/>
          {{ data.item.order_country_code }}-{{ data.item.order_postal }} {{ data.item.order_city }}
          -->
        </template>
        <template #cell(supplier_reservation)="data">
          <span v-if="!data.item.supplier_reservation" class="dimmed">
            &mdash;
          </span>
          <span v-else>
            <router-link :to="{name: 'supplier-reservation-view', params: {pk: data.item.supplier_reservation}}">{{ data.item.supplier_reservation }}</router-link>
          </span>
        </template>

        <template #cell(last_status)="data">
          <small :title="data.item.last_status_full">{{ data.item.last_status }}</small>
        </template>

        <template #cell(totals)="data">
          <div class="flex-columns">
            <b-progress
            :style="`--delay: ${data.index }`"
            :value="(data.item.total_entries/data.item.total_materials)*100"></b-progress>
            <small class="dimmed">{{ data.item.total_entries || 0 }} / {{ data.item.total_materials }}</small>
          </div>
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

    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Purchase order')"
    />
  </div>
</template>

<style scoped>
.flex-columns {
  align-items: center;
}

.dimmed {
  min-width: 3rem;
  text-align: center;
}
</style>

<script>
import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import IconLinkPlus from '@/components/IconLinkPlus.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  components: {
    IconLinkPlus,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
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
        'index',
        {key: 'purchase_order_id', label: $trans('Order'), sortable: true },
        {key: 'supplier_reservation', label: $trans('Reservation')},
        {key: 'last_status', label: $trans('Status')},
        {key: 'expected_entry_date', label: $trans('Expected entry date'), sortable: true,thAttr: {width: '15%'}},
        {key: 'created', label: $trans('Created'), sortable: true,thAttr: {width: '15%'}},
        {key: 'totals', label: $trans('# entries / # products'),thAttr: {width: '15%'}},
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
        infoToast(this.create, $trans('Created'), $trans('Status has been created'))
        await this.loadData()
      } catch(error) {
        console.log('Error creating status', error)
        errorToast(this.create, $trans('Error creating status'))
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
        infoToast(this.create, $trans('Deleted'), $trans('Purchase order has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting purchase order', error)
        errorToast(this.create, $trans('Error deleting purchase order'))
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
        errorToast(this.create, $trans('Error loading purchase orders'))
        this.isLoading = false
      }
    }
  }
}
</script>
