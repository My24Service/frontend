<template>
  <div class="app-page" v-if="order">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkTextFill></IBiFileEarmarkTextFill>
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <span>#<strong>{{ order.order_id }}</strong></span>
        </h3>
        <div class="flex-columns">
          <router-link class="btn button outline" :to="{name:'order-edit', pk: pk}">
            <IBiPencil font-scale="0.95"></IBiPencil> &nbsp; {{ $trans('Edit order') }}
          </router-link>
          <router-link class="btn" v-if="order.customer_relation" v-bind:title="$trans('Create invoice')"
              :to="{name: 'invoice-create', params: {uuid: order.uuid}}">
            <IBiReceiptCutoff></IBiReceiptCutoff> {{ $trans('Create invoice') }}
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
              <span
                v-for="(person, index) in order.assigned_user_info"
                class="order-assignee"
                :key="person.full_name"
              >
                <span v-if="index > 0"> - </span>
                {{ person.full_name }}
              </span>
            </dd>
            <dt>{{ $trans("Status") }}</dt>
            <dd>{{ order.last_status }}</dd>
            <dt>{{ $trans("Dates") }}</dt>
            <dd>{{ order.order_date }}</dd>
            <dt>{{ $trans("Customer reference") }}</dt>
            <dd>{{ order.customer_reference }}</dd>
            <dt>{{ $trans("Reference") }}</dt>
            <dd>{{ order.order_reference }}</dd>
            <dt>{{ $trans("Remarks") }}</dt>
            <dd>{{ order.remarks }}</dd>
            <dt v-if="isPlanning">{{ $trans("Planning remarks") }}</dt>
            <dd v-if="isPlanning">{{ order.planning_remarks }}</dd>
            <dt v-if="!isCustomer">{{ $trans("Customer remarks") }}</dt>
            <dd v-if="!isCustomer">{{ order.customer_remarks }}</dd>
            <dt v-if="!hasBranches">{{ $trans("Workorder") }}</dt>
            <dd class="flex-columns">
              <BLink class="btn btn-sm btn-primary" @click.prevent="showWorkorderDialog()" target="_blank">
                <IBiFileEarmark></IBiFileEarmark>
                {{ $trans('View workorder') }}
              </BLink>
            </dd>
            <dd v-if="!hasBranches" class="flex-columns">
              <BLink class="btn btn-sm btn-outline" v-if="order.workorder_pdf_url" :href="order.workorder_pdf_url" target="_blank" :title="$trans('Download PDF') + ' (' + order.workorder_pdf_url + ')'">
                <IBiFileEarmarkPdf></IBiFileEarmarkPdf>{{ $trans('Download PDF') }}
              </BLink>
            </dd>
            <dt>{{ $trans("Original order ID") }}</dt>
            <dd class="flex-columns">
              <div v-if="order.parent_order_data && order.parent_order_data.companycode">
                {{ order.parent_order_data.companycode }} - {{ order.parent_order_data.order_id}}
              </div>
            </dd>
            <dt v-if="hasBranches">{{ $trans("Workorder original order ") }}</dt>
            <dd v-if="hasBranches" class="flex-columns">
              <div v-if="order.workorder_url_org_order">
                <BLink
                  class="btn btn-sm btn-outline"
                  v-if="order.workorder_url_org_order.url"
                  :href="order.workorder_url_org_order.url"
                  target="_blank"
                  :title="`${$trans('Download PDF')}(${order.workorder_url_org_order.url}`">
                  <IBiFileEarmarkPdf></IBiFileEarmarkPdf>{{ $trans('Download PDF') }}
                </BLink>
              </div>
            </dd>
            <dt>{{ $trans("Partner order ID(s)") }}</dt>
            <dd>
              <div
                v-if="order.copied_order_data"
                >
                <div
                  v-for="data in order.copied_order_data"
                  :key="data.companycode"
                >
                  {{ data.companycode }} - {{ data.order_id}}
                </div>
              </div>
            </dd>

            <dt>{{ $trans("Workorders partners") }}</dt>
            <dd class="flex-columns">
              <div v-for="workorder in order.workorder_pdf_url_partner" :key="workorder.companycode">
                {{ workorder.companycode }}
                <span v-if="workorder.via">({{ $trans("via") }} {{ workorder.via }})</span>
                <BLink class="btn btn-sm btn-outline" :href="workorder.url" target="_blank" :title="$trans('Download PDF') + ' (' + workorder.url + ')'">
                  <IBiFileEarmarkPdf></IBiFileEarmarkPdf>
                  {{ $trans('Download PDF') }}
                </BLink>
              </div>
            </dd>
            <dt v-if="isPlanning">{{ $trans("Order email extra") }}</dt>
            <dd v-if="isPlanning">{{ order.order_email_extra.join(", ") }}</dd>
          </dl>
          <hr/>

          <h6><IBiPerson></IBiPerson>{{ $trans("Contact") }}</h6>
          <div class="flex-columns space-between" style="max-width: 60ch; margin-inline: auto">
            <p>
              {{ order.order_contact }}<br/>
              <BLink v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</BLink><br/>
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
            <IBiReceiptCutoff></IBiReceiptCutoff>
            {{ $trans('Invoices') }}
          </h6>

          <div v-if="order.invoices.length">
            <ul class='listing'>
              <li v-for="invoice of order.invoices" :key="invoice.uuid" >
                <router-link
                  v-if="invoice.preliminary"
                  :to="{name: 'invoice-edit', params: {pk: invoice.id, uuid: order.uuid}}"
                  class="listing-item"
                  >
                  {{ $trans('Invoice') }} {{ invoice.invoice_id }}
                </router-link>
                <router-link
                  v-else
                  :to="{name: 'invoice-view', params: {uuid: invoice.uuid}}"
                >
                  {{ $trans('Invoice') }} {{ invoice.invoice_id }}
                </router-link>
              </li>
            </ul>
          </div>
          <div v-else class="text-center p-3">
            <small class="dimmed">{{ $trans('No invoice(s) for this order yet.')}}</small> <br><br>
            <router-link class="btn btn-primary" v-if="order.customer_relation" v-bind:title="$trans('Create invoice')"
              :to="{name: 'invoice-create', params: {uuid: order.uuid}}">
              <IBiReceiptCutoff></IBiReceiptCutoff> {{ $trans('Create invoice') }}
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
                  <BButton-toolbar>
                    <BButton-group class="mr-1">
                      <IconLinkPlus
                        type="th"
                        :method="addPurchaseInvoice"
                        :title="$trans('New purchase invoice')"
                      />
                    </BButton-group>
                  </BButton-toolbar>
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
                <BLink :href="data.item.url" target="_blank" class="flex-columns">
                  {{ $trans('Order') }} {{ order.order_id }}
                  <small class="dimmed">{{ data.item.name }}</small>
                </BLink>
              </template>

            </b-table>
          </div>
          <h6 v-else class="dimmed">{{ $trans('Workorder documents') }}</h6>

          <div v-if="order.workorder_documents_partners && order.workorder_documents_partners.length > 0">
            <h6>{{ $trans('Workorder documents partner') }}</h6>
            <b-table borderless small :fields="workorderDocumentFields" :items="order.workorder_documents_partners" responsive="sm">
              <template #cell(url)="data">
                <BLink :href="data.item.url" target="_blank"  class="flex-columns">
                  {{ $trans('Order') }} {{ order.order_id }}
                  <small class="dimmed">{{ data.item.name }}</small>
                </BLink>
              </template>
            </b-table>
          </div>
          <h6 v-else class="dimmed">{{ $trans('Workorder documents partner') }}</h6>

          <div v-if="order.workorder_documents_org_order && order.workorder_documents_org_order.length > 0 && hasBranches">
            <h6>{{ $trans('Workorder documents original order') }}</h6>
            <b-table
              borderless small
              :fields="workorderDocumentFields"
              :items="order.workorder_documents_org_order" responsive="sm">
              <template #cell(url)="data">
                <BLink :href="data.item.url" target="_blank"  class="flex-columns">
                  {{ $trans('Order') }} {{ order.order_id }}
                  <small class="dimmed">{{ data.item.name }}</small>
                </BLink>
              </template>
            </b-table>
          </div>

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

          <div class="documents section">
            <DocumentsComponent
              v-if="order"
              :order="order"
              :is-view="true"
            />
          </div>

          <h6 v-if="order.orderlines.length">{{ $trans('Orderlines') }}</h6>
          <b-table
            id="orderlines-table"
            small
            :fields="orderLineFields"
            :items="order.orderlines"
            responsive="md"
            class="data-table"
          >
          </b-table>
          <h6
            v-if="!order.orderlines.length"
            class="dimmed"
          >
            {{ $trans('No orderlines') }}
          </h6>

          <!--          <ul class="listing full-size" v-if="order.orderlines.length">-->
