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
              <b-td>{{ order.order_name }}</b-td>
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
          class="btn btn-secondary"
          type="button"
          variant="secondary"
        >
          <b-spinner small v-if="isGeneratingPDF"></b-spinner>
          {{ $trans('re-generate PDF (new)') }}

          </b-button>
          <b-link class="btn button btn-primary" v-if="order.workorder_pdf_url" :href="order.workorder_pdf_url" target="_blank" :title="$trans('Download PDF') + ' (' + order.workorder_pdf_url + ')'">
            <b-icon icon="file-earmark-pdf"></b-icon>{{ $trans('Download PDF') }}
          </b-link>
        </footer>
      </div>
      <hr>
      <div class="d-flex flex-row justify-content-center align-items-center iframe-loader" v-if="iframeLoading">
        <b-spinner medium></b-spinner>
      </div>
      <iframe :src="this.workorderURL" style="min-height:720px; width: 100%;" frameborder="0" @load="iframeLoaded" v-show="!iframeLoading"></iframe>
      <template #modal-footer="{ ok }">
          <!-- Emulate built in modal footer ok and cancel button actions -->
          <b-button size="sm" @click="ok()" variant="primary">
            close
          </b-button>
      </template>
    
    <div class="flex-columns wrap">
      <div class="panel col-1-3">
        <h3>
          <span><strong>{{ order.order_type }}</strong> <br><small>{{ order.order_name }}</small></span>
        </h3>
        <dl>
          <dt>Status</dt>
          <dd>{{ order.last_status }}</dd>
          <dt>Dates</dt>
          <dd>{{ order.order_date }}</dd>
          <dt>Service &numero;</dt>
          <dd>{{ order.service_number }}</dd>
          <dt>Reference</dt>
          <dd>{{ order.order_reference }}</dd>
          <dt>Workorder {{  order.order_id }}</dt>
          <dd>
            <b-link class="" @click.prevent="showWorkorderDialog()" target="_blank">
              <b-icon icon="file-earmark"></b-icon>{{ $trans('View workorder') }}
            </b-link>
            &nbsp;&nbsp;
            <b-link class="" v-if="order.workorder_pdf_url" :href="order.workorder_pdf_url" target="_blank" :title="$trans('Download PDF') + ' (' + order.workorder_pdf_url + ')'">
              <b-icon icon="file-earmark-pdf"></b-icon>{{ $trans('Download PDF') }}
            </b-link>
          </dd>
          <dt v-if="order.customer_remarks">Remarks</dt>
          <dd v-if="order.customer_remarks">{{ order.remarks }}</dd>
        </dl>

        <h6 class="flex-columns">
          <span>{{ $trans('Documents') }}</span>
          <router-link :to="{name: 'order-documents', params : {'orderPk': pk}}">edit documents</router-link>
        </h6>
        <div class="my-2" v-if="order.documents.length > 0">
          <ul class="listing">
            <li v-for="doc in order.documents" :key="doc.url">
              <a class="listing-item" :href="doc.url" target="_blank">
                <span>{{ doc.name}}</span>
              </a>
            </li>
          </ul>
        </div>
        <h6>{{ $trans('Info lines') }}</h6>
        <ul class='listing' v-if="!isCustomer && !hasBranches && order.infolines.length > 0">
          <li v-for="item of order.infolines" :key="item.id">
            {{ item.info }}
          </li>
        </ul>
        <h6>Orderlines</h6>
        <ul class="listing" v-if="order.orderlines.length">
          <li v-for="line in order.orderlines" :key="line.id">
            <div class="listing-item flex-columns">
              <div>{{ line.product  }}</div>
              <div>{{ line.remarks  }}</div>
              <div>{{ line.location  }}</div>
            </div>
          </li>
        </ul>
      </div>

      <div class="panel col-1-3">
        <h6>Timeline</h6>
        <ul class="listing" style="max-height: 75vh; overflow: auto;">
          <li v-for="status in order.statuses.slice().reverse()" :key="status.id">
            <div class="listing-item">
              <span>{{ status.status }}</span>
              <span class="dimmed">{{ status.created }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="panel col-1-3">
        <h6>Contact</h6>
        <p>
          {{ order.order_contact }}<br/>
          {{ order.order_tel }} {{ order.order_mobile }}<br/>
          <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link>
        </p>
        <hr>
        <address>
          {{ order.order_name }}<br />
          {{ order.order_address }}<br />
          {{ order.order_postal }}<br />
          {{ order.order_city }}, {{ order.order_country_code }}
        </address>
        <hr>

        <b-row class="my-2" v-if="order.workorder_documents_partners && order.workorder_documents_partners.length > 0">
          <b-col cols="12">
            <h6>{{ $trans('Workorder documents partner') }}</h6>
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
            <h6>{{ $trans('Reported extra text') }}</h6>
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
      </div>
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
        iframeLoaded() {
            this.iframeLoading = false;
        },
        openWorkorder() {
            const routeData = this.$router.resolve({ name: 'workorder-view', params: { uuid: this.order.uuid } });
            window.open(`${document.location.origin}/${routeData.href}`, '_blank');
        },
        getWorkorderURL() {
            this.isLoading = true;
            const routeData = this.$router.resolve({ name: 'workorder-view', params: { uuid: this.order.uuid } });
            return `${document.location.origin}/${routeData.href}`;
        },
        showWorkorderDialog() {
            this.iframeLoading = true;
            this.workorderURL = this.getWorkorderURL();
            this.$refs['workorder-viewer'].show();
        },
        async recreateWorkorderPdf() {
            this.isLoading = true;
            this.buttonDisabled = true;
            this.isGeneratingPDF = true;
            try {
                await orderModel.recreateWorkorderPdf(this.pk);
                this.infoToast(this.$trans('Success'), this.$trans('Workorder recreated'));
                this.isLoading = false;
                this.buttonDisabled = false;
                this.isGeneratingPDF = false;
                await this.loadOrder();
            }
            catch (err) {
                console.log('Error recreating workorder', err);
                this.errorToast(this.$trans('Error recreating workorder'));
                this.buttonDisabled = false;
                this.isLoading = false;
                this.isGeneratingPDF = false;
            }
        },
        async recreateWorkorderPdfGotenberg() {
            this.isLoading = true;
            this.buttonDisabled = true;
            this.isGeneratingPDF = true;
            try {
                await orderModel.recreateWorkorderPdfGotenberg(this.pk);
                this.infoToast(this.$trans('Success'), this.$trans('Workorder recreated'));
                await this.loadOrder();
                this.isLoading = false;
                this.buttonDisabled = false;
                this.isGeneratingPDF = false;
            }
            catch (err) {
                console.log('Error recreating workorder', err);
                this.errorToast(this.$trans('Error recreating workorder'));
                this.buttonDisabled = false;
                this.isLoading = false;
                this.isGeneratingPDF = false;
            }
        },
        async loadOrder() {
            this.isLoading = true;
            try {
                this.order = this.pk !== null ? await orderModel.detail(this.pk) : await orderModel.detailUuid(this.uuid);
                this.isLoading = false;
            }
            catch (error) {
                console.log('error fetching order', error);
                this.errorToast(this.$trans('Error fetching order'));
                this.isLoading = false;
            }
        }
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

.iframe-loader {
  min-height: 720px
}
iframe {
  min-height: 720px;
  width: 100%;
}
.purchase-invoices-table {
  padding-top: 10px;
}
</style>
