<template>
  <ImageUploadField
    field-id="member_companylogo"
    :label="$trans('Company logo')"
    :current-image="companyLogoImage"
    :allowed-extensions="LOGO_UPLOAD_EXTENSIONS"
    :required="required"
    :invalid="invalid"
    :required-message="MEMBER_LOGO_REQUIRED_MESSAGE()"
    @selected="(dataUrl) => { companyLogo = dataUrl }"
  />
  <ImageUploadField
    field-id="member_companylogo_workorder"
    :label="$trans('Optional logo for on the workorder')"
    :current-image="workorderLogoImage"
    @selected="(dataUrl) => { workorderLogo = dataUrl }"
  />
</template>

<script lang="ts" setup>
import ImageUploadField from '@/features/forms/ImageUploadField.vue'
import { LOGO_UPLOAD_EXTENSIONS, MEMBER_LOGO_REQUIRED_MESSAGE } from './schemas'
import { NO_IMAGE_URL } from '@/constants'
import { $trans } from '@/services/i18n'

type LogoValue = string | null | undefined

const companyLogo = defineModel<LogoValue>('companyLogo', { required: true })
const workorderLogo = defineModel<LogoValue>('workorderLogo', { required: true })

const props = defineProps<{
  currentCompanyLogo?: string | null
  currentWorkorderLogo?: string | null
  required: boolean
  invalid: boolean
}>()

const companyLogoImage = computed(() => props.currentCompanyLogo || NO_IMAGE_URL)
const workorderLogoImage = computed(() => props.currentWorkorderLogo || NO_IMAGE_URL)
</script>
