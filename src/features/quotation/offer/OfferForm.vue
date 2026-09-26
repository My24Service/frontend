<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
          <router-link :to="{ name: 'quotations-sent' }">
            {{ $trans("Send quotation") }}
          </router-link>
          /
          <strong>{{ quotation?.quotation_id }} {{ quotation?.quotation_name }}</strong>
          <span class="dimmed">
            <span v-if="isCreate">{{ $trans("new") }}</span>
            <span v-else>{{ $trans("resend") }}</span>
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
            <p class="text-center">
              <strong><i>{{ $trans("Quotations can't be changed after having been sent") }}</i></strong>
            </p>
            <ValidatedForm
              name="offer"
              v-model="offer"
              :errors="errors"
              :messages="SEND_FIELD_MESSAGES"
              :labels="SEND_FIELD_LABELS"
              :submitted="isSubmitClicked"
            >
              <h6>{{ $trans("Email") }}</h6>
              <EmailRecipientsField v-model="recipients" :invalid="!!errors.recipients" :submitted="isSubmitClicked" />
              <ValidatedFormField name="subject" label-cols="3" autofocus />
              <ValidatedFormField name="body" textarea rows="3" label-cols="3" />
            </ValidatedForm>
            <h6>{{ $trans("Attachments") }}</h6>
            <p v-if="!documents.length">
              {{ $trans("No attached documents to this quotation") }}
            </p>
            <p v-for="document in documents" :key="document.name">
              {{ document.name }}
              <BButton
                class="btn button btn-danger quotation-pdf-button"
                @click="downloadPdf"
                v-if="document.is_pdf"
                :disabled="loadingPdf"
              >
                <b-spinner small v-if="loadingPdf"></b-spinner>
                {{ $trans('Preview quotation PDF') }}
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
import { quotationOfferGetUnsentOfferRetrieveOptions } from '@/api/@tanstack/vue-query.gen'

import {
  EmailRecipientsField,
  SEND_FIELD_LABELS,
  SEND_FIELD_MESSAGES,
  useQueryErrorToast,
  ValidatedForm,
  ValidatedFormField,
} from '@/features/forms'
import { downloadBlob } from '@/features/shared'
import { offerSendSchema, validateOffer } from './schemas'

/**
 * Sending a quotation: the unsent offer (or a new one) addressed to the
 * quotation's e-mail, with the files it goes out with. One read,
 * `get_unsent_offer`, answers the offer, the quotation and the attachments.
 * A send is one POST (new) or PATCH (stored); the server answers `is_sent`
 * only when the mail actually went.
 */
const { route, router, toast: create, queryClient } = useCommon()
const quotationId = computed(() => Number(route.query.quotationId))
const validId = computed(() => Number.isSafeInteger(quotationId.value) && quotationId.value > 0)

const unsentQuery = useQuery(() => ({
  ...quotationOfferGetUnsentOfferRetrieveOptions({query: {quotationId: quotationId.value}}),
  enabled: validId.value,
}))
useQueryErrorToast(unsentQuery.error, $trans('Error fetching unsent offer'))
const ready = computed(() => validId.value && unsentQuery.isSuccess.value)
const quotation = computed(() => unsentQuery.data.value?.quotation)
const documents = computed(() => unsentQuery.data.value?.documents ?? [])

const offer = ref<{id?: number; subject: string; body: string}>({subject: '', body: ''})
const recipients = ref<string[]>([])
const isSubmitClicked = ref(false)
const errors = ref<ReturnType<typeof validateOffer>>({})
const isCreate = computed(() => !offer.value.id)

// Seeded once per quotation from the answer; later refetches must not
// overwrite what the user typed.
let hydratedFor: number | null = null
watch(ready, (isReady) => {
  const answer = unsentQuery.data.value
  if (!isReady || !answer || hydratedFor === quotationId.value) return
  offer.value = {id: answer.offer?.id, subject: answer.offer?.subject ?? '', body: answer.offer?.body ?? ''}
  // A stored list, plus the quotation's own address when it is not already on
  // it; blanks dropped, so a new offer does not start with an empty tag.
  const stored = (answer.offer?.recipients ?? '').split(',').map((item) => item.trim()).filter(Boolean)
  const own = answer.quotation.quotation_email
  recipients.value = own && !stored.includes(own) ? [...stored, own] : stored
  hydratedFor = quotationId.value
}, {immediate: true})

const createMutation = useMutation(Api.QuotationOffer.create.mutation())
const updateMutation = useMutation(Api.QuotationOffer.update.mutation())
const pdfMutation = useMutation(Api.QuotationQuotation.extras.downloadDefinitivePdfCreate.mutation())
const loadingPdf = pdfMutation.isPending
const isLoading = computed(() => unsentQuery.isFetching.value || createMutation.isPending.value || updateMutation.isPending.value)

function cancelForm() {
  router.go(-1)
}

async function submitForm() {
  if (!ready.value || isLoading.value) return
  isSubmitClicked.value = true
  const values = {
    quotation: quotationId.value,
    recipients: recipients.value.join(','),
    subject: offer.value.subject,
    body: offer.value.body,
  }
  errors.value = validateOffer(values)
  if (Object.keys(errors.value).length) return
  try {
    const body = parse(offerSendSchema, values)
    const result = offer.value.id
      ? await updateMutation.mutateAsync({path: {id: offer.value.id}, body})
      : await createMutation.mutateAsync({body})
    offer.value.id = result.id
    await Promise.all([Api.QuotationOffer.invalidate(queryClient), Api.QuotationQuotation.invalidate(queryClient)])
    if (!result.is_sent) {
      errorToast(create, $trans('Error sending quotation'))
      return
    }
    infoToast(create, $trans('Sent'), $trans('Quotation has been sent'))
    await router.push({name: 'quotations-sent'})
  } catch {
    errorToast(create, $trans('Error sending quotation'))
  }
}

async function downloadPdf() {
  if (!validId.value || loadingPdf.value) return
  try {
    const blob = await pdfMutation.mutateAsync({path: {id: quotationId.value}})
    downloadBlob(blob, `quotation-${quotation.value?.quotation_id ?? quotationId.value}.pdf`)
  } catch {
    errorToast(create, $trans('Error downloading quotation PDF'))
  }
}
</script>

<style scoped>
.quotation-pdf-button {
  margin-left: 20px;
}
</style>
