<template>
  <div>
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
          class="btn button btn-danger"
          @click="generatePdf"
          v-if="!invoice.preliminary"
          :disabled="isLoading"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Recreate PDF') }}
        </b-button>
        <b-button
          class="btn button btn-danger"
          @click="downloadPdf"
          v-if="invoice.definitive_pdf_filename"
          :disabled="isLoading"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Download PDF') }}
        </b-button>
        <b-button @click="ok()" variant="primary">
          {{ $trans("Close") }}
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
import {InvoiceModel, InvoiceService} from "@/models/invoices/Invoice";
import {CustomerModel, CustomerService} from "@/models/customer/Customer";

export default {
  name: "invoicePDFViewer",
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
      customerService: new CustomerService(),
      isLoading: false,
      invoiceURL: null,
      invoice: null
    }
  },
  methods: {
    async doMakeDefinitive() {
      this.isLoading = true

      try {
        await this.invoiceService.makeDefinitive(this.invoice.id)
        this.errorToast(this.$trans('Success making invoice definitive'))
        this.isLoading = false
        await this.$router.push({ name: 'invoice-view', params: {pk: this.invoice.id }})
      } catch(error) {
        this.errorToast(this.$trans('Error making invoice definitive'))
        this.isLoading = false
        if (error.response?.data?.template_error) {
          this.errorToast(error.response.data.template_error)
          return
        }
        this.errorToast(this.$trans('Error generating pdf'))
      }
    },
    async generatePdf() {
      this.isLoading = true

      try {
        await this.invoiceService.generatePdf(this.invoice.id)
        await this.loadInvoice()
        await this.downloadPdfBlob()
        this.isLoading = false
        this.infoToast(this.$trans('Success'), this.$trans('PDF created'))
      } catch(error) {
        console.log('error generating pdf', error)
        this.isLoading = false
        if (error.response?.data?.template_error) {
          this.errorToast(error.response.data.template_error)
        } else {
          this.errorToast(this.$trans('Error creating PDF'))
        }
      }
    },
    async downloadPdf() {
      const url = `/api/invoice/invoice/${this.invoice.id}/download_definitive_pdf/`
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
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching invoice pdf, ${error}`)
        this.infoToast(
          this.$trans('No PDF'),
          this.$trans(
            'Error fetching definitive PDF. Check if there is an active template or try to recreate.'
          )
        )
      }
    },
    async downloadPreviewPdfBlob() {
      this.isLoading = true;

      try {
        const response = await this.invoiceService.downloadPreviewPdfBlob(this.invoice.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.invoiceURL = URL.createObjectURL(pdfBlob);
        this.isLoading = false
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching invoice pdf, ${error}`)
        this.infoToast(
          this.$trans('No PDF'),
          this.$trans(
            'Error fetching preview PDF. Check if there is an active template.'
          )
        )
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
      this.$refs['invoice-viewer'].show()
      if (this.invoice.preliminary) {
        await this.downloadPreviewPdfBlob()
      } else {
        await this.downloadPdfBlob()
      }
    },
    async getCustomer(pk) {
      const customerData = await this.customerService.detail(pk)
      this.customer = new CustomerModel(customerData)
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = new InvoiceModel(await this.invoiceService.detail(this.invoice.id))
        await this.getCustomer(this.invoice.customer_relation)
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
