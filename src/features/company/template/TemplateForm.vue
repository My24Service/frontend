<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkCheckFill />
          <router-link :to="{name: 'company-templates'}">{{ $trans('Templates') }}</router-link>
          /
          <strong>{{ values.name }}</strong>
          <span class="dimmed">
            <span v-if="isCreate && !record">{{ $trans('new') }}</span>
            <span v-if="!isCreate && isEdit">{{ $trans('edit') }}</span>
          </span>
        </h3>
        <div
          v-if="isCreate || isEdit"
          class="flex-columns"
        >
          <BButton
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            {{ $trans('Cancel') }}
          </BButton>
            <BButton
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="form.submitForm"
            >
            <b-spinner
              v-if="isLoading"
              small
            />
            {{ $trans('Submit') }}
          </BButton>
        </div>
        <div
          v-if="!isCreate && !isEdit"
          class="flex-columns"
        >
          <BButton
            type="button"
            variant="primary"
            @click="isEdit = true"
          >
            {{ $trans('Edit template') }}
          </BButton>
        </div>
      </div>
    </header>
    <b-overlay
      rounded="sm"
      :show="isLoading"
    >
      <div class="page-detail">
        <div class="flex-columns">
          <div
            v-if="isCreate || isEdit"
            class="panel"
          >
            <h6>{{ $trans('Template') }}</h6>
            <BFormGroup
              :label="$trans('Name')"
              label-for="template_name"
              label-cols="3"
            >
              <BFormInput
                id="template_name"
                v-model="values.name"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.name : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
                {{ errors.name }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup
              label-cols="3"
              :label="$trans('Description')"
              label-for="template_description"
            >
              <BFormTextarea
                id="template_description"
                v-model="values.description"
                rows="3"
              />
            </BFormGroup>
            <BFormGroup
              v-if="isCreate"
              label-cols="3"
              :label="$trans('Type')"
              label-for="template_type"
            >
              <BFormSelect
                id="template_type"
                v-model="values.template_type"
                :options="templateTypes"
                size="sm"
                :state="submitClicked ? !errors.template_type : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.template_type : null">
                {{ errors.template_type }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup
              :label="$trans('Choose template')"
              label-cols="3"
            >
              <BFormFile
                id="template-file"
                :placeholder="$trans('Choose a word document or drop it here...')"
                accept=".docx"
                @change="stageFile"
              />
              <p v-if="record?.url">
                {{ $trans('Download') }}:
                <a
                  :href="record.url"
                  target="_blank"
                >{{ fileNameOf(record.url) }}</a>
              </p>
              <b-form-invalid-feedback :state="submitClicked ? !errors.file : null">
                {{ errors.file }}
              </b-form-invalid-feedback>
            </BFormGroup>
            <BFormGroup
              label-cols="3"
              :label="$trans('Set template as active')"
              class="template_active"
              label-for="template_active"
            >
              <BFormCheckbox
                id="template_active"
                v-model="values.is_active"
              />
            </BFormGroup>
            <div>
              <h4>{{ $trans('Template fields documentation') }}</h4>
              <ul>
                <li><a
                  href="https://my24service.github.io/docs/#invoice-template-fields"
                  target="_blank"
                >
                  {{ $trans('Invoices') }}
                </a></li>
                <li><a
                  href="https://my24service.github.io/docs/#quotation-template-fields"
                  target="_blank"
                >
                  {{ $trans('Quotations') }}
                </a></li>
              </ul>
            </div>
          </div>
          <div
            v-if="!isCreate && !isEdit && record"
            class="panel"
          >
            <h6>{{ $trans('Template') }}</h6>
            <b-row>
              <b-col cols="3">
                {{ $trans('Name') }}:
              </b-col>
              <b-col cols="6">
                {{ record.name }}
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="3">
                {{ $trans('Description') }}:
              </b-col>
              <b-col cols="6">
                {{ record.description }}
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="3">
                {{ $trans('Type') }}:
              </b-col>
              <b-col cols="6">
                {{ record.template_type }}
              </b-col>
            </b-row>
          </div>
          <div
            v-if="!isCreate && !isEdit && record"
            class="panel"
          >
            <h6>{{ $trans('Template preview') }}</h6>
            <BFormGroup
              label-cols="3"
              :label="$trans('Template')"
              label-for="template-search"
            >
              <VueMultiselect
                id="template-search"
                track-by="uuid"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="previewOptions"
                :loading="isSearchingPreview"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                :custom-label="previewLabel"
                @search-change="previewTerm = $event"
                @select="previewResult = $event"
              />
            </BFormGroup>
            <b-row>
              <b-col
                v-if="previewResult"
                cols="3"
              >
                {{ previewResult.label }}
              </b-col>
              <b-col
                v-if="previewResult"
                cols="3"
              >
                <BButton
                  type="button"
                  variant="primary"
                  :disabled="loadingPdf"
                  @click="previewPdf"
                >
                  <b-spinner
                    v-if="loadingPdf"
                    small
                  />
                  {{ $trans('Preview pdf') }}
                </BButton>
              </b-col>
            </b-row>
          </div>
        </div>
      </div>
    </b-overlay>
  </div>
</template>

<script setup lang="ts">
import VueMultiselect from 'vue-multiselect'

import {
  useQueryErrorToast,
  useResourceForm,
} from '@/features/forms'
import { chosenFile, fileNameOf, readAsDataUrl } from '@/features/shared'
import {
  emptyTemplate,
  templateFromRecord,
  templateWrite,
} from './schemas'

/**
 * The template create/view/edit screen. One route shows the record with its
 * preview panel; the button above it turns the same screen into the form.
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s; an edit save
 * stays on the screen, where the legacy screen reloaded it.
 *
 * The file picker stages through the shared file helpers: the input emits
 * `change`, never `input`, so the legacy `@input` handler never ran and no
 * file was ever staged - creating a template failed validation outright, and
 * an edit silently kept the stored file. The preview panel searches the
 * invoices or quotations of the record's own type and opens the rendered PDF
 * in a new tab.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const { create: toast } = useToast()
const router = useRouter()

/** The view/edit switch on the `:pk` route. A create is always a form. */
const isEdit = ref(false)

/** The route decides the write once, at setup: no pk, a create. */
const isCreateRoute = props.pk == null

const templateTypes = [
  { value: 'invoice', text: $trans('Invoice') },
  { value: 'quotation', text: $trans('Quotation') },
]

const form = useResourceForm({
  pk: () => props.pk,
  resource: Api.CompanyTemplate,
  empty: emptyTemplate,
  fromRecord: templateFromRecord,
  validate: templateWrite.validate,
  parse: templateWrite.parse,
  // A create save goes back; an edit save stays on the screen, where the
  // invalidation refetches the record behind the values - the legacy screen
  // reloaded it the same way.
  afterSave: async () => {
    if (isCreateRoute) router.go(-1)
    else isEdit.value = false
  },
  copy: {
    fetchError: $trans('Error loading template'),
    created: $trans('Created'),
    createdDetail: $trans('Template has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Template has been updated'),
    createError: $trans('Error creating template'),
    updateError: $trans('Error updating template'),
  },
})

const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record } = form

const loadingPdf = ref(false)
// The preview blob, held so its object URL has an owner. `useObjectUrl` revokes
// the previous URL when a new preview replaces it and revokes the last one when
// the component goes: the bare `URL.createObjectURL` at the open site below
// revoked nothing, so every preview leaked a blob URL for the life of the page.
const previewBlob = ref<Blob | null>(null)
const previewUrl = useObjectUrl(previewBlob)
const previewResult = ref<{ uuid: string, label: string } | null>(null)
const previewTerm = ref('')
const previewDebounced = refDebounced(previewTerm, 500)

/**
 * Stage the picked file as a data URL for the body. The record's own file
 * never enters the values: a create requires a pick, and an edit sends the
 * staged file only when one was picked.
 */
async function stageFile(event: Event) {
  const file = chosenFile(event)
  if (!file) return
  values.value.file = await readAsDataUrl(file)
}

function cancelForm() {
  if (form.isCreate.value) form.cancelForm()
  else {
    isEdit.value = false
    if (record.value) values.value = templateFromRecord(record.value)
  }
}

// The preview -------------------------------------------------------------

const previewType = computed(() => record.value?.template_type)

const invoicePreviewQuery = useQuery(() => ({
  ...Api.InvoiceInvoiceAutocomplete.list.options({ query: { q: previewDebounced.value } }),
  enabled: previewType.value === 'invoice' && previewDebounced.value.length > 0,
}))
const quotationPreviewQuery = useQuery(() => ({
  ...Api.QuotationQuotationAutocomplete.list.options({ query: { q: previewDebounced.value } }),
  enabled: previewType.value === 'quotation' && previewDebounced.value.length > 0,
}))
useQueryErrorToast(invoicePreviewQuery.error, $trans('Error fetching results'))
useQueryErrorToast(quotationPreviewQuery.error, $trans('Error fetching results'))

const previewOptions = computed<{ uuid: string, label: string }[]>(() => {
  if (previewType.value === 'invoice') {
    return ((invoicePreviewQuery.data.value ?? []))
      .map((row) => ({ uuid: row.uuid, label: row.name }))
  }
  return ((quotationPreviewQuery.data.value ?? []))
    .map((row) => ({ uuid: row.uuid, label: row.name }))
})
const isSearchingPreview = computed(() =>
  invoicePreviewQuery.isFetching.value || quotationPreviewQuery.isFetching.value)

function previewLabel(option: { label: string }): string {
  return option.label
}

const previewMutation = useMutation(Api.CompanyTemplatePreviewTemplatePdf.create.mutation())

async function previewPdf() {
  if (previewResult.value == null || props.pk == null || loadingPdf.value) return
  loadingPdf.value = true
  try {
    const blob = await previewMutation.mutateAsync({
      body: { id: Number(props.pk), uuid: previewResult.value.uuid, template_type: record.value?.template_type ?? '' },
    })
    previewBlob.value = blob
    // `useObjectUrl` derives the URL in a watcher, so it is only current once
    // the scheduler has run. Revoking the previous URL cannot break the popup
    // it was handed to: that tab has the PDF already.
    await nextTick()
    if (previewUrl.value) window.open(previewUrl.value, '_blank')
  } catch {
    errorToast(toast, $trans('Error downloading template'))
  } finally {
    loadingPdf.value = false
  }
}
</script>

<style>
.pdf-priview {
  margin-top: 20px;
}
.pdf-priview .panel {
  max-width: 70%;
}
.template_active .col-form-label {
  padding: 0 10px;
}
</style>
