<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">

      <InvoicePDFViewer
        :invoice-in="invoice"
        :is-view="true"
        v-if="invoice.id"
        ref="invoice-viewer"
      />

      <header v-if="invoice">
        <div class="page-title">
          <h3>
            <b-icon icon="file-earmark-check-fill"></b-icon>
            <router-link
              :to="{name: 'invoice-list' }"
            >{{ $trans('Invoices') }}</router-link>
            /
            <strong>{{ invoice.invoice_id }}</strong>
            <span>
              <b-link
                class="btn btn-sm btn-primary"
                @click.prevent="showInvoiceDialog"
                target="_blank"
              >
                <b-icon icon="file-earmark"></b-icon>
                {{ $trans('View PDF') }}
              </b-link>
            </span>
            <span>
              <router-link
                class="btn btn-sm btn-primary"
                :to="{name:'order-view', params: {pk: invoice.order}}">
                <b-icon-arrow-up-right-circle
                ></b-icon-arrow-up-right-circle>
                {{ $trans('Order') }}
              </router-link>
            </span>
            <b-button
              @click="sendInvoice"
              type="button"
              variant="primary"
              class="send-quotation-button"
            >
              {{ $trans('Send invoice') }}
            </b-button>
          </h3>
          <div
            class="flex-columns"
          >
            <b-button
              @click="() => showDeleteModal(quotation.id)"
              type="button"
              variant="danger"
            >
              {{ $trans('Delete') }}
            </b-button>
          </div>
        </div>
      </header>

      <div class="page-detail" v-if="invoice">
        <div class="flex-columns">
          <div class="panel col-2-3">
            <div class="container pdf-container">
              <div class="row">
                <div class="col-sm-2 logo">
                    <img class="thumbnail" :src="companyLogo" style="border:0; max-height: 120px; max-width: 120px" :alt="invoice.member.name" />
                </div>
                <div class="col-sm-4 info">
                    <b>{{ invoice.member.name }}</b><br/>
                    {{ invoice.member.address }}<br/>
                    {{ invoice.member.postal }} {{ invoice.member.city }}<br/>
                    {{ invoice.member.tel }} - {{ invoice.member.email}}<br/>
                  <b>{{ $trans('VAT number') }}</b> {{ invoice.member.vat_number }}<br/>
                  <b>{{ $trans('Chamber of commerce') }}</b> {{ invoice.member.chamber_of_commerce }}<br/>
                </div>
                <div class="col-sm-6 panel panel-default">
                  <div class="panel-body">
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Invoice number') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.invoice_id }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Reference') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.reference }}&nbsp;</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Description') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.description }}&nbsp;</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Order ID') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.order_id }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Order reference') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.order_reference }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row">
                  <div class="col-sm-6">
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Customer') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.customer.name }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.customer.address }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.customer.country_code }}-{{ invoice.customer.postal }} {{ invoice.customer.city }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Term of payment') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.term_of_payment_days }} days</span>
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="row"></div>
                  </div>
              </div>
              <div class="row" v-if="invoice.invoicelines.length">
                  <p><b>{{ $trans('Invoice lines') }}</b></p>
                  <table class="table table-bordered">
                      <thead>
                          <th>{{ $trans('Description') }}</th>
                          <th>{{ $trans('Amount') }}</th>
                          <th>{{ $trans('Price') }}</th>
                          <th>{{ $trans('Total') }}</th>
                          <th>{{ $trans('VAT') }}</th>
                      </thead>
                      <tbody>
                          <tr v-for="invoiceline in invoice.invoicelines" :key="invoiceline.id">
                              <td>{{ invoiceline.description }}</td>
                              <td>{{ invoiceline.amount }}</td>
                              <td>{{ invoiceline.price_dinero.toFormat('$0.00') }}</td>
                              <td>{{ invoiceline.total_dinero.toFormat('$0.00') }}</td>
                              <td>{{ invoiceline.vat_dinero.toFormat('$0.00') }}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              <div class='flex-columns space-between'>
                <span class="total-text">{{ $trans('Invoice total') }}</span>

                <TotalsInputs
                  :total="invoice.total_dinero"
                  :is-final-total="true"
                  :vat="invoice.vat_dinero"
                />
              </div>
              <br/>
              <br/>
              <br/>
              <br/>
            </div>
            <hr>
            <div class="container">
              <div class="row">
                <div class="col-6">
                  <StatusesComponent
                    :statuses="invoice.statuses"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>
<script>
import { InvoiceService, InvoiceModel } from '@/models/invoices/Invoice'
import TotalsInputs from "../../components/TotalsInputs";
import StatusesComponent from "@/components/StatusesComponent.vue";
import InvoicePDFViewer from "@/views/invoices/InvoicePDFViewer.vue";

export default {
  name: "InvoiceView",
  components: {
    InvoicePDFViewer,
    TotalsInputs,
    StatusesComponent
  },
  data() {
    return {
      isLoading: false,
      invoice: null,
      companyLogo: null,
      invoiceService: new InvoiceService(),
      iframeLoading: false,
      invoiceURL: '',
      loadingPdf: false
    }
  },
  props: {
    uuid: {
      type: String
    }
  },
  async created() {
    await this.loadInvoice()
  },
  methods: {
    showInvoiceDialog() {
      this.$refs['invoice-viewer'].show();
    },
    async loadInvoice() {
      this.isLoading = true
      try {
        const createPDFHeader = this.$route.query.create_pdf
        const data = await this.invoiceService.getByUuid(this.uuid, createPDFHeader)

        this.invoice = new InvoiceModel(data)
        this.companyLogo = this.data.member.companylogo_url
        this.isLoading = false
      }
      catch(err) {
        this.errorToast(this.$trans('Error loading invoice'))
        this.isLoading = false
      }
    },
    sendInvoice() {
      this.$router.push({name: 'invoice-send',
        query: {
          invoiceId: this.data.id,
        }}
      );
    },
  }
}
</script>

<style lang="less" scoped>
.pdf-container {
  font-size: 12px !important;
  margin-top: 4px;
  font-size: 85%;

  .log, .info {
    padding-top: 12px;
  }

  .underline {
    border-bottom: 1px dotted;
  }

  div.row {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .panel-body {
    padding: 10px;
  }

  .signature {
    height: 150px;
  }
}
</style>
