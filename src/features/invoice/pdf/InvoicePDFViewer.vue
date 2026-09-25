<template>
  <div>
    <b-modal ref="pdf-error-modal" :title="$trans('Error creating PDF')" :ok-only="true">
      <div class="d-block text-center" v-if="pdfBlobError">
        <h5 v-if="pdfBlobError.template_error">{{ pdfBlobError.template_error }}</h5>
        <h5 v-if="pdfBlobError.error">{{ pdfBlobError.error }}</h5>
        <p v-if="pdfBlobError.details">
          {{ $trans("details") }}: <strong>{{ pdfBlobError.details }}</strong>
        </p>
      </div>
    </b-modal>
    <b-modal id="invoice-definitive-modal" ref="invoice-definitive-modal"
      v-bind:title="$trans('Make definitive?')" v-if="!isView" @ok="doMakeDefinitive">
      <p class="my-4">
        {{ $trans("Are you sure you want to make this invoice definitive?") }}
      </p>
      <p>
        <strong><i>{{ $trans("You won't be able to make changes after that") }}</i></strong>
      </p>
    </b-modal>

    <b-modal ref="invoice-viewer" size="xl" scrollable :title="viewerTitle" :ok-only="true">
      <template #footer="{ ok }">
        <BButton class="btn button btn-danger" @click="showMakeDefinitiveModal"
          v-if="invoice.preliminary && !isView" :disabled="isLoading" variant="danger">
          {{ $trans('Make definitive') }}
        </BButton>
        <BButton v-if="canManagePdf && !invoice.preliminary" id="recreateInvoicePdf"
          @click="recreateInvoicePdf" :disabled="isLoading" class="btn btn-secondary" type="button" variant="secondary">
          <b-spinner small v-if="isLoading"></b-spinner>
          {{ $trans('Recreate PDF') }}
        </BButton>
        <BButton
          v-if="canManagePdf && !invoice.preliminary && invoice.invoice_pdf_from_docx_filename"
          @click="downloadPdf" :disabled="isLoading" type="button" variant="primary">
          <b-spinner small v-if="isLoading"></b-spinner>
          <IBiFileEarmarkPdf></IBiFileEarmarkPdf>
          {{ $trans('Download PDF') }}
        </BButton>
        <BButton @click="ok()" variant="primary">
          {{ $trans("close") }}
        </BButton>
      </template>

      <b-overlay :show="isLoading" rounded="sm">
        <iframe v-if="invoiceURL" :src="invoiceURL" @load="iframeLoaded"></iframe>
      </b-overlay>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { invoiceInvoiceDetailRetrieveQueryKey } from '@/api/@tanstack/vue-query.gen'

import { decodePdfError, downloadBlob, type PdfBlobError } from '@/features/shared'

// The editor's and viewer's records come from two retrieve endpoints; the
// uuid-keyed detail read leaves order_uuid off the record. Only id (all
// mutations) and uuid (optional, cache invalidation) are load-bearing here.
type ViewerInvoice = Omit<Api.Invoice, 'order_uuid'> & {order_uuid?: string}

const props = withDefaults(defineProps<{
  invoice: ViewerInvoice
  isView?: boolean
}>(), {isView: false})

const {create} = useToast()
const router = useRouter()
const authStore = useAuthStore()
// A customer or branch employee may read the PDF but not regenerate it.
const canManagePdf = computed(() => !authStore.isCustomer && !authStore.isBranchEmployee)

const errorModal = useTemplateRef<{show: () => void}>('pdf-error-modal')
const definitiveModal = useTemplateRef<{show: () => void}>('invoice-definitive-modal')
const viewerModal = useTemplateRef<{show: () => void}>('invoice-viewer')

const viewerTitle = computed(() => props.invoice
  ? (props.invoice.preliminary ? $trans('PDF preview') : $trans('Definitive PDF'))
  : '')
const isLoading = ref(false)
const invoiceURL = ref<string | null>(null)
const pdfBlobError = ref<PdfBlobError | null>(null)

