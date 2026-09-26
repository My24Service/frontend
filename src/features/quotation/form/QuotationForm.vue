<template>
  <b-overlay :show="isLoading" rounded="sm">
    <QuotationPDFViewer
      v-if="record"
      ref="quotation-viewer"
      :quotation="record"
      :is-view="isView"
    />
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
            <router-link :to="{name: record?.preliminary ? 'preliminary-quotations' : 'quotation-list'}">
              {{ $trans('Quotations') }}
            </router-link>
            /
            <strong v-if="!isCreate">{{ record?.quotation_name }}</strong>
            <span class="dimmed" v-if="!isView && !record">
              <span v-if="isCreate">{{ $trans('new') }}</span>
              <span v-else>{{ $trans('edit') }}</span>
            </span>
            <span v-if="record">
              <BLink class="btn btn-sm btn-primary" @click.prevent="showViewer" target="_blank">
                <IBiFileEarmark></IBiFileEarmark>
                {{ $trans('View quotation') }}
              </BLink>
            </span>
            <BButton v-if="record && !record.preliminary" @click="sendQuotation" type="button" variant="primary">
              {{ $trans('Send quotation') }}
            </BButton>
          </h3>
          <div class="flex-columns" v-if="!isView && (isCreate || record?.preliminary)">
            <BButton @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" type="button" variant="primary">
              {{ $trans('Save') }}
            </BButton>
          </div>
        </div>
      </header>

      <b-form v-show="!isLoading">
        <div class="page-detail">
          <div class="flex-columns panel-container">
            <ValidatedForm
              v-if="!openChapter"
              name="quotation"
              v-model="values"
              :errors="errors"
              :labels="FIELD_LABELS"
              :submitted="submitClicked"
            >
              <div class="panel col-1-3">
                <QuotationCustomerFields
                  v-if="!isView"
                  v-model="values"
                  :errors="errors"
                  :submitted="submitClicked"
                />
                <QuotationCustomerView v-else-if="record" :quotation="record" />
              </div>
              <div class="panel col-1-3">
                <QuotationDetailsFields
                  v-if="values.customer_relation"
                  :values="values"
                  :has-record="Boolean(record)"
                  :is-view="isView"
                  class="component-margin"
                />
                <hr/>
                <QuotationDocuments
                  v-if="record"
                  :quotation-id="record.id"
                  :is-view="isView"
                  class="component-margin"
                />
              </div>
              <div class="panel col-1-3">
                <ChapterPanel
                  v-if="record"
                  :quotation="record"
                  :is-view="isView"
                  @chapter-created="(chapter) => { openChapter = chapter }"
                  @chapter-loaded="(chapter) => { openChapter = chapter }"
                />
              </div>
            </ValidatedForm>
            <ChapterWorkspace
              v-else-if="record"
              :quotation="record"
              :chapter="openChapter"
              :is-view="isView"
              @back="openChapter = null"
            />
          </div>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { useResourceForm, ValidatedForm } from '@/features/forms'
import { QuotationCustomerView } from '@/features/quotation/customer'
import { QuotationPDFViewer } from '@/features/quotation/pdf'
import QuotationDocuments from '../QuotationDocuments.vue'
import ChapterWorkspace from './ChapterWorkspace.vue'
import QuotationCustomerFields from './QuotationCustomerFields.vue'
import QuotationDetailsFields from './QuotationDetailsFields.vue'
import { ChapterPanel } from './panels'
import {
  emptyQuotation,
  FIELD_LABELS,
  quotationFromRecord,
  quotationWrite,
  type QuotationFieldErrors,
  type QuotationFormValues,
} from './schemas'

/**
 * A quotation: created with its customer and details, then edited chapter by
 * chapter - each chapter's lines and costs open in the `ChapterWorkspace`.
 * The `quotation-detail` route mounts it read-only (`isView`).
 *
 * A create lands on the new quotation's edit route; an update toasts and
 * opens the PDF viewer, as the legacy form did.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
  isView?: boolean
}>(), {pk: null, isView: false})

const { mainStore, router } = useCommon()
const expireDays = mainStore.getQuotationDefaultExpireDays

const viewer = useTemplateRef<{ show: () => void }>('quotation-viewer')
const openChapter = ref<Api.Chapter | null>(null)

/** What the last write was, for where to go afterwards. */
let written: {isCreate: boolean; id: number} | null = null

const form = useResourceForm<QuotationFormValues, Api.Quotation, unknown, QuotationFieldErrors>({
  resource: Api.QuotationQuotation,
  pk: () => props.pk,
  contract: quotationWrite,
  empty: () => emptyQuotation(expireDays),
  fromRecord: (record) => quotationFromRecord(record, expireDays),
  copy: {
    fetchError: $trans('Error fetching quotation'),
    created: $trans('Created'),
    createdDetail: $trans('Quotation has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Quotation has been updated'),
    createError: $trans('Error creating quotation'),
    updateError: $trans('Error updating quotation'),
  },
  onSaved: (result, context) => {
    written = {isCreate: context.isCreate, id: (result as Api.Quotation).id}
  },
  afterSave: async () => {
    if (written?.isCreate) {
      await router.push({name: 'quotation-edit-preliminary', params: {pk: written.id}})
    } else {
      showViewer()
    }
  },
})
const { isCreate, record, values, errors, submitClicked, isLoading, buttonDisabled, submitForm, cancelForm } = form

function showViewer() {
  viewer.value?.show()
}
function sendQuotation() {
  if (record.value) void router.push({name: 'quotation-send', query: {quotationId: record.value.id}})
}
</script>

<style scoped>
.component-margin {
  margin-bottom: 10px;
}
.panel-container {
  height: 140vh;
}
</style>