<!--            <li v-for="line in order.orderlines" :key="line.id">-->
<!--              <div class="listing-item flex-columns">-->
<!--                <small>{{ line.product  }}</small>-->
<!--                <small>{{ line.location  }}</small>-->
<!--                <small>{{ line.remarks  }}</small>-->
<!--              </div>-->
<!--            </li>-->
<!--          </ul>-->

          <ul class='listing full-size' v-if="!isCustomer && !hasBranches && order.infolines.length > 0">
            <h6>{{ $trans('Info lines') }}</h6>
            <li v-for="item of order.infolines" :key="item.id">
              {{ item.info }}
            </li>
          </ul>
          <h6 v-else class="dimmed">{{ $trans('Info lines') }}</h6>

          <div
            v-if="order.statuses"
          >
            <hr/>
            <StatusesComponent
              :statuses="order.statuses"
            />
          </div>


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
                <BFormGroup
                  v-bind:label="$trans('VAT')"
                  label-for="add-purchase-invoice-vat"
                >
                  <PriceInput
                    id="add-purchase-invoice-vat"
                    v-model="purchaseInvoice.vat"
                    :currency="purchaseInvoice.vat_currency"
                    @priceChanged="(val) => vatChanged(val)"
                  />
                </BFormGroup>
              </b-col>
              <b-col cols="6">
                <BFormGroup
                  v-bind:label="$trans('Total')"
                  label-for="add-purchase-invoice-total"
                >
                  <PriceInput
                    id="add-purchase-invoice-total"
                    v-model="purchaseInvoice.total"
                    :currency="purchaseInvoice.total_currency"
                    @priceChanged="(val) => totalChanged(val)"
                  />
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4">
                <BFormGroup
                  v-bind:label="$trans('Reference')"
                  label-for="add-purchase-invoice-reference"
                >
                  <BFormInput
                    size="sm"
                    id="add-purchase-invoice-reference"
                    v-model="purchaseInvoice.reference"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="8">
                <BFormGroup
                  v-bind:label="$trans('Description')"
                  label-for="add-purchase-invoice-description"
                >
                  <BFormTextarea
                    id="add-purchase-invoice-description"
                    v-model="purchaseInvoice.description"
                    rows="1"
                  ></BFormTextarea>
                </BFormGroup>
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
          <BButton class="btn button btn-secondary" @click="openWorkorder()" target="_blank">
              {{ $trans('Open in a new tab') }}
          </BButton>
          <BButton
            v-if="!past && !isCustomer && !isBranchEmployee"
            id="recreateWorkorderPdfButtonGotenberg"
            @click="recreateWorkorderPdfGotenberg"
            :disabled="buttonDisabled"
            class="btn btn-secondary"
            type="button"
            variant="secondary"
          >
          <b-spinner small v-if="isGeneratingPDF"></b-spinner>
          {{ $trans('re-generate PDF') }}

          </BButton>
          <BLink class="btn button btn-primary" v-if="order.workorder_pdf_url" :href="order.workorder_pdf_url" target="_blank" :title="$trans('Download PDF') + ' (' + order.workorder_pdf_url + ')'">
            <IBiFileEarmarkPdf></IBiFileEarmarkPdf>{{ $trans('Download PDF') }}
          </BLink>
          <!-- Emulate built in modal footer ok and cancel button actions -->
          <BButton @click="ok()" variant="primary">
            {{ $trans("close") }}
          </BButton>
        </template>
      </b-modal>
    </div>
  </div>
