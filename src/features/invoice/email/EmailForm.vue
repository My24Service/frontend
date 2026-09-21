<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{ name: 'invoices-sent' }">
            {{ $trans("Send invoice") }}
          </router-link>
          /
          <strong>{{ invoice?.invoice_id }}</strong>

          <span class="dimmed">
            <span v-if="isCreate && !email.id">{{ $trans("new") }}</span>
            <span v-if="!isCreate">{{ $trans("resend") }}</span>
          </span>
        </h3>
        <div class="flex-columns">
          <BButton @click="cancelForm" type="button" variant="secondary">
            {{ $trans("Cancel") }}</BButton
          >
          <BButton @click="submitForm" :disabled="isLoading || !ready" type="button" variant="primary">
            {{ $trans("Submit") }}</BButton
          >
        </div>
      </div>
    </header>
    <b-overlay :show="isLoading" rounded="sm">
      <div class="page-detail">
        <div class="flex-columns">
          <fieldset class="panel" :disabled="!ready || isLoading">
            <ValidatedForm
              name="email"
              v-model="email"
              :errors="errors"
              :messages="FIELD_MESSAGES"
              :labels="FIELD_LABELS"
              :submitted="isSubmitClicked"
            >
              <h6>{{ $trans("Email") }}</h6>
              <BFormGroup
                :label="$trans('Email recipients')"
                label-for="tags-validation"
                :state="isSubmitClicked ? !recipientInvalid : null"
              >
                <b-form-tags
                  input-id="tags-validation"
                  v-model="recipients"
                  :tag-validator="tagValidator"
                  :state="isSubmitClicked ? !recipientInvalid : null"
                  :placeholder="$trans('Input the email address and press space')"
                  :invalid-tag-text="$trans('Invalid email address')"
                  :duplicate-tag-text="$trans('Duplicate email')"
                  tag-variant="primary"
                  separator=" "
                ></b-form-tags>
                <template #invalid-feedback>
                  {{ $trans('You must provide at least 1 email recipient') }}
                </template>
              </BFormGroup>
              <ValidatedFormField name="subject" label-cols="3" autofocus />
              <ValidatedFormField name="body" textarea rows="3" label-cols="3" />
            </ValidatedForm>
            <h6>{{ $trans("Attachments") }}</h6>
            <p v-if="!documents.length">
              {{ $trans("No attached documents to this invoice") }}
            </p>
            <p v-for="document in documents" :key="document.name">
              {{ document.name }}
              <BButton
                class="btn button btn-danger invoice-pdf-button"
                @click="downloadPdf"
                v-if="document.is_pdf"
                :disabled="loadingPdf"
              >
                <b-spinner small v-if="loadingPdf"></b-spinner>
                {{ $trans('Preview invoice PDF') }}
              </BButton>
            </p>
          </fieldset>
        </div>
      </div>
    </b-overlay>
  </div>
