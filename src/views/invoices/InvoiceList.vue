<template>
  <div class="app-page">
    <header>
      <div class='search-form'>
        <SearchForm @do-search="handleSearchOk" :placeholderText="`${$trans('Search invoices')}`"/>
      </div>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <span>{{ $trans("Invoices") }}</span>
        </h3>

        <b-button-toolbar>
          <b-button-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
          </b-button-group>
        </b-button-toolbar>
      </div>
    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-invoice-modal"
      ref="delete-invoice-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">
        {{ $trans('Are you sure you want to delete this invoice?') }}
      </p>
    </b-modal>

    <div class="panel overflow-auto">
      <b-table
        small
        id="document-table"
        :busy='isLoading'
        :fields="fields"
        :items="invoices"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(invoice_id)="data">
          <router-link
            v-if="data.item.preliminary"
            :to="{name: 'invoice-edit', params: {pk: data.item.id, uuid: data.item.order_uuid}}"
          >#{{ data.item.invoice_id }}
          </router-link>
          <router-link
            v-else
            :to="{name: 'invoice-view', params: {uuid: data.item.uuid}}"
          >#{{ data.item.invoice_id }}
          </router-link>
        </template>
        <template #cell(status)="data">
          <TableStatusInfo
            :statusCodeService="invoiceStatuscodeService"
            :statuscodes="statuscodes"
            :model="data.item"
            :modelName="'invoice'"
            :statusService="statusService"
          />
        </template>
        <template #cell(icons)="data">
          <div class="h2 invoice-icons">
            <router-link
              class="icon-link"
              v-if="!data.item.preliminary"
              :title="$trans('Send invoice')"
              :to="{name: 'invoice-send',
                query: {invoiceId: data.item.id}}"
            >
              <b-icon-mailbox
                aria-hidden="true"
                class="edit-icon"
              ></b-icon-mailbox>
            </router-link>
            <IconLinkDelete
              v-if="data.item.preliminary"
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
            <router-link
              class="icon-link"
              :title="$trans('Order')"
              :to="{name:'order-view', params: {pk: data.item.order}}">
              <b-icon-arrow-up-right-circle
                aria-hidden="true"
                class="edit-icon"
              ></b-icon-arrow-up-right-circle>
            </router-link>
          </div>
        </template>
      </b-table>
      <Pagination
        v-if="!isLoading"
        :model="this.invoiceService"
        :model_name="$trans('Invoice')"
      />
    </div>
  </div>
</template>
<script>
import {InvoiceService} from '@/models/invoices/Invoice.js'
import {InvoiceStatuscodeService} from '@/models/invoices/InvoiceStatuscode.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkDocuments from '@/components/IconLinkDocuments.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import ButtonLinkSort from "@/components/ButtonLinkSort.vue";
import SearchForm from "@/components/SearchForm.vue";
import TableStatusInfo from '../../components/TableStatusInfo.vue'
import { InvoiceStatusService } from '@/models/invoices/InvoiceStatus.js'

export default {
  name: 'InvoiceList',
  components: {
    SearchForm, ButtonLinkSort,
    IconLinkEdit,
    IconLinkDelete,
    IconLinkDocuments,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    TableStatusInfo
  },
  data() {
    return {
      invoiceService: new InvoiceService(),
      invoiceStatuscodeService: new InvoiceStatuscodeService(),
      statusService: new InvoiceStatusService(),
      searchQuery: null,
      invoicePk: null,
      isLoading: false,
      invoices: [],
      order: null,
      statuscodes: [],
      fields: [
        {key: 'invoice_id', label: this.$trans('ID')},
        {key: 'created_by_fullname', label: this.$trans('Created by')},
        {key: 'term_of_payment_days', label: this.$trans('Term of payment')},
        {key: 'total', label: this.$trans('Total')},
        {key: 'vat', label: this.$trans('Vat')},
        {key: 'status', label: this.$trans('Status')},
        {key: 'icons', label: ''},
      ]
    }
  },
  async created () {
    this.invoiceService.currentPage = this.$route.query.page || 1
    await this.loadData()
    await this.loadStatusCodes()
  },
  methods: {
    invoiceEditRoute(invoice) {
      return invoice.preliminary ? 'invoice-edit': 'invoice-view'
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.invoiceService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.invoicePk = id
      this.$refs['delete-invoice-modal'].show()
    },
    async doDelete() {
      this.isLoading = true

      try {
        await this.invoiceService.delete(this.invoicePk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Invoice has been deleted'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        this.isLoading = false
        console.log('Error deleting invoice', error)
        this.errorToast(this.$trans('Error deleting invoice'))
      }
    },
    async loadStatusCodes () {
      this.isLoading = true;

      try {
        const data = await this.invoiceStatuscodeService.list();
        this.statuscodes = data.results.map((statuscode) => {
          if (statuscode.settings_key) {
            statuscode.disabled = true
          }
          return statuscode
        });
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching statuscodes", error);
        this.errorToast(this.$trans("Error loading statuscodes"));
        this.isLoading = false;
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.invoiceService.list()
        this.invoices = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching invoices', error)
        this.errorToast(this.$trans('Error loading invoices'))
        this.isLoading = false
      }
    }
  },
  watch: {
    '$route.name': {
      handler: function(search) {
        if (this.$route.name === 'preliminary-invoices') {
          this.invoiceService.queryMode = 'preliminary'
        } else if(this.$route.name === 'invoices-sent') {
          this.invoiceService.queryMode = 'sent'
        } else {
          this.invoiceService.queryMode = 'all'
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
<style scoped>
.invoice-icons {
  display: flex;
  justify-content: flex-end;
}

.invoice-icons span {
  margin-right: 10px;
}
.icon-link {
  padding-right: 8px;
}
</style>
