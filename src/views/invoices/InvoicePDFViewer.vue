<template>
  <div>
    <b-modal
      ref="pdf-error-modal"
      :title="$trans('Error creating PDF')"
      v-if="pdfBlobError"
      ok-only
    >
      <div class="d-block text-center">
        <h5 v-if="pdfBlobError.template_error">{{ pdfBlobError.template_error }}</h5>
        <h5 v-if="pdfBlobError.error">{{ pdfBlobError.error }}</h5>
        <p v-if="pdfBlobError.details">
          {{ $trans("details") }}: <strong>{{ pdfBlobError.details }}</strong>
        </p>
      </div>
    </b-modal>
    <b-modal
      id="invoice-definitive-modal"
      ref="invoice-definitive-modal"
      v-bind:title="$trans('Make definitive?')"
      v-if="!isView"
      @ok="doMakeDefinitive"
    >
      <p class="my-4">
        {{ $trans("Are you sure you want to make this invoice definitive?") }}
      </p>
      <p>
        <strong><i>{{ $trans("You won't be able to make changes after that") }}</i></strong>
      </p>
    </b-modal>

    <b-modal
      ref="invoice-viewer"
      size="xl"
      v-b-modal.modal-scrollable
      :title="viewerTitle"
      ok-only
    >
      <template #modal-footer="{ ok }">
        <b-button
          class="btn button btn-danger"
          @click="showMakeDefinitiveModal"
          v-if="invoice.preliminary"
          variant="danger"
        >
          {{ $trans('Make definitive') }}
        </b-button>
        <b-button
          v-if="!isCustomer && !isBranchEmployee && !invoice.preliminary"
          id="recreateInvoicePdf"
          @click="recreateInvoicePdf"
          :disabled="isLoading"
          class="btn btn-secondary"
          type="button"
          variant="secondary"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Recreate PDF') }}
        </b-button>
        <b-button
          v-if="!isCustomer && !isBranchEmployee && !invoice.preliminary && invoice.invoice_pdf_from_docx_filename"
          @click="downloadPdf"
          :disabled="isLoading"
          type="button"
          variant="primary"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          <b-icon icon="file-earmark-pdf"></b-icon>
          {{ $trans('Download PDF') }}
        </b-button>
        <!-- Emulate built in modal footer ok and cancel button actions -->
        <b-button @click="ok()" variant="primary">
          {{ $trans("close") }}
        </b-button>
      </template>

      <b-overlay :show="isLoading" rounded="sm">
        <iframe
          v-if="invoiceURL"
          :src="`${invoiceURL}#toolbar=0&navpanes=0&scrollbar=0`"
          @load="iframeLoaded"
        >
        </iframe>
      </b-overlay>
    </b-modal>
  </div>
</template>

<script>
import my24 from "@/services/my24";
import {componentMixin} from "@/utils";

import {InvoiceModel, InvoiceService} from "@/models/invoices/Invoice";

import invoiceMixin from "./invoice_form/mixin";

class PdfBlobError {
  template_error
  error
  details

  constructor(message) {
    this.template_error = message.template_error
    this.error = message.error
    this.details = message.details
  }
}

export default {
  name: "invoicePDFViewer",
  mixins: [invoiceMixin, componentMixin],
  props: {
    invoiceIn: {
      type: InvoiceModel
    },
    isView: {
      type: [Boolean],
      default: false
    },
  },
  computed: {
    viewerTitle() {
      if (this.invoice) {
        return this.invoice.preliminary ? this.$trans("PDF preview") : this.$trans("Definitive PDF")
      } else {
        return ''
      }
    },
  },
  data() {
    return {
      invoiceService: new InvoiceService(),
      isLoading: false,
      invoiceURL: null,
      invoice: null,
      pdfBlobError: null,
    }
  },
  methods: {
    async recreateInvoicePdf() {
      this.isLoading = true;
      try {
        await this.invoiceService.recreateInvoicePdf(this.invoice.id);
        await this.loadInvoice()
        await this.downloadPdfBlob()
        const result_ok = await this.downloadPdfBlob()
        this.isLoading = false
        if (!result_ok) {
          this.$refs['pdf-error-modal'].show()
        } else {
          this.infoToast(this.$trans('Success'), this.$trans('Invoice PDF created'));
        }
      }
      catch (err) {
        console.log('Error recreating invoice pdf', err);
        this.errorToast(this.$trans('Error recreating invoice PDF'));
        this.isLoading = false;
      }
    },
    async doMakeDefinitive() {
      this.isLoading = true

      try {
        await this.invoiceService.makeDefinitive(this.invoice.id)
        this.infoToast(this.$trans('Success'), this.$trans('Invoice is now definitive'))
        this.isLoading = false
        await this.$router.push({ name: 'invoice-view', params: {uuid: this.invoice.uuid }})
      } catch(error) {
        this.errorToast(this.$trans('Error making invoice definitive'))
        this.isLoading = false
        if (error.response?.data?.template_error) {
          this.errorToast(error.response.data.template_error)
          return
        }
        this.errorToast(this.$trans('Error generating PDF'))
      }
    },
    async downloadPdf() {
      const url = `/api/invoice/invoice/${this.invoice.id}/download_pdf/`
      this.isLoading = true

      my24.downloadItem(
        url,
        `invoice-${this.invoice.invoice_id}.pdf`,
        function() {
          this.isLoading = false
        }.bind(this),
        'post'
      )
    },
    async downloadPdfBlob() {
      this.isLoading = true;

      try {
        const response = await this.invoiceService.downloadPdfBlob(this.invoice.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.invoiceURL = URL.createObjectURL(pdfBlob);
        this.isLoading = false
        this.pdfBlobError = null
        return true
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching invoice pdf, blob, ${error}`)
        if ("TextDecoder" in window) {
          const enc = new TextDecoder("utf-8")
          const result = JSON.parse(enc.decode(error.response.data))
          this.pdfBlobError = new PdfBlobError(result)
        } else {
          this.pdfBlobError = new PdfBlobError({error: '', details: ''})
        }

        return false
      }
    },
    async downloadPreviewPdfBlob() {
      this.isLoading = true;

      try {
        const response = await this.invoiceService.downloadPreviewPdfBlob(this.invoice.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.invoiceURL = URL.createObjectURL(pdfBlob);
        this.isLoading = false
        this.pdfBlobError = null
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching invoice pdf, ${error}`)
        if ("TextDecoder" in window) {
          const enc = new TextDecoder("utf-8")
          const response = JSON.parse(enc.decode(error.response.data))
          this.pdfBlobError = new PdfBlobError(response)
        } else {
          this.pdfBlobError = new PdfBlobError({error: '', details: ''})
        }
        return false
      }
    },
    showMakeDefinitiveModal() {
      this.$refs['invoice-definitive-modal'].show()
    },
    iframeLoaded() {
      this.isLoading = false;
      URL.revokeObjectURL(this.invoiceURL);
    },
    async show() {
      const result = this.invoice.preliminary ? await this.downloadPreviewPdfBlob() : await this.downloadPdfBlob()
      if (result) {
        this.$refs['invoice-viewer'].show()
      } else {
        this.$refs['pdf-error-modal'].show()
      }
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = new InvoiceModel(await this.invoiceService.detail(this.invoice.id))
        this.isLoading = false
      } catch(error) {
        console.log('error fetching invoice', error)
        this.errorToast(this.$trans('Error fetching invoice'))
        this.isLoading = false
      }
    },
  },
  created() {
    this.invoice = this.invoiceIn
  }
}
</script>

<style scoped>
iframe {
  min-height: 720px;
  width: 100%;
  border: 0;
}
</style>
