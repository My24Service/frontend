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
        <ImageUploadField
          field-id="picture-image"
          :label="$trans('Image')"
          :current-image="currentImage"
          @selected="(dataUrl) => { values.picture = dataUrl }"
        />

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
import { CompanyPicture } from '@/api/resources.gen'
import { NO_IMAGE_URL } from '@/constants'
import {
  ImageUploadField,
  useResourceForm,
} from '@/features/forms'
import {
  emptyPicture,
  pictureFromRecord,
  pictureWrite,
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

const form = useResourceForm({
  pk: () => props.pk,
  resource: CompanyPicture,
  empty: emptyPicture,
  fromRecord: pictureFromRecord,
  validate: pictureWrite.validate,
  parse: pictureWrite.parse,
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

const currentImage = computed(() => record.value?.picture ?? NO_IMAGE_URL)
</script>
