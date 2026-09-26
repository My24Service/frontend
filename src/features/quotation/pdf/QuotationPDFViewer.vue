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

    <b-modal
      id="quotation-definitive-modal"
      ref="quotation-definitive-modal"
      :title="$trans('Make definitive?')"
      v-if="!isView"
      @ok="doMakeDefinitive"
    >
      <p class="my-4">
        {{ $trans("Are you sure you want to make this quotation definitive?") }}
      </p>
    </b-modal>

    <b-modal ref="quotation-viewer" size="xl" scrollable :title="viewerTitle" :ok-only="true">
      <template #footer="{ ok }">
        <BButton
          class="btn button btn-danger"
          @click="showMakeDefinitiveModal"
          v-if="quotation.preliminary && !isView"
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
        ></iframe>
      </b-overlay>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { decodePdfError, downloadBlob, type PdfBlobError } from '@/features/shared'

/** What the viewer reads off a quotation: the list, view and form records all carry it. */
export type ViewerQuotation = Pick<Api.Quotation, 'id' | 'quotation_id' | 'preliminary' | 'definitive_pdf_filename'>

const props = withDefaults(defineProps<{
  quotation: ViewerQuotation
  isView?: boolean
}>(), {isView: false})

const { router, toast: create, queryClient } = useCommon()

const errorModal = useTemplateRef<{show: () => void}>('pdf-error-modal')
const definitiveModal = useTemplateRef<{show: () => void}>('quotation-definitive-modal')
const viewerModal = useTemplateRef<{show: () => void}>('quotation-viewer')

// Generating the definitive PDF answers with the quotation as it now stands
// (the new filename included); the viewer adopts that until the parent hands
// it a newer record.
const adopted = ref<ViewerQuotation | null>(null)
watch(() => props.quotation, () => { adopted.value = null })
const quotation = computed(() => adopted.value ?? props.quotation)

const viewerTitle = computed(() => quotation.value.preliminary ? $trans('PDF preview') : $trans('Definitive PDF'))
const isLoading = ref(false)
const quotationURL = ref<string | null>(null)
const pdfBlobError = ref<PdfBlobError | null>(null)

const previewMutation = useMutation(Api.QuotationQuotation.extras.generatePreviewPdfCreate.mutation())
const downloadMutation = useMutation(Api.QuotationQuotation.extras.downloadDefinitivePdfCreate.mutation())
const generateMutation = useMutation(Api.QuotationQuotation.extras.generateDefinitivePdfCreate.mutation())
const definitiveMutation = useMutation(Api.QuotationQuotation.extras.makeDefinitiveCreate.mutation())

/** A preliminary quotation shows a fresh preview, a definitive one its stored PDF. */
async function loadBlob(): Promise<boolean> {
  isLoading.value = true
  const path = {id: quotation.value.id}
  try {
    const blob = quotation.value.preliminary
      ? await previewMutation.mutateAsync({path})
      : await downloadMutation.mutateAsync({path})
    releaseBlob()
    quotationURL.value = URL.createObjectURL(blob)
    pdfBlobError.value = null
    return true
  } catch (error) {
    pdfBlobError.value = await decodePdfError(error)
    return false
  } finally {
    isLoading.value = false
  }
}

async function show() {
  if (await loadBlob()) viewerModal.value?.show()
  else errorModal.value?.show()
}
defineExpose({show})

// The URL stays alive while the iframe shows it (the browser's PDF viewer
// still reads it to save or print) and is released when replaced or unmounted.
function releaseBlob() {
  if (quotationURL.value) URL.revokeObjectURL(quotationURL.value)
}

function iframeLoaded() {
  isLoading.value = false
}

function showMakeDefinitiveModal() {
  definitiveModal.value?.show()
}

async function generatePdf() {
  isLoading.value = true
  try {
    adopted.value = await generateMutation.mutateAsync({path: {id: quotation.value.id}})
    await queryClient.invalidateQueries({queryKey: Api.QuotationQuotation.retrieve.queryKey({path: {id: quotation.value.id}})})
    if (await loadBlob()) infoToast(create, $trans('Success'), $trans('PDF created'))
    else errorModal.value?.show()
  } catch {
    errorToast(create, $trans('Error creating PDF'))
  } finally {
    isLoading.value = false
  }
}

async function doMakeDefinitive() {
  isLoading.value = true
  try {
    await definitiveMutation.mutateAsync({path: {id: quotation.value.id}})
    await Api.QuotationQuotation.invalidate(queryClient)
    infoToast(create, $trans('Success'), $trans('Quotation is now definitive'))
    await router.push({name: 'quotation-view', params: {pk: quotation.value.id}})
  } catch (error) {
    const data = (error as {response?: {data?: PdfBlobError}})?.response?.data
    errorToast(create, data?.template_error ?? $trans('Error making quotation definitive'))
  } finally {
    isLoading.value = false
  }
}

async function downloadPdf() {
  isLoading.value = true
  try {
    const blob = await downloadMutation.mutateAsync({path: {id: quotation.value.id}})
    downloadBlob(blob, `quotation-${quotation.value.quotation_id ?? quotation.value.id}.pdf`)
  } catch {
    errorToast(create, $trans('Error downloading quotation PDF'))
  } finally {
    isLoading.value = false
  }
}

onBeforeUnmount(releaseBlob)
</script>

<style scoped>
iframe {
  min-height: 720px;
  width: 100%;
  border: 0;
}
</style>
