<template>
  <LogoUploadField
    field-id="member_companylogo"
    :label="$trans('Company logo')"
    :current-image="companyLogoImage"
    :allowed-extensions="LOGO_UPLOAD_EXTENSIONS"
    :required="required"
    :invalid="invalid"
    @selected="(dataUrl) => { companyLogo = dataUrl }"
  />
  <LogoUploadField
    field-id="member_companylogo_workorder"
    :label="$trans('Optional logo for on the workorder')"
    :current-image="workorderLogoImage"
    @selected="(dataUrl) => { workorderLogo = dataUrl }"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import LogoUploadField, { LOGO_UPLOAD_EXTENSIONS } from './LogoUploadField.vue'
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
