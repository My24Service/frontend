<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
  >
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiFileArrowDown />
            <span v-if="isCreate">{{ $trans('New import') }}</span>
            <span v-else>{{ $trans('Edit import') }}</span>
          </h3>
        </div>
      </header>

      <div class="app-detail panel overflow-auto">
        <b-form>
          <b-row>
            <b-col
              cols="4"
              role="group"
            >
              <BFormGroup
                label-size="sm"
                :label="$trans('Name')"
                label-for="import_name"
              >
                <BFormInput
                  id="import_name"
                  v-model="values.name"
                  size="sm"
                  :state="submitClicked ? !errors.name : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
                  {{ errors.name }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>

            <b-col
              cols="8"
              role="group"
            >
              <BFormGroup
                label-size="sm"
                :label="$trans('File')"
                label-for="company-import-file"
                :description="`${$trans('Accepted file formats')}: ${allowedExtensions.join(', ')}`"
              >
              <BFormFile
                id="company-import-file"
                v-model="pickedFile"
                :placeholder="$trans('Choose a file or drop it here...')"
                :state="submitClicked ? !errors.file : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.file : null">
                {{ errors.file }}
              </b-form-invalid-feedback>
              {{ currentFileName }}
              </BFormGroup>
            </b-col>
          </b-row>
          <div class="mx-auto">
            <footer class="modal-footer">
              <BButton
                type="button"
                variant="secondary"
                @click="form.cancelForm"
              >
                {{ $trans('Cancel') }}
              </BButton>
              <BButton
                type="button"
                variant="primary"
                :disabled="buttonDisabled"
                @click="form.submitForm"
              >
                {{ $trans('Submit') }}
              </BButton>
              <BFormCheckbox
                v-if="!hasResults"
                v-model="continueToPreview"
              >
                {{ $trans('continue to preview') }}
              </BFormCheckbox>
            </footer>
          </div>
        </b-form>
      </div>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { companyImportGetAllowedExtensionsRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { companyImport } from '@/api/resources.gen'
import type { Import } from '@/api/types.gen'
import {
  useQueryErrorToast,
  useResourceForm,
} from '@/features/forms'
import { readAsDataUrl } from '@/features/shared'
import {
  emptyImport,
  importFromRecord,
  importWrite,
  type ImportFormErrors,
  type ImportFormValues,
} from './schemas'

/**
 * The import create/edit form, on both mounts - the mount answers one route
 * stem, which the routers supply for the ride after the save.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * guards and the validation - is `useResourceForm`'s, with the exit
 * overridden: a save lands on the preview screen, or back on the list when
 * the box is unchecked. The file picker stages through `v-model` with a
 * watcher - the documents panel's pattern - and a pick whose extension the
 * endpoint does not list is silently ignored, as the legacy screen did.
 */
const props = defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
  /** The route name stem this mount answers to. Supplied by the routers. */
  route_prefix: string
}>()

const router = useRouter()

/** The route decides the write once, at setup: no pk, a create. */
const isCreateRoute = props.pk == null

const form = useResourceForm<ImportFormValues, Import, unknown, ImportFormErrors>({
  pk: () => props.pk ?? null,
  resource: companyImport,
  empty: emptyImport,
  fromRecord: importFromRecord,
  validate: importWrite.validate,
  parse: importWrite.parse,
  // The write's id rides out through `onSaved`: a create only knows it
  // afterwards, and the ride after the save needs it for the preview.
  onSaved: async (result, context) => {
    if (context.isCreate) savedId.value = (result as { id: number }).id
  },
  afterSave: async () => {
    const id = isCreateRoute ? savedId.value : Number(props.pk)
    if (continueToPreview.value && id != null) {
      await router.push(toRoute(`${props.route_prefix}-preview` as RouteName, { pk: id }))
    } else {
      await router.push(toRoute(`${props.route_prefix}-list` as RouteName))
    }
  },
  copy: {
    fetchError: $trans('Error loading import'),
    created: $trans('Created'),
    createdDetail: $trans('Import has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Import has been updated'),
    createError: $trans('Error creating import'),
    updateError: $trans('Error updating import'),
  },
})

const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record } = form

const continueToPreview = ref(true)
/** The write the save answered with - a create only knows its id afterwards. */
const savedId = ref<number | null>(null)

const hasResults = computed(() => Object.keys(record.value?.result_inserts ?? {}).length > 0)

const allowedExtensionsQuery = useQuery(companyImportGetAllowedExtensionsRetrieveOptions())
useQueryErrorToast(allowedExtensionsQuery.error, $trans('Error loading import'))
const allowedExtensions = computed<string[]>(() => allowedExtensionsQuery.data.value ?? [])

const pickedFile = ref<File | File[] | null>(null)
const currentFileName = ref<string | null>(null)

function extensionOf(filename: string): string {
  const parts = filename.split('.')
  return parts[parts.length - 1].toLowerCase()
}

watch(pickedFile, async (picked) => {
  const file = Array.isArray(picked) ? picked[0] : picked
  if (!file) return
  if (!allowedExtensions.value.includes(extensionOf(file.name))) return
  currentFileName.value = file.name
  values.value.file = await readAsDataUrl(file)
})
</script>
