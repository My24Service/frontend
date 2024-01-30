<template>
  <div class="app-page" v-if="order">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <router-link :to="{name: 'order-list'}">Orders</router-link> /
          <span>#<strong>{{ pk }}</strong></span>
        </h3>
        <div class="flex-columns">
          <router-link class="btn button outline" :to="{name:'order-edit', pk: pk}">
            <b-icon icon="pencil" font-scale="0.95"></b-icon> &nbsp; {{ $trans('Edit order') }}
          </router-link>
          <router-link class="btn" v-if="order.customer_relation" v-bind:title="$trans('Create invoice')"
              :to="{name: 'order-invoice-create', params: {uuid: order.uuid}}">
            <b-icon-receipt-cutoff></b-icon-receipt-cutoff> {{ $trans('Create invoice') }}
          </router-link>
        </div>
      </div>
    </header>

    <div class="page-detail">

      <div v-if="order" class="flex-columns wrap" >

        <div class="panel col-1-3">
          <h3>
            <span><strong>{{ order.order_type }}</strong> <br><small>
              <router-link :to="{name: 'customer-view', params: {pk: order.customer_relation}}">
                {{ order.order_name }}
              </router-link>
            </small></span>
          </h3>
          <dl>
            <dt>
              <span v-if="order.assigned_user_info.length">{{ $trans('Assigned to') }}</span>
            </dt>
            <dd>
              <span v-if="!order.assigned_user_info.length" class="dimmed">{{ $trans('Not assigned') }}</span>
              <span v-for="person in order.assigned_user_info" class="order-assignee">{{ person.full_name }}</span>
            </dd>
            <dt>Status</dt>
            <dd>{{ order.last_status }}</dd>
            <dt>Dates</dt>
            <dd>{{ order.order_date }}</dd>
            <dt>Service &numero;</dt>
            <dd>{{ order.service_number }}</dd>
            <dt>Reference</dt>
            <dd>{{ order.order_reference }}</dd>
            <dt>Workorder</dt>
            <dd class="flex-columns">
              <b-link class="btn btn-sm btn-primary" @click.prevent="showWorkorderDialog()" target="_blank"><b-icon icon="file-earmark"></b-icon>{{ $trans('View workorder') }}</b-link>

              <b-link class="btn btn-sm btn-outline" v-if="order.workorder_pdf_url" :href="order.workorder_pdf_url" target="_blank" :title="$trans('Download PDF') + ' (' + order.workorder_pdf_url + ')'">
                <b-icon icon="file-earmark-pdf"></b-icon>{{ $trans('Download PDF') }}
              </b-link>
            </dd>
            <dt v-if="order.customer_remarks">Remarks</dt>
            <dd v-if="order.customer_remarks">{{ order.remarks }}</dd>
          </dl>

          <hr/>

          <h6><b-icon-person></b-icon-person> Contact</h6>
          <div class="flex-columns space-between" style="max-width: 60ch; margin-inline: auto">
            <p>
              {{ order.order_contact }}<br/>
              <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link></br>
              {{ order.order_tel }}<br/>
              {{ order.order_mobile }}<br/>
            </p>
            <address>
              <strong>{{ order.order_name }}</strong><br />
              {{ order.order_address }}<br />
              {{ order.order_postal }}<br />
              {{ order.order_city }}, {{ order.order_country_code }}
            </address>
          </div>
        </div>

        <div class="panel col-1-3">
          <h6>
            <b-icon-receipt-cutoff></b-icon-receipt-cutoff>
            {{ $trans('Invoices') }}
          </h6>

          <div v-if="order.invoices.length">
            <ul class='listing'>
              <li v-for="invoice of order.invoices" :key="invoice.uuid" >
                <router-link
                  :to="{name: 'order-invoice-view', params: {uuid: invoice.uuid}}"
                  target="_blank"
                  class="listing-item"
                  >
                  {{ $trans('Invoice') }} {{ invoice.invoice_id }}
                </router-link>
              </li>
            </ul>
          </div>
          <div v-else class="text-center p-3">
            <small class="dimmed">{{ $trans('No invoice(s) for this order yet.')}}</small> <br><br>
            <router-link class="btn btn-primary" v-if="order.customer_relation" v-bind:title="$trans('Create invoice')"
              :to="{name: 'order-invoice-create', params: {uuid: order.uuid}}">
              <b-icon-receipt-cutoff></b-icon-receipt-cutoff> {{ $trans('Create invoice') }}
            </router-link>
          </div>

          <div class="purchase-invoices-table" v-if="hasBranches">
            <h6>{{ $trans('Purchase invoices') }}</h6>
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
              <template #cell(reference)="data">
                {{ data.item.reference ? data.item.reference : '(n/a)'  }}
              </template>
              <template #cell(description)="data">
                {{ data.item.description ? data.item.description : '(n/a)'  }}
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
          <h6 v-else class="dimmed">{{ $trans('Purchase invoices') }}</h6>

          <h6 v-if="order.workorder_documents.length > 0">{{ $trans('Workorder documents') }}</h6>
          <div v-if="order.workorder_documents.length > 0">
            <b-table borderless small :fields="workorderDocumentFields" :items="order.workorder_documents" responsive="sm">
              <template #cell(url)="data">
                <b-link :href="data.item.url" target="_blank" class="flex-columns">
                  {{ $trans('Order') }} {{ order.order_id }}
                  <small class="dimmed">{{ data.item.name }}</small>
                </b-link>
              </template>

            </b-table>
          </div>
          <h6 v-else class="dimmed">{{ $trans('Workorder documents') }}</h6>

          <div v-if="order.workorder_documents_partners && order.workorder_documents_partners.length > 0">
            <h6>{{ $trans('Workorder documents partner') }}</h6>
            <b-table borderless small :fields="workorderDocumentFields" :items="order.workorder_documents_partners" responsive="sm">
              <template #cell(url)="data">
                <b-link :href="data.item.url" target="_blank"  class="flex-columns">
                  {{ $trans('Order') }} {{ order.order_id }}
                  <small class="dimmed">{{ data.item.name }}</small>
                </b-link>
              </template>
            </b-table>
          </div>
          <h6 v-else class="dimmed">{{ $trans('Workorder documents partner') }}</h6>

          <div v-if="order.reported_codes_extra_data.length">
            <h6>{{ $trans('Reported extra text') }}</h6>
            <b-table
              borderless
              small
              id="extra-data-table"
              :fields="extraDataFields"
              :items="order.reported_codes_extra_data"
              responsive="sm"
            ></b-table>
          </div>
          <h6 v-else class="dimmed">{{ $trans('Reported extra text') }}</h6>

        </div>

        <div class="panel col-1-3">

          <h6 class="flex-columns space-between align-items-center">
            <span><b-icon-paperclip></b-icon-paperclip> {{ $trans('Documents') }}</span>
            <router-link :to="{name: 'order-documents', params : {'orderPk': pk}}" class="button btn-sm btn-primary">edit documents</router-link>
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
          <small v-else class="dimmed">{{ $trans('No Documents found') }}</small>

          <h6 v-if="order.orderlines.length">{{ $trans('Orderlines') }}</h6>
          <ul class="listing full-size" v-if="order.orderlines.length">
            <li v-for="line in order.orderlines" :key="line.id">
              <div class="listing-item flex-columns">
                <small>{{ line.product  }}</small>
                <small>{{ line.location  }}</small>
                <small>{{ line.remarks  }}</small>
              </div>
            </li>
          </ul>
          <h6 v-else class="dimmed">{{ $trans('Orderlines') }}</h6>

          <ul class='listing full-size' v-if="!isCustomer && !hasBranches && order.infolines.length > 0">
            <h6>{{ $trans('Info lines') }}</h6>
            <li v-for="item of order.infolines" :key="item.id">
              {{ item.info }}
            </li>
          </ul>
          <h6 v-else class="dimmed">{{ $trans('Info lines') }}</h6>

          <h6>
            <b-icon-bar-chart-steps></b-icon-bar-chart-steps>
            {{ $trans('Timeline') }}
          </h6>

          <ul class="listing full-size" style="max-height: 75vh; overflow: auto;">
            <li v-for="status in order.statuses.slice().reverse()" :key="status.id">
              <div class="listing-item">
                <small>{{ status.status }}</small>
                <small class="dimmed">{{ status.created }}</small>
              </div>
            </li>
          </ul>

        </div>
      </div>

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

      <b-modal ref="workorder-viewer" size="xl" v-b-modal.modal-scrollable>
        <div class="d-flex flex-row justify-content-center align-items-center iframe-loader" v-if="iframeLoading">
          <b-spinner medium></b-spinner>
        </div>
        <iframe :src="this.workorderURL" style="min-height:720px; width: 100%;" frameborder="0" @load="iframeLoaded" v-show="!iframeLoading"></iframe>

        <template #modal-footer="{ ok }">
          <b-button class="btn button btn-secondary" @click="openWorkorder()" target="_blank">
              {{ $trans('Open in a new tab') }}
          </b-button>
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
          <!-- Emulate built in modal footer ok and cancel button actions -->
          <b-button @click="ok()" variant="primary">
            close
          </b-button>
        </template>
      </b-modal>
    </div>
  </div>
