<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <b-modal ref="invoice-viewer" size="xl" v-b-modal.modal-scrollable>
        <div class="d-flex flex-row justify-content-center align-items-center iframe-loader" v-if="iframeLoading">
          <b-spinner medium></b-spinner>
        </div>
        <iframe :src="invoiceURL" style="min-height:720px; width: 100%;" frameborder="0" @load="iframeLoaded" v-show="!iframeLoading"></iframe>

        <template #modal-footer="{ ok }">
          <b-button
            class="btn button btn-danger"
            @click="generatePdf"
            :disabled="loadingPdf"
          >
            <b-spinner small v-if="loadingPdf"></b-spinner>
            {{ $trans('Regenerate pdf') }}
          </b-button>
          <b-button
            class="btn button btn-danger"
            @click="downloadPdf"
            v-if="data.invoice_pdf_from_docx_filename"
            :disabled="loadingPdf"
          >
            <b-spinner small v-if="loadingPdf"></b-spinner>
            {{ $trans('Download pdf') }}
          </b-button>
          <!-- Emulate built in modal footer ok and cancel button actions -->
          <b-button @click="ok()" variant="primary">
            {{ $trans("close") }}
          </b-button>
        </template>
      </b-modal>

      <header v-if="data">
        <div class="page-title">
          <h3>
            <b-icon icon="file-earmark-check-fill"></b-icon>
            <router-link
              :to="{name: 'quotation-list' }"
            >{{ $trans('Quotations') }}</router-link>
            /
            <strong>{{ data.invoice_id }}</strong>
            <span>
              <b-link
                class="btn btn-sm btn-primary"
                @click.prevent="showInvoiceDialog"
                target="_blank"
              >
                <b-icon icon="file-earmark"></b-icon>
                {{ $trans('View pdf') }}
              </b-link>
            </span>
            <span>
              <router-link
                class="btn btn-sm btn-primary"
                :to="{name:'order-view', params: {pk: data.order}}">
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

      <div class="page-detail" v-if="data">
        <div class="flex-columns">
          <div class="panel col-2-3">
            <div class="container pdf-container">
              <div class="row">
                <div class="col-sm-2 logo">
                    <img class="thumbnail" :src="companyLogo" style="border:0; max-height: 120px; max-width: 120px" :alt="data.member.name" />
                </div>
                <div class="col-sm-4 info">
                    <b>{{ data.member.name }}</b><br/>
                    {{ data.member.address }}<br/>
                    {{ data.member.postal }} {{ data.member.city }}<br/>
                    {{ data.member.tel }} - {{ data.member.email}}<br/>
                  <b>{{ $trans('VAT number') }}</b> {{ data.member.vat_number }}<br/>
                  <b>{{ $trans('Chamber of commerce') }}</b> {{ data.member.chamber_of_commerce }}<br/>
                </div>
                <div class="col-sm-6 panel panel-default">
                  <div class="panel-body">
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Invoice number') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.invoice_id }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Reference') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.reference }}&nbsp;</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Description') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.description }}&nbsp;</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Order ID') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.order_id }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Order reference') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ data.order_reference }}</span>
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
                          <span class="pull-right">{{ data.customer.name }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ data.customer.address }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ data.customer.country_code }}-{{ data.customer.postal }} {{ data.customer.city }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Term of payment') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ data.term_of_payment_days }} days</span>
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="row"></div>
                  </div>
              </div>
              <div class="row" v-if="data.invoicelines.length">
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
                          <tr v-for="invoiceline in data.invoicelines" :key="invoiceline.id">
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
                  :total="data.total_dinero"
                  :is-final-total="true"
                  :vat="data.vat_dinero"
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
                    :statuses="data.statuses"
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
import my24 from '../../services/my24.js'
import { InvoiceService, InvoiceModel } from '../../models/invoices/Invoice.js'
import TotalsInputs from "../../components/TotalsInputs";
import StatusesComponent from "@/components/StatusesComponent.vue";

export default {
  name: "InvoiceView",
  components: {
    TotalsInputs,
    StatusesComponent
  },
  data() {
    return {
      isLoading: false,
      data: null,
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
    this.loadInvoice()
  },
  methods: {
    iframeLoaded() {
      this.iframeLoading = false;
      URL.revokeObjectURL(this.invoiceURL);
    },
    async downloadPdf() {
      const url =  `/api/invoice/invoice/${this.data.id}/download_pdf_from_template/`
      this.loadingPdf = true;

      my24.downloadItem(
        url,
        `invoice-${this.data.invoice_id}.pdf`,
        function() {
          this.loadingPdf = false;
        }.bind(this),
        'post'
      )
    },
    showInvoiceDialog() {
      this.downloadPdfBlob()
      this.$refs['invoice-viewer'].show();
    },
    async downloadPdfBlob() {
      this.iframeLoading = true;

      try {
        const response = await this.invoiceService.downloadPdfBlob(this.data.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.invoiceURL = URL.createObjectURL(pdfBlob);
        this.iframeLoading = false
      } catch(error) {
        console.log(`error fetching invoice pdf, ${error}`)
        this.errorToast(
          this.$trans(
            'Error fetching invoice pdf. Check if there is an active template or try to regenerate'
          )
        )
        this.iframeLoading = false
      }
    },
    async generatePdf() {
      this.isLoading = true;
      this.loadingPdf = true;
      try {
          await this.invoiceService.recreateInvoicePdf(this.data.id);
          this.infoToast(this.$trans('Success'), this.$trans('Invoice pdf recreated'));
          await this.downloadPdfBlob()
          this.isLoading = false;
          this.loadingPdf = false;
      }
      catch (err) {
          console.log('Error recreating invoice pdf', err);
          this.errorToast(this.$trans('Error recreating invoice pdf'));
          this.isLoading = false;
          this.loadingPdf = false;
      }
    },
    async loadInvoice() {
      this.isLoading = true
      try {
        const createPDFHeader = this.$route.query.create_pdf
        const data = await this.invoiceService.getByUuid(this.uuid, createPDFHeader)

        this.data = new InvoiceModel(data)
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
