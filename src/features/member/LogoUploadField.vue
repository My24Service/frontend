<template>
  <b-row>
    <b-col cols="4">
      <BFormGroup
        label-size="sm"
        :label="label"
        :label-for="fieldId"
        :description="acceptedFormatsDescription"
      >
        <b-form-file
          :id="fieldId"
          accept="image/*"
          :placeholder="$trans('Choose a file or drop it here...')"
          @change="onSelected"
        ></b-form-file>
        <b-form-invalid-feedback
          v-if="required"
          :id="`${fieldId}-feedback`"
          :state="invalid ? false : null">
          {{ MEMBER_LOGO_REQUIRED_MESSAGE() }}
        </b-form-invalid-feedback>
      </BFormGroup>
    </b-col>
    <b-col cols="4">
      <h3>{{ $trans('Current image') }}</h3>
      <img width="200px" :src="currentImage" alt=""/>
    </b-col>
    <b-col cols="4">
      <h3>{{ $trans('Upload preview') }}</h3>
      <img width="200px" :src="preview" alt=""/>
    </b-col>
  </b-row>
</template>

<script lang="ts">
/** The extensions the company logo accepts, as the legacy screen had them. */
export const LOGO_UPLOAD_EXTENSIONS = ['png', 'jpg', 'jpeg']
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { MEMBER_LOGO_REQUIRED_MESSAGE } from './member/schemas'
import { NO_IMAGE_URL } from '@/constants'
import { $trans } from '@/utils'

/**
 * One logo row of the Member form: the file input, the stored image and a
 * preview of the chosen one.
 *
 * Logos are strings, not multipart: the request schema declares them
 * `nullish(string)` and the backend stores base64 data URLs, which is what
 * FileReader hands over — so this component's whole output is the data URL
 * of the chosen file, emitted as `selected`. The parent decides which body
 * slot it fills.
 *
 * The extension guard and the accepted-formats description belong together
 * and to the required company logo only, as the legacy screen had it; pass
 * `allowedExtensions` to turn both on. The required feedback renders only
 * when `required` is set, and paints red only while `invalid`.
 */

const props = defineProps<{
  /** The input's id — also the label's anchor, so keep it the field's name. */
  fieldId: string
  label: string
  /** The stored logo as a display URL; never part of this component's output. */
  currentImage: string
  allowedExtensions?: string[]
  required?: boolean
  invalid?: boolean
}>()

const emit = defineEmits<{selected: [dataUrl: string]}>()

const preview = ref(NO_IMAGE_URL)

const acceptedFormatsDescription = computed(() =>
  props.allowedExtensions
    ? `${$trans('Accepted file formats')}: ${props.allowedExtensions.join(', ')}`
    : undefined)

function extensionOf(filename: string): string {
  const parts = filename.split('.')
  return parts[parts.length - 1].toLowerCase()
}

/** The chosen file, wherever b-form-file put it.
 *
 * The component re-emits `change` with a synthesized event that carries the
 * `FileList` on the event itself (its `target` is null by then); a plain
 * native event keeps them under `target`. Both are read here, which is also
 * what the legacy screen's `event.files[0]` leaned on.
 */
function chosenFile(event: Event | {files?: FileList, detail?: {files?: FileList}} | null | undefined): File | undefined {
  const shaped = event as {files?: FileList, detail?: {files?: FileList}, target?: EventTarget | null}
  const source = shaped?.files ?? shaped?.detail?.files ?? (shaped?.target as HTMLInputElement | null)?.files
  return source?.[0]
}

function onSelected(event: Event) {
  const file = chosenFile(event)
  if (!file) return

  if (props.allowedExtensions && !props.allowedExtensions.includes(extensionOf(file.name))) return

  const reader = new FileReader()
  reader.onload = (f) => {
    const dataUrl = (f.target as FileReader).result as string
    preview.value = dataUrl
    emit('selected', dataUrl)
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
</style>