</template>

<script>
import { OrderService } from '../../models/orders/Order.js'
import { componentMixin } from '../../utils'
import { PurchaseInvoiceService } from "../../models/orders/PurchaseInvoice";
import IconLinkPlus from "@/components/IconLinkPlus.vue";
import PriceInput from "@/components/PriceInput.vue";
import IconLinkDelete from "@/components/IconLinkDelete.vue";

export default {
  mixins: [componentMixin],
  components: {
    IconLinkPlus,
    PriceInput,
    IconLinkDelete
  },
  data() {
    return {
      isLoading: false,
      isGeneratingPDF: false,
      buttonDisabled: false,
      order: null,
      workorderURL: '',
      iframeLoading: true,
      orderLineFields: [
        {key: 'product', label: this.$trans('Product')},
        {key: 'location', label: this.$trans('Location')},
        {key: 'remarks', label: this.$trans('Remarks')}
      ],
      infoLineFields: [
        {key: 'info', label: this.$trans('Infolines')}
      ],
      workorderDocumentFields: [
        {key: 'url', label: this.$trans('URL'),  thStyle: {display: 'none'}},
      ],
      extraDataFields: [
        {key: 'statuscode', label: this.$trans('Status')},
        {key: 'extra_data', label: this.$trans('Text')},
      ],
      purchaseInvoiceFields: [
        {key: 'reference', label: this.$trans('Reference')},
        {key: 'description', label: this.$trans('Description')},
        {key: 'vat', label: this.$trans('VAT')},
        {key: 'total', label: this.$trans('Total')},
        {key: 'icons'},
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
    iframeLoaded() {
        this.iframeLoading = false;
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
    async recreateWorkorderPdfGotenberg() {
        this.isLoading = true;
        this.buttonDisabled = true;
        this.isGeneratingPDF = true;
        try {
            await this.orderService.recreateWorkorderPdfGotenberg(this.pk);
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
  async created() {
    await this.loadOrder();
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

.iframe-loader {
  min-height: 720px
}
iframe {
  min-height: 720px;
  width: 100%;
}
</style>