const queryClient = useQueryClient()
const previewMutation = useMutation(Api.InvoiceInvoice.extras.generatePreviewPdfCreate.mutation())
const downloadMutation = useMutation(Api.InvoiceInvoice.extras.downloadPdfCreate.mutation())
const recreateMutation = useMutation(Api.InvoiceInvoice.extras.recreatePdfCreate.mutation())
const definitiveMutation = useMutation(Api.InvoiceInvoice.extras.makeDefinitiveCreate.mutation())

async function loadBlob(): Promise<boolean> {
  isLoading.value = true
  try {
    const blob = props.invoice.preliminary
      ? await previewMutation.mutateAsync({path: {id: props.invoice.id}})
      : await downloadMutation.mutateAsync({path: {id: props.invoice.id}})
    releaseBlob()
    invoiceURL.value = URL.createObjectURL(blob)
    pdfBlobError.value = null
    isLoading.value = false
    return true
  } catch (error) {
    isLoading.value = false
    pdfBlobError.value = await decodePdfError(error)
    return false
  }
}

async function show() {
  const result = await loadBlob()
  if (result) viewerModal.value?.show()
  else errorModal.value?.show()
}
defineExpose({show})

function releaseBlob() {
  if (invoiceURL.value) URL.revokeObjectURL(invoiceURL.value)
}

function iframeLoaded() {
  isLoading.value = false
}

function showMakeDefinitiveModal() {
  definitiveModal.value?.show()
}

function invalidateAfterPdfChange() {
  releaseBlob()
  const keys = [
    Api.InvoiceInvoice.retrieve.queryKey({path: {id: props.invoice.id}}),
    // The uuid-keyed detail read exists only once the record carries a uuid.
    ...(props.invoice.uuid ? [invoiceInvoiceDetailRetrieveQueryKey({path: {id: props.invoice.uuid}})] : []),
  ]
  return Promise.all(keys.map(queryKey => queryClient.invalidateQueries({queryKey})))
}

async function recreateInvoicePdf() {
  isLoading.value = true
  try {
    await recreateMutation.mutateAsync({path: {id: props.invoice.id}})
    await invalidateAfterPdfChange()
    if (!await loadBlob()) {
      errorModal.value?.show()
      return
    }
    isLoading.value = false
    infoToast(create, $trans('Success'), $trans('Invoice PDF created'))
  } catch (error) {
    isLoading.value = false
    const template = (error as {response?: {data?: {template_error?: string}}})?.response?.data?.template_error
    if (template) {
      pdfBlobError.value = {template_error: template}
      errorModal.value?.show()
    }
    errorToast(create, $trans('Error recreating invoice PDF'))
  }
}

async function doMakeDefinitive() {
  isLoading.value = true
  try {
    await definitiveMutation.mutateAsync({path: {id: props.invoice.id}})
    await Promise.all([invalidateAfterPdfChange(), Api.InvoiceInvoice.invalidate(queryClient)])
    isLoading.value = false
    infoToast(create, $trans('Success'), $trans('Invoice is now definitive'))
    // make_definitive's response carries no uuid and the prop still holds the
    // record from before it, so read the invoice fresh for where to go next.
    const {uuid} = await queryClient.fetchQuery({
      ...Api.InvoiceInvoice.retrieve.options({path: {id: props.invoice.id}}),
      staleTime: 0,
    })
    if (uuid) {
      await router.push({name: 'invoice-view', params: {uuid}})
    }
  } catch (error) {
    isLoading.value = false
    const data = (error as {response?: {data?: PdfBlobError}})?.response?.data
    if (data?.template_error) {
      errorToast(create, data.template_error)
      return
    }
    errorToast(create, $trans('Error making invoice definitive'))
  }
}

async function downloadPdf() {
  isLoading.value = true
  try {
    const blob = await downloadMutation.mutateAsync({path: {id: props.invoice.id}})
    downloadBlob(blob, `invoice-${props.invoice.invoice_id ?? props.invoice.id}.pdf`)
  } catch {
    errorToast(create, $trans('Error downloading invoice PDF'))
  } finally {
    isLoading.value = false
  }
}

// A definitive flip must refresh the next preview instead of the stale blob.
watch(() => props.invoice.preliminary, releaseBlob)
onBeforeUnmount(releaseBlob)
</script>

<style scoped>
iframe {
  min-height: 720px;
  width: 100%;
  border: 0;
}
</style>