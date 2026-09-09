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
export const LOGO_UPLOAD_EXTENSIONS = ['png', 'jpg', 'jpeg']
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { MEMBER_LOGO_REQUIRED_MESSAGE } from './member/schemas'
import { NO_IMAGE_URL } from '@/constants'
import { $trans } from '@/utils'
import { chosenFile, readAsDataUrl } from '@/features/shared/file-helpers'

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

function onSelected(event: Event) {
  const file = chosenFile(event)
  if (!file) return

  if (props.allowedExtensions && !props.allowedExtensions.includes(extensionOf(file.name))) return

  readAsDataUrl(file).then((dataUrl) => {
    preview.value = dataUrl
    emit('selected', dataUrl)
  })
}
</script>

<style scoped>
</style>