</template>

<script>
import { OrderService } from '@/models/orders/Order'
import { PurchaseInvoiceService } from "@/models/invoices/PurchaseInvoice";
import IconLinkPlus from "@/components/IconLinkPlus.vue";
import PriceInput from "@/components/PriceInput.vue";
import IconLinkDelete from "@/components/IconLinkDelete.vue";
import StatusesComponent from "@/components/StatusesComponent.vue";
import DocumentsComponent from "@/views/orders/order_form/DocumentsComponent.vue";
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
    // ApiResult,
    DocumentsComponent,
    StatusesComponent,
    IconLinkPlus,
    PriceInput,
    IconLinkDelete,
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
        {key: 'product', label: $trans('Product'), thAttr: {width: '30%'}},
        {key: 'location', label: $trans('Location'), thAttr: {width: '30%'}},
        {key: 'remarks', label: $trans('Remarks'), thAttr: {width: '40%'}}
      ],
      infoLineFields: [
        {key: 'info', label: $trans('Infolines')}
      ],
      workorderDocumentFields: [
        {key: 'url', label: $trans('URL'),  thStyle: {display: 'none'}},
      ],
      extraDataFields: [
        {key: 'statuscode', label: $trans('Status')},
        {key: 'extra_data', label: $trans('Text')},
      ],
      purchaseInvoiceFields: [
        {key: 'reference', label: $trans('Reference')},
        {key: 'description', label: $trans('Description')},
        {key: 'vat', label: $trans('VAT')},
        {key: 'total', label: $trans('Total')},
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
            infoToast(create, $trans('Success'), $trans('Workorder recreated'));
            await this.loadOrder();
            this.isLoading = false;
            this.buttonDisabled = false;
            this.isGeneratingPDF = false;
        }
        catch (err) {
            console.log('Error recreating workorder', err);
            errorToast(create, $trans('Error recreating workorder'));
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

        // set location based on setting
        if (this.$store.getters.getMemberUsesEquipment) {
          for (let i=0; i<this.order.orderlines.length; i++) {
            if (this.order.orderlines[i].equipment_location_view.name !== "" && this.order.orderlines[i].equipment_location_view.name !== null) {
              console.debug(`overriding orderline location from '${this.order.orderlines[i].location} to ${this.order.orderlines[i].equipment_location_view.name}`)
              this.order.orderlines[i].location = this.order.orderlines[i].equipment_location_view.name
            }

            if (this.order.orderlines[i].equipment_view.name !== "" && this.order.orderlines[i].equipment_view.name !== null) {
              console.debug(`overriding orderline product from '${this.order.orderlines[i].product} to ${this.order.orderlines[i].equipment_view.name}`)
              this.order.orderlines[i].product = this.order.orderlines[i].equipment_view.name
            }
          }
        }

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
        errorToast(create, $trans('Error fetching order'))
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
