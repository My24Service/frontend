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
          {{ requiredMessage }}
        </b-form-invalid-feedback>
      </BFormGroup>
    </b-col>
    <b-col cols="4">
      <h3>{{ $trans('Current image') }}</h3>
      <img width="200px" :src="currentImage" alt=""/>
    </b-col>
    <b-col cols="4">
      <h3>{{ $trans('Upload preview') }}</h3>
      <img width="200px" :src="preview ?? NO_IMAGE_URL" alt=""/>
    </b-col>
  </b-row>
</template>

<script lang="ts" setup>
import { NO_IMAGE_URL } from '@/constants'
import { chosenFile, extensionOf } from '@/features/shared'
import { useStagedImage } from './use-staged-image'

const props = defineProps<{
  /** The input's id — also the label's anchor, so keep it the field's name. */
  fieldId: string
  label: string
  /** The stored image as a display URL; never part of this component's output. */
  currentImage: string
  allowedExtensions?: string[]
  required?: boolean
  invalid?: boolean
  /** Shown as the invalid-feedback message when `required` and `invalid`. */
  requiredMessage?: string
}>()

const emit = defineEmits<{selected: [dataUrl: string]}>()

const { preview, stage } = useStagedImage(NO_IMAGE_URL)

const acceptedFormatsDescription = computed(() =>
  props.allowedExtensions
    ? `${$trans('Accepted file formats')}: ${props.allowedExtensions.join(', ')}`
    : undefined)

function onSelected(event: Event) {
  const file = chosenFile(event)
  if (!file) return

  if (props.allowedExtensions && !props.allowedExtensions.includes(extensionOf(file.name))) return

  void stage(file).then((dataUrl) => {
    emit('selected', dataUrl)
  })
}
</script>
