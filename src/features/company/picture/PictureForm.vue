<template>
  <b-overlay
    :show="isLoading"
    rounded="sm"
  >
    <div class="app-page">
      <header>
        <div class="page-title">
          <h2 v-if="isCreate">{{ $trans('New picture') }}</h2>
          <h2 v-if="!isCreate">{{ $trans('Edit picture') }}</h2>
        </div>
      </header>
      <b-form class="page-detail panel">
        <b-row>
          <b-col
            cols="12"
            role="group"
          >
            <BFormGroup
              label-size="sm"
              :label="$trans('Name')"
              label-for="picture_name"
            >
              <BFormInput
                id="picture_name"
                v-model="values.name"
                size="sm"
                :state="submitClicked ? !errors.name : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
                {{ errors.name }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            <BFormGroup
              label-size="sm"
              :label="$trans('Image')"
              label-for="picture-image"
            >
              <BFormFile
                id="picture-image"
                accept="image/*"
                :placeholder="$trans('Choose a file or drop it here...')"
                @change="imageSelected"
              />
            </BFormGroup>
          </b-col>
          <b-col cols="4">
            <h3>{{ $trans('Current image') }}</h3>
            <img
              width="200px"
              :src="currentImage"
              alt=""
            >
          </b-col>
          <b-col cols="4">
            <h3>{{ $trans('Upload preview') }}</h3>
            <img
              width="200px"
              :src="uploadPreview"
              alt=""
            >
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton
              class="btn btn-secondary"
              type="button"
              variant="secondary"
              @click="form.cancelForm"
            >
              {{ $trans('Cancel') }}
            </BButton>
            <BButton
              class="btn btn-primary"
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="form.submitForm"
            >
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { BButton, BForm, BFormFile, BFormGroup, BFormInput } from 'bootstrap-vue-next'
import {
  companyPictureCreateMutation,
  companyPicturePartialUpdateMutation,
  companyPictureRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Picture } from '@/api/types.gen'
import { NO_IMAGE_URL } from '@/constants'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { chosenFile, readAsDataUrl } from '@/features/shared/file-helpers'
import { $trans } from '@/services/i18n'
import { invalidatePictureList } from '../invalidation'
import {
  emptyPicture,
  parsePicture,
  pictureFromRecord,
  validatePicture,
  type PictureFieldErrors,
  type PictureFormValues,
} from './schemas'

/**
 * The picture create/edit form.
 *
 * The skeleton - the pk split, the detail read, the create/update pair, the
 * toasts, the guards and the exit - is `useResourceForm`'s. What this screen
 * has of its own is the file picker: the chosen file is staged as a data URL
 * in the values and rides the body only then, while the record's own picture
 * (a URL the write endpoint rejects) stays out of the values and only shows
 * as the current image.
 */
const props = withDefaults(defineProps<{
  /** The route's `:pk`, passed through by the layout. A create has none. */
  pk?: string | number | null
}>(), {
  pk: null,
})

const form = useResourceForm<PictureFormValues, Picture, unknown, PictureFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => companyPictureRetrieveOptions({ path: { id } }),
  create: companyPictureCreateMutation(),
  update: companyPicturePartialUpdateMutation(),
  invalidate: invalidatePictureList,
  empty: emptyPicture,
  fromRecord: pictureFromRecord,
  validate: validatePicture,
  parse: parsePicture,
  copy: {
    fetchError: $trans('Error fetching picture'),
    created: $trans('Created'),
    createdDetail: $trans('Picture has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Picture has been updated'),
    createError: $trans('Error creating picture'),
    updateError: $trans('Error updating picture'),
  },
})

const { values, errors, submitClicked, isCreate, isLoading, buttonDisabled, record } = form

const uploadPreview = ref(NO_IMAGE_URL)
const currentImage = computed(() => record.value?.picture ?? NO_IMAGE_URL)

/**
 * Stage the picked file as a data URL for the preview and the body.
 *
 * The shared file helpers - the member logo field's pattern - rather than an
 * event shape of this screen's own: the file input emits `change` (and
 * `update:modelValue`), never `input`, so the legacy `@input` handler never
 * ran and picking a file did nothing. See `schemas.ts`.
 */
function imageSelected(event: Event) {
  const file = chosenFile(event)
  if (!file) return

  readAsDataUrl(file).then((dataUrl) => {
    uploadPreview.value = dataUrl
    values.value.picture = dataUrl
  })
}
</script>
