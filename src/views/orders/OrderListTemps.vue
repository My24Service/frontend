<template>
  <div class="app-grid" ref="order-list-temps">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="sort-modal"
      ref="sort-modal"
      v-bind:title="$trans('Sort')"
      @ok="doSort"
    >
      <form ref="sort-form">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <div>
                <BFormGroup label="Individual radios">
                  <BFormRadio v-model="sortMode" value="default">{{ $trans('Modified (default)') }}</BFormRadio>
                  <BFormRadio v-model="sortMode" value="-start_date">{{ $trans('Start date') }}</BFormRadio>
                </BFormGroup>
              </div>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-modal
      id="delete-order-modal"
      ref="delete-order-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this order?') }}</p>
    </b-modal>

    <b-modal
      id="change-status-modal"
      ref="change-status-modal"
      v-bind:title="$trans('Add status')"
      @ok="changeStatus"
    >
      <form ref="change-status-form">
        <b-container fluid>
          <b-row role="group">
            <b-col size="4">
              <BFormGroup
                v-bind:label="$trans('New status')"
                label-for="change-status-status"
              >
                <BFormSelect
                  id="change-status-status"
                  v-model="status.statuscode"
                  :options="statuscodes"
                  size="sm"
                  value-field="statuscode"
                  text-field="statuscode"
                ></BFormSelect>
              </BFormGroup>
            </b-col>
            <b-col size="8">
              <BFormGroup
                v-bind:label="$trans('Extra text')"
                label-for="change-status-extra-text"
              >
                <BFormInput
                  size="sm"
                  id="change-status-extra-text"
                  v-model="status.extra_text"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-row v-if="dispatch && selectedOrders.length > 0">
      <b-col cols="12">
        <strong>{{ $trans('Selected orders') }}:</strong>&nbsp;
        <span v-for="(order, index) in selectedOrders" :key="order.id">
          {{ order.order_id }}
          <BLink class="px-1" @click.prevent="removeSelectedOrder(index)">[ x ]</BLink>
        </span>
        <BLink v-if="dispatch" class="px-1" @click.prevent="doAssign()" v-bind:title="$trans('Assign these orders')">
          <IBiArrowBarRight font-scale="1"></IBiArrowBarRight>
        </BLink>
      </b-col>
    </b-row>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Order')"
      />

      <b-table
        id="order-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="orders"
        responsive="md"
        class="data-table"
        tbody-tr-class="order-row"
        v-bind:tbody-tr-attr="rowStyle"
      >
        <template #head(id)="">
          <span class="text-info">{{ $trans('Order') }}</span>
        </template>
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ButtonLinkAdd
                  router_name="order-add"
                  v-bind:title="$trans('New order')"
                />
                <ButtonLinkRefresh
                  v-bind:method="function() { loadData() }"
                  v-bind:title="$trans('Refresh')"
                />
                <ButtonLinkSearch
                  v-bind:method="function() { showSearchModal() }"
                />
                <ButtonLinkSort
                  v-bind:method="function() { showSortModal() }"
                />
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(id)="data">
          <OrderTableInfo
            :dispatch="dispatch"
            v-bind:order="data.item"
          />
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="order-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkPlus
              type="tr"
              v-bind:title="$trans('Change status')"
              v-bind:method="function() { showChangeStatusModal(data.item.id) }"
            />
            <IconLinkDocuments
              v-if="!dispatch"
              router_name="order-documents"
              v-bind:router_params="{orderPk: data.item.id}"
              v-bind:title="$trans('Documents')"
            />
            <IconLinkAssign
              v-if="dispatch"
              v-bind:title="$trans('Assign')"
              v-bind:method="function() { selectOrder(data.item) }"
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
import { OrderService } from '@/models/orders/Order'
import statusModel from '../../models/orders/Status.js'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import my24 from '../../services/my24.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkPlus from '../../components/IconLinkPlus.vue'
import IconLinkDocuments from '../../components/IconLinkDocuments.vue'
import IconLinkAssign from '../../components/IconLinkAssign.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import ButtonLinkSort from '../../components/ButtonLinkSort.vue'
import Pagination from "../../components/Pagination.vue"
import SearchModal from '../../components/SearchModal.vue'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  mixins: [componentMixin],
  components: {
    OrderTableInfo,
    IconLinkEdit,
    IconLinkPlus,
    IconLinkDocuments,
    IconLinkAssign,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    ButtonLinkSort,
    SearchModal,
    Pagination,
  },
  props: {
    dispatch: {
      type: [Boolean],
      default: false
    },
    queryMode: {
      type: [String],
      default: 'all'
    }
  },
  data() {
    return {
      sortMode: 'default',
      sinceDate: null,
      searchQuery: null,
      model: new OrderService(),
      selectedOrders: [],
      status: {
        statuscode: '',
        extra_text: ''
      },
      statuscodes: [],
      orderPk: null,
      isLoading: false,
      orders: [],
      fields: [
        {thAttr: {width: '80%'}, key: 'id', label: $trans('Order')},
        {thAttr: {width: '20%'}, key: 'icons'}
      ],
    }
  },
  async created() {
    // set queryMode
    this.model.queryMode = this.queryMode

    // reset searchQuery
    this.searchQuery = null

    // get statuscodes and load orders
    this.statuscodes = await this.mainStore.getStatuscodes
    this.model.currentPage = this.$route.query.page || 1

    this.sinceDate = this.$route.query.since || null
    this.model.since = this.sinceDate
    this.sortMode = this.$route.query.order_by || 'default'
    this.model.sort = this.sortMode

    await this.loadData()
  },
  methods: {
    // sort
    showSortModal() {
      this.$refs['sort-modal'].show()
    },
    doSort() {
      this.model.setSort(this.sortMode)
      this.model.setSinceDate(this.sinceDate)
      this.loadData()
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
    // rest
    doAssign() {
      this.mainStore.setAssignOrders(this.selectedOrders)
      this.$router.push({name: 'mobile-dispatch', params: {assignModeProp: true}})
    },
    selectOrder(order) {
      for( let i=0; i<this.selectedOrders.length; i++) {
        if (this.selectedOrders[i].id === order.id) {
          return
        }
      }

      this.selectedOrders.push(order)
      this.mainStore.setAssignOrders(this.selectedOrders)
    },
    removeSelectedOrder(index) {
      this.selectedOrders.splice(index, 1)
      this.mainStore.setAssignOrders(this.selectedOrders)
    },
    async changeStatus() {
      const status = {
        order: this.orderPk,
        status: this.status.extra_text !== '' ? `${this.status.statuscode} ${this.status.extra_text}` : this.status.statuscode
      }

      try {
        await statusModel.insert(status)
        infoToast(this.create, $trans('Created'), $trans('Status has been created'))
        await this.loadData()
      } catch(error) {
        console.log('Error creating status', error)
        errorToast(this.create, $trans('Error creating status'))
      }
    },
    rowStyle(item, type) {
      if (!item || type !== 'row') return

      return {
        style: `border-left-style: solid; border-left-color: ${this.status2color(item.last_status)}`
      }
    },
    status2color(status) {
      return my24.status2color(this.statuscodes, status)
    },
    showDeleteModal(id) {
      this.orderPk = id
      this.$refs['delete-order-modal'].show()
    },
    showChangeStatusModal(id) {
      this.orderPk = id
      this.$refs['change-status-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.orderPk)
        infoToast(this.create, $trans('Deleted'), $trans('Order has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting order', error)
        errorToast(this.create, $trans('Error deleting order'))
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.orders = data.results
        this.selectedOrders = await this.mainStore.getAssignOrders || []
        this.isLoading = false
      } catch(error) {
        console.log('error fetching orders', error)
        errorToast(this.create, $trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>
