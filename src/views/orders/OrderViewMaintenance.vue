<template>
  <b-overlay :show="isLoading" rounded="sm">

    <b-modal
      v-if="purchaseInvoice && hasBranches"
      id="delete-purchase-invoice-modal"
      ref="delete-purchase-invoice-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDeletePurchaseInvoice"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this purchase invoice?') }}</p>
    </b-modal>

    <b-modal
      v-if="purchaseInvoice && hasBranches"
      id="add-purchase-invoice-modal"
      ref="add-purchase-invoice-modal"
      v-bind:title="$trans('Add purchase invoice')"
      @ok="doAddPurchaseInvoice"
    >
      <form ref="add-purchase-invoice-form">
        <b-container>
          <b-row>
            <b-col cols="6">
              <b-form-group
                v-bind:label="$trans('VAT')"
                label-for="add-purchase-invoice-vat"
              >
                <PriceInput
                  id="add-purchase-invoice-vat"
                  v-model="purchaseInvoice.vat"
                  :currency="purchaseInvoice.vat_currency"
                  @priceChanged="(val) => vatChanged(val)"
                />
              </b-form-group>
            </b-col>
            <b-col cols="6">
              <b-form-group
                v-bind:label="$trans('Total')"
                label-for="add-purchase-invoice-total"
              >
                <PriceInput
                  id="add-purchase-invoice-total"
                  v-model="purchaseInvoice.total"
                  :currency="purchaseInvoice.total_currency"
                  @priceChanged="(val) => totalChanged(val)"
                />
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="4">
              <b-form-group
                v-bind:label="$trans('Reference')"
                label-for="add-purchase-invoice-reference"
              >
                <b-form-input
                  size="sm"
                  id="add-purchase-invoice-reference"
                  v-model="purchaseInvoice.reference"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="8">
              <b-form-group
                v-bind:label="$trans('Description')"
                label-for="add-purchase-invoice-description"
              >
                <b-form-textarea
                  id="add-purchase-invoice-description"
                  v-model="purchaseInvoice.description"
                  rows="1"
                ></b-form-textarea>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <div class="app-detail" v-if="order">
      <h3>{{ $trans('Order info') }}</h3>
      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Customer ID') }}:</strong></b-td>
              <b-td>{{ order.customer_id }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Customer') }}:</strong></b-td>
              <b-td>
                <router-link :to="{name: 'customer-view', params: {pk: order.customer_relation}}">
                {{ order.order_name }}
                </router-link>
              </b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
              <b-td>{{ order.order_address }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Country/Postal/city') }}:</strong></b-td>
              <b-td>
                {{ order.order_country_code }}-
                {{ order.order_postal }} {{ order.order_city }}
              </b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
              <b-td>{{ order.order_contact }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Tel') }}:</strong></b-td>
              <b-td>{{ order.order_tel }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
              <b-td>{{ order.order_mobile }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
              <b-td>
                <b-link class="px-1" v-bind:href="`mailto:${order.order_email}`">
                  {{ order.order_email }}
                </b-link>
              </b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
        <b-col cols="6">
          <b-table-simple>
            <b-tr>
              <b-td><strong>{{ $trans('Order id') }}:</strong></b-td>
              <b-td>{{ order.order_id }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Date') }}:</strong></b-td>
              <b-td>{{ order.order_date }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Service nbr.') }}:</strong></b-td>
              <b-td>{{ order.service_number }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Order reference') }}:</strong></b-td>
              <b-td>{{ order.order_reference }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Order type') }}:</strong></b-td>
              <b-td>{{ order.order_type }}</b-td>
            </b-tr>
            <b-tr>
              <b-td><strong>{{ $trans('Remarks') }}:</strong></b-td>
              <b-td>{{ order.remarks }}</b-td>
            </b-tr>
          </b-table-simple>
        </b-col>
      </b-row>
      <b-row v-if="order.orderlines.length">
        <b-col cols="12">
          <h4>{{ $trans('Orderlines') }}</h4>
          <b-table
            dark
            borderless
            small
            id="orderline-table"
            :fields="orderLineFields"
            :items="order.orderlines"
            responsive="sm"
          ></b-table>
          </b-col>
      </b-row>
      <b-row v-if="!isCustomer && !hasBranches && order.infolines.length > 0">
        <b-col cols="12">
          <h4>{{ $trans('Infolines') }}</h4>
          <b-table dark borderless small :fields="infoLineFields" :items="order.infolines" responsive="sm"></b-table>
        </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.customer_remarks != ''">
          <b-col cols="2"><strong>{{ $trans('Customer remarks') }}</strong></b-col>
          <b-col cols="9">{{ order.customer_remarks }}</b-col>
      </b-row>
      <b-row class="my-2">
          <b-col cols="2"><strong>{{ $trans('Status') }}</strong></b-col>
          <b-col cols="9">
            <div v-for="status in order.statuses" :key="status.id">
              {{ status.created }} {{ status.status }}<br/>
            </div>
          </b-col>
      </b-row>
      <b-row class="my-2">
          <b-col cols="2"><strong>{{ $trans('Workorder online') }}</strong></b-col>
          <b-col cols="9">
            <b-link class="px-1" @click="openWorkorder()" target="_blank">
              {{ $trans('Order') }} {{ order.order_id }}
            </b-link>
          </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.workorder_pdf_url">
          <b-col cols="2"><strong>{{ $trans('Download PDF') }}</strong></b-col>
          <b-col cols="9">
            <b-link class="px-1" :href="order.workorder_pdf_url" target="_blank">
              {{ $trans('Order') }} {{ order.order_id }} |{{ order.workorder_pdf_url }}|
            </b-link>
          </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.workorder_documents.length > 0">
        <b-col cols="12">
          <h4>{{ $trans('Workorder documents') }}</h4>
          <b-table borderless small :fields="workorderDocumentFields" :items="order.workorder_documents" responsive="sm">
            <template #cell(url)="data">
              <b-link class="px-1" :href="data.item.url" target="_blank">
                {{ $trans('Order') }} {{ order.order_id }}
              </b-link>
            </template>
          </b-table>
        </b-col>
      </b-row>
      <b-row class="my-2" v-if="order.workorder_documents_partners && order.workorder_documents_partners.length > 0">
        <b-col cols="12">
          <h4>{{ $trans('Workorder documents partner') }}</h4>
          <b-table borderless small :fields="workorderDocumentFields" :items="order.workorder_documents_partners" responsive="sm">
            <template #cell(url)="data">
              <b-link class="px-1" :href="data.item.url" target="_blank">
                {{ $trans('Order') }} {{ order.order_id }}
              </b-link>
            </template>
          </b-table>
        </b-col>
      </b-row>
      <b-row v-if="order.reported_codes_extra_data.length">
        <b-col cols="12">
          <h4>{{ $trans('Reported extra text') }}</h4>
          <b-table
            borderless
            small
            id="extra-data-table"
            :fields="extraDataFields"
            :items="order.reported_codes_extra_data"
            responsive="sm"
          ></b-table>
        </b-col>
      </b-row>
      <b-row v-if="order.invoices.length">
        <hr/>
        <b-col cols="12">
          <h4>{{ $trans('Invoices') }}</h4>
          <b-container>
            <b-row v-for="invoice of order.invoices" :key="invoice.uuid">
              <b-col cols="12">
                <router-link :to="{name: 'order-invoice-view', params: {uuid: invoice.uuid}}">
                  {{ $trans('Invoice') }} {{ invoice.invoice_id }}
                </router-link><br/>
              </b-col>
            </b-row>
          </b-container>
        </b-col>
      </b-row>
      <b-row v-if="hasBranches">
        <hr/>
        <b-col cols="12">
          <div class="purchase-invoices-table">
            <h4>{{ $trans('Purchase invoices') }}</h4>
            <b-table
              id="purchase-invoices-table"
              small
              :busy='isLoading'
              :fields="purchaseInvoiceFields"
              :items="order.purchaseInvoices"
              responsive="md"
              class="data-table"
              sort-icon-left
            >
              <template #head(icons)="">
                <div class="float-right">
                  <b-button-toolbar>
                    <b-button-group class="mr-1">
                      <IconLinkPlus
                        type="th"
                        :method="addPurchaseInvoice"
                        :title="$trans('New purchase invoice')"
                      />
                    </b-button-group>
                  </b-button-toolbar>
                </div>
              </template>
              <template #cell(vat)="data">
                {{ data.item.vat_dinero.toFormat('$0.00') }}
              </template>
              <template #cell(total)="data">
                {{ data.item.total_dinero.toFormat('$0.00') }}
              </template>
              <template #cell(icons)="data">
                <div class="h2 float-right">
                  <IconLinkDelete
                    v-bind:title="$trans('Delete')"
                    v-bind:method="function() { showDeletePurchaseInvoiceModal(data.item.id) }"
                  />
                </div>
              </template>
            </b-table>

          </div>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <b-button
          v-if="!past && !isCustomer && !isBranchEmployee"
          id="recreateWorkorderPdfButtonGotenberg"
          @click="recreateWorkorderPdfGotenberg"
          :disabled="buttonDisabled"
          class="btn btn-danger"
          type="button"
          variant="secondary"
        >
          {{ $trans('Recreate workorder PDF') }}
        </b-button>
        <b-button @click="goBack" class="btn btn-info" type="button" variant="primary">
          {{ $trans('Back') }}</b-button>
      </footer>
    </div>
  </b-overlay>
</template>

<script>
import { OrderService } from '../../models/orders/Order.js'
import { componentMixin } from '../../utils'
import { PurchaseInvoiceService } from "../../models/orders/PurchaseInvoice";
import IconLinkPlus from "../../components/IconLinkPlus";
import PriceInput from "../../components/PriceInput";
import IconLinkDelete from "../../components/IconLinkDelete";

export default {
  mixins: [componentMixin],
  components: {
    IconLinkPlus,
    PriceInput,
    IconLinkDelete,
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      order: null,
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
      ],
      workorderDocumentFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'url', label: this.$trans('URL') },
      ],
      extraDataFields: [
        { key: 'statuscode', label: this.$trans('Status') },
        { key: 'extra_data', label: this.$trans('Text') },
      ],
      purchaseInvoiceFields: [
        { key: 'reference', label: this.$trans('Reference') },
        { key: 'description', label: this.$trans('Description') },
        { key: 'vat', label: this.$trans('VAT') },
        { key: 'total', label: this.$trans('Total') },
        { key: 'icons' },
      ],
      purchaseInvoice: null,
      deletePurchaseInvoicePk: null,
      purchaseInvoiceService: new PurchaseInvoiceService(),
      orderService: new OrderService(),
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    uuid: {
      type: [String],
      default: null
    },
    past: {
      type: [Boolean],
      default: false
    },
  },
  methods: {
    // purchase invoices
    async doDeletePurchaseInvoice() {
      await this.purchaseInvoiceService.delete(this.deletePurchaseInvoicePk)
      await this.loadOrder()
    },
    showDeletePurchaseInvoiceModal(id) {
      this.deletePurchaseInvoicePk = id
      this.$refs['delete-purchase-invoice-modal'].show()
    },
    async doAddPurchaseInvoice() {
      await this.purchaseInvoiceService.insert(this.purchaseInvoice)
      this.purchaseInvoice = this.newPurchaseInvoiceModel()
      await this.loadOrder()
    },
    vatChanged(priceDinero) {
      this.purchaseInvoice.setPriceField('vat', priceDinero)
    },
    totalChanged(priceDinero) {
      this.purchaseInvoice.setPriceField('total', priceDinero)
    },
    newPurchaseInvoiceModel() {
      return new this.purchaseInvoiceService.model({
        order: this.order.id,
        vat: '0.00',
        total: '0.00',
        default_currency: this.$store.getters.getDefaultCurrency
      })
    },
    addPurchaseInvoice() {
      if (this.$refs['add-purchase-invoice-modal']) {
        this.$refs['add-purchase-invoice-modal'].show()
      }
    },

    // the rest
    openWorkorder() {
      const routeData = this.$router.resolve({ name: 'workorder-view', params: { uuid: this.order.uuid } })
      window.open(`${document.location.origin}/${routeData.href}`, '_blank')
    },
    async recreateWorkorderPdfGotenberg() {
      this.isLoading = true
      this.buttonDisabled = true

      try {
        await this.orderService.recreateWorkorderPdfGotenberg(this.pk)
        this.infoToast(this.$trans('Success'), this.$trans('Workorder recreated'))
        this.isLoading = false
        this.buttonDisabled = false
        await this.loadOrder()
      } catch(err) {
        console.log('Error recreating workorder', err)
        this.errorToast(this.$trans('Error recreating workorder'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    goBack() {
      this.$router.go(-1)
    },
    async loadOrder() {
      this.isLoading = true

      try {
        this.order = this.pk !== null ? await this.orderService.detail(this.pk) : await this.orderService.detailUuid(this.uuid)

        if (this.hasBranches) {
          this.purchaseInvoiceService.setListArgs(`order=${this.order.id}`)
          const purchaseInvoiceData = await this.purchaseInvoiceService.list()
          this.order.purchaseInvoices = purchaseInvoiceData.results.map(
            (m) => new this.purchaseInvoiceService.model({
              ...m, default_currency: this.$store.getters.getDefaultCurrency
            })
          )
          this.purchaseInvoice = this.newPurchaseInvoiceModel()
        }
        this.isLoading = false
      } catch(error) {
        console.log('error fetching order', error)
        this.errorToast(this.$trans('Error fetching order'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadOrder()
  }
}
</script>

<style scoped>
.purchase-invoices-table {
  padding-top: 10px;
}
</style>
