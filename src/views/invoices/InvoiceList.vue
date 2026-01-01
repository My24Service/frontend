<template>
  <div class="app-page">
    <header>
      <div class='search-form'>
        <SearchForm @do-search="handleSearchOk" :placeholderText="`${$trans('Search invoices')}`"/>
      </div>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkTextFill></IBiFileEarmarkTextFill>
          <span>{{ pageTitle }}</span>
        </h3>

        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
          </BButton-group>
        </BButton-toolbar>
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
              <IBiMailbox
                aria-hidden="true"
                class="edit-icon"
              ></IBiMailbox>
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
              <IBiArrowUpRightCircle
                aria-hidden="true"
                class="edit-icon"
              ></IBiArrowUpRightCircle>
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
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import SearchForm from "@/components/SearchForm.vue";
import TableStatusInfo from '@/components/TableStatusInfo.vue'

import {InvoiceService} from '@/models/invoices/Invoice.js'
import {InvoiceStatuscodeService} from '@/models/invoices/InvoiceStatuscode.js'
import { InvoiceStatusService } from '@/models/invoices/InvoiceStatus.js'
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
  name: 'InvoiceList',
  components: {
    SearchForm,
    IconLinkDelete,
    ButtonLinkRefresh,
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
        {key: 'invoice_id', label: $trans('ID')},
        {key: 'created_by_fullname', label: $trans('Created by')},
        {key: 'term_of_payment_days', label: $trans('Term of payment')},
        {key: 'total', label: $trans('Total')},
        {key: 'vat', label: $trans('Vat')},
        {key: 'status', label: $trans('Status')},
        {key: 'icons', label: ''},
      ]
    }
  },
  computed: {
    pageTitle() {
      switch (this.$route.name) {
        case 'invoices-sent':
          return $trans("Sent invoices")
        case 'preliminary-invoices':
          return $trans("Preliminary invoices")
        default:
          return $trans("Definitive invoices")
      }
    },
  },
  async created () {
    this.invoiceService.currentPage = this.$route.query.page || 1
    await this.loadData()
    await this.loadStatusCodes()
  },
  methods: {
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
        infoToast(create, $trans('Deleted'), $trans('Invoice has been deleted'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        this.isLoading = false
        console.log('Error deleting invoice', error)
        errorToast(create, $trans('Error deleting invoice'))
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
        errorToast(create, $trans("Error loading statuscodes"));
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
        errorToast(create, $trans('Error loading invoices'))
        this.isLoading = false
      }
    }
  },
  watch: {
    '$route.name': {
      handler: function(_search) {
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