</template>
<script setup lang="ts">
import { parse } from 'valibot'
import {
  invoiceEmailGetUnsentEmailRetrieveOptions, invoiceEmailGetDocumentsListOptions,
  invoiceInvoiceRetrieveOptions, orderOrderRetrieveOptions, customerCustomerRetrieveOptions,
  invoiceEmailCreateMutation, invoiceEmailPartialUpdateMutation, invoiceInvoiceDownloadPdfCreateMutation,
  invoiceEmailGetUnsentEmailRetrieveQueryKey, invoiceInvoiceDetailRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import { invoiceInvoice } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms'
import { useQueryErrorToast } from '@/features/forms'
import { ValidatedForm } from '@/features/forms'
import { ValidatedFormField } from '@/features/forms'
import { downloadBlob } from '@/features/shared'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import { emailFormSchema, FIELD_LABELS, FIELD_MESSAGES, validateEmail, tagValidator } from './schemas'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const { create } = useToast()
const invoiceId = computed(() => Number(route.query.invoiceId))
const validId = computed(() => Number.isSafeInteger(invoiceId.value) && invoiceId.value > 0)
const draftQuery = useQuery(() => ({ ...invoiceEmailGetUnsentEmailRetrieveOptions({query: {invoiceId: invoiceId.value}}), enabled: validId.value }))
const docsQuery = useQuery(() => ({ ...invoiceEmailGetDocumentsListOptions({query: {invoiceId: invoiceId.value}}), enabled: validId.value }))
const invoiceQuery = useQuery(() => ({ ...invoiceInvoiceRetrieveOptions({path: {id: invoiceId.value}}), enabled: validId.value }))
const invoice = invoiceQuery.data
const orderQuery = useQuery(() => ({ ...orderOrderRetrieveOptions({path: {id: String(invoice.value?.order)}}), enabled: !!invoice.value?.order }))
const customerId = computed(() => orderQuery.data.value?.customer_relation)
const customerQuery = useQuery(() => ({ ...customerCustomerRetrieveOptions({path: {id: Number(customerId.value)}}), enabled: !!customerId.value }))
useQueryErrorToast(draftQuery.error, $trans('Error fetching unsent email'))
useQueryErrorToast(docsQuery.error, $trans('Error fetching documents'))
useQueryErrorToast(invoiceQuery.error, $trans('Error fetching invoice'))
useQueryErrorToast(orderQuery.error, $trans('Error fetching invoice'))
useQueryErrorToast(customerQuery.error, $trans('Error fetching invoice'))
const ready = computed(() => validId.value && draftQuery.isSuccess.value && invoiceQuery.isSuccess.value && orderQuery.isSuccess.value && (!customerId.value || customerQuery.isSuccess.value))
const documents = computed(() => docsQuery.data.value ?? [])
const email = ref<{id?: number; subject: string; body: string}>({subject: '', body: ''})
const recipients = ref<string[]>([])
const isSubmitClicked = ref(false)
const errors = ref<ReturnType<typeof validateEmail>>({})
const recipientInvalid = computed(() => !!errors.value.recipients)
const isCreate = computed(() => !email.value.id)
let hydrated = false
watch(invoiceId, () => {
  hydrated = false
  email.value = {subject: '', body: ''}
  recipients.value = []
  errors.value = {}
  isSubmitClicked.value = false
}, {flush: 'sync'})
watch([invoiceId, ready], ([, value]) => {
  if (!value || hydrated) return
  const draft = draftQuery.data.value
  email.value = {id: draft?.id, subject: draft?.subject ?? '', body: draft?.body ?? ''}
  recipients.value = [...new Set([...(draft?.recipients ?? '').split(','), ...(invoice.value?.invoice_email ?? '').split(','), ...(customerQuery.data.value?.email ?? '').split(',')].map(item => item.trim()).filter(tagValidator))]
  hydrated = true
}, {immediate: true})
const createMutation = useMutation(invoiceEmailCreateMutation())
const updateMutation = useMutation(invoiceEmailPartialUpdateMutation())
const pdfMutation = useMutation(invoiceInvoiceDownloadPdfCreateMutation())
const loadingPdf = pdfMutation.isPending
const isLoading = computed(() => draftQuery.isFetching.value || invoiceQuery.isFetching.value || orderQuery.isFetching.value || customerQuery.isFetching.value || createMutation.isPending.value || updateMutation.isPending.value)
function cancelForm() { router.go(-1) }
async function submitForm() {
  if (!ready.value || isLoading.value) return
  isSubmitClicked.value = true
  const values = {invoice: invoiceId.value, recipients: recipients.value.join(','), subject: email.value.subject, body: email.value.body}
  errors.value = validateEmail(values)
  if (Object.keys(errors.value).length) return
  const id = invoiceId.value
  try {
    const body = parse(emailFormSchema, values)
    const result = email.value.id
      ? await updateMutation.mutateAsync({path: {id: email.value.id}, body})
      : await createMutation.mutateAsync({body})
    await invalidateReads(invoiceInvoice)(queryClient)
    await queryClient.invalidateQueries({queryKey: invoiceEmailGetUnsentEmailRetrieveQueryKey({query: {invoiceId: id}})})
    if (invoice.value?.uuid) await queryClient.invalidateQueries({queryKey: invoiceInvoiceDetailRetrieveQueryKey({path: {id: invoice.value.uuid}})})
    if (id !== invoiceId.value) return
    email.value.id = result.id
    if (!result.is_sent) { errorToast(create, $trans('Error sending invoice')); return }
    infoToast(create, $trans('Sent'), $trans('Invoice has been sent'))
    await router.push({name: 'invoices-sent'})
  } catch { errorToast(create, $trans('Error sending invoice')) }
}
async function downloadPdf() {
  if (!validId.value || loadingPdf.value) return
  try {
    const blob = await pdfMutation.mutateAsync({path: {id: invoiceId.value}})
    downloadBlob(blob, 'invoice.pdf')
  } catch { errorToast(create, $trans('Error downloading invoice PDF')) }
}
</script>
<style scoped>
.invoice-pdf-button { margin-left: 20px; }
</style>
