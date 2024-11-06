<template>
  <div>
    <b-modal
      id="quotation-definitive-modal"
      ref="quotation-definitive-modal"
      v-bind:title="$trans('Make definitive?')"
      v-if="!isView"
      @ok="doMakeDefinitive"
    >
      <p class="my-4">
        {{ $trans("Are you sure you want to make this quotation definitive?") }}
      </p>
    </b-modal>

    <b-modal
      ref="quotation-viewer"
      size="xl"
      v-b-modal.modal-scrollable
      :title="viewerTitle"
      ok-only
    >
      <template #modal-footer="{ ok }">
        <b-button
          class="btn button btn-danger"
          @click="showMakeDefinitiveModal"
          v-if="quotation.preliminary"
          variant="danger"
        >
          {{ $trans('Make definitive') }}
        </b-button>
        <b-button
          class="btn button btn-danger"
          @click="generatePdf"
          v-if="!quotation.preliminary"
          :disabled="isLoading"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Recreate PDF') }}
        </b-button>
        <b-button
          class="btn button btn-danger"
          @click="downloadPdf"
          v-if="quotation.definitive_pdf_filename"
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
          v-if="quotationURL"
          :src="`${quotationURL}#toolbar=0&navpanes=0&scrollbar=0`"
          @load="iframeLoaded"
        >
        </iframe>
      </b-overlay>
    </b-modal>
  </div>
</template>

<script>
import {QuotationModel, QuotationService} from "@/models/quotations/Quotation";
import my24 from "@/services/my24";
import {CustomerModel, CustomerService} from "@/models/customer/Customer";

export default {
  name: "QuotationPDFViewer",
  props: {
    quotationIn: {
      type: QuotationModel
    },
    isView: {
      type: [Boolean],
      default: false
    },
  },
  computed: {
    viewerTitle() {
      if (this.quotation) {
        return this.quotation.preliminary ? this.$trans("PDF preview") : this.$trans("Definitive PDF")
      }
    },
  },
  data() {
    return {
      quotationService: new QuotationService(),
      customerService: new CustomerService(),
      isLoading: false,
      quotationURL: null,
      quotation: null
    }
  },
  methods: {
    async doMakeDefinitive() {
      this.isLoading = true

      try {
        await this.quotationService.makeDefinitive(this.quotation.id)
        this.errorToast(this.$trans('Success making quotation definitive'))
        this.isLoading = false
        await this.$router.push({ name: 'quotation-view', params: {pk: this.quotation.id }})
      } catch(error) {
        this.errorToast(this.$trans('Error making quotation definitive'))
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
        await this.quotationService.generatePdf(this.quotation.id)
        await this.loadQuotation()
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
      const url = `/api/quotation/quotation/${this.quotation.id}/download_definitive_pdf/`
      this.isLoading = true

      my24.downloadItem(
        url,
        `quotation-${this.quotation.quotation_id}.pdf`,
        function() {
          this.isLoading = false
        }.bind(this),
        'post'
      )
    },
    async downloadPdfBlob() {
      this.isLoading = true;

      try {
        const response = await this.quotationService.downloadPdfBlob(this.quotation.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.quotationURL = URL.createObjectURL(pdfBlob);
        this.isLoading = false
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching quotation pdf, ${error}`)
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
        const response = await this.quotationService.downloadPreviewPdfBlob(this.quotation.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.quotationURL = URL.createObjectURL(pdfBlob);
        this.isLoading = false
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching quotation pdf, ${error}`)
        this.infoToast(
          this.$trans('No PDF'),
          this.$trans(
            'Error fetching preview PDF. Check if there is an active template.'
          )
        )
      }
    },
    showMakeDefinitiveModal() {
      this.$refs['quotation-definitive-modal'].show()
    },
    iframeLoaded() {
      this.isLoading = false;
      URL.revokeObjectURL(this.quotationURL);
    },
    async show() {
      this.$refs['quotation-viewer'].show()
      if (this.quotation.preliminary) {
        await this.downloadPreviewPdfBlob()
      } else {
        await this.downloadPdfBlob()
      }
    },
    async getCustomer(pk) {
      const customerData = await this.customerService.detail(pk)
      this.customer = new CustomerModel(customerData)
    },
    async loadQuotation() {
      this.isLoading = true

      try {
        this.quotation = new QuotationModel(await this.quotationService.detail(this.quotation.id))
        await this.getCustomer(this.quotation.customer_relation)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error fetching quotation'))
        this.isLoading = false
      }
    },
  },
  created() {
    this.quotation = this.quotationIn
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
