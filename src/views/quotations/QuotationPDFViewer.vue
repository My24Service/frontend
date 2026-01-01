<template>
  <div>
    <b-modal
      ref="pdf-error-modal"
      :title="$trans('Error creating PDF')"
      ok-only
    >
      <div
        class="d-block text-center"
        v-if="pdfBlobError"
      >
        <h5 v-if="pdfBlobError.template_error">{{ pdfBlobError.template_error }}</h5>
        <h5 v-if="pdfBlobError.error">{{ pdfBlobError.error }}</h5>
        <p v-if="pdfBlobError.details">
          {{ $trans("details") }}: <strong>{{ pdfBlobError.details }}</strong>
        </p>
      </div>
    </b-modal>

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
        <BButton
          class="btn button btn-danger"
          @click="showMakeDefinitiveModal"
          v-if="quotation.preliminary"
          variant="danger"
        >
          {{ $trans('Make definitive') }}
        </BButton>
        <BButton
          class="btn button btn-danger"
          @click="generatePdf"
          v-if="!quotation.preliminary"
          :disabled="isLoading"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Recreate PDF') }}
        </BButton>
        <BButton
          class="btn button btn-danger"
          @click="downloadPdf"
          v-if="quotation.definitive_pdf_filename"
          :disabled="isLoading"
        >
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Download PDF') }}
        </BButton>
        <BButton @click="ok()" variant="primary">
          {{ $trans("Close") }}
        </BButton>
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
import {CustomerModel, CustomerService} from "@/models/customer/Customer";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

import my24 from "@/services/my24";

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
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
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
        return this.quotation.preliminary ? $trans("PDF preview") : $trans("Definitive PDF")
      } else {
        return ''
      }
    },
  },
  data() {
    return {
      quotationService: new QuotationService(),
      customerService: new CustomerService(),
      isLoading: false,
      quotationURL: null,
      quotation: null,
      pdfBlobError: null,
    }
  },
  methods: {
    async doMakeDefinitive() {
      this.isLoading = true

      try {
        await this.quotationService.makeDefinitive(this.quotation.id)
        infoToast(create, $trans('Success'), $trans('Quotation is now definitive'))
        this.isLoading = false
        await this.$router.push({ name: 'quotation-view', params: {pk: this.quotation.id }})
      } catch(error) {
        errorToast(create, $trans('Error making quotation definitive'))
        this.isLoading = false
        if (error.response?.data?.template_error) {
          errorToast(create, error.response.data.template_error)
          return
        }
        errorToast(create, $trans('Error generating pdf'))
      }
    },
    async generatePdf() {
      this.isLoading = true

      try {
        await this.quotationService.generatePdf(this.quotation.id)
        await this.loadQuotation()
        const result_ok = await this.downloadPdfBlob()
        this.isLoading = false
        if (!result_ok) {
          this.$refs['pdf-error-modal'].show()
        } else {
          infoToast(create, $trans('Success'), $trans('PDF created'))
        }
      } catch(error) {
        console.log('error generating pdf', error)
        this.isLoading = false
        errorToast(create, $trans('Error creating PDF'))
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
        this.pdfBlobError = null
        return true
      } catch(error) {
        console.log(`error fetching quotation definitive PDF, ${error}`)
        this.isLoading = false
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
        const response = await this.quotationService.downloadPreviewPdfBlob(this.quotation.id)
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        this.quotationURL = URL.createObjectURL(pdfBlob);
        this.pdfBlobError = null
        this.isLoading = false
        return true
      } catch(error) {
        this.isLoading = false
        console.log(`error fetching quotation preview PDF, ${error}`)
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
      this.$refs['quotation-definitive-modal'].show()
    },
    iframeLoaded() {
      this.isLoading = false;
      URL.revokeObjectURL(this.quotationURL);
    },
    async show() {
      const result = this.quotation.preliminary ? await this.downloadPreviewPdfBlob() : await this.downloadPdfBlob()
      if (result) {
        this.$refs['quotation-viewer'].show()
      } else {
        this.$refs['pdf-error-modal'].show()
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
        errorToast(create, $trans('Error fetching quotation'))
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
