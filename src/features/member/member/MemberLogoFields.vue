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

/**
 * The member's two logos: the company logo every member carries, and the
 * optional one the workorder is printed with.
 *
 * Each row shows the stored image beside the preview of a file the user has
 * just chosen, so the panel takes the stored URLs as props and keeps the
 * data-URL the reader hands back in the form's own values — never seeding a
 * logo from the record, which would post the stored image back unchanged.
 *
 * `required` and `invalid` are the company logo's: the API accepts a member
 * without a logo, but the signup flow refuses to finish without one.
 */

/** `null` is a logo the API reports as empty; `undefined` is one never set. */
type LogoValue = string | null | undefined

const companyLogo = defineModel<LogoValue>('companyLogo', { required: true })
const workorderLogo = defineModel<LogoValue>('workorderLogo', { required: true })

const props = defineProps<{
  /** The stored company logo, when the member under edit has one. */
  currentCompanyLogo?: string | null
  /** The stored workorder logo, when the member under edit has one. */
  currentWorkorderLogo?: string | null
  /** The company logo is demanded on a create. */
  required: boolean
  /** The company logo's feedback after a refused submit. */
  invalid: boolean
}>()

const companyLogoImage = computed(() => props.currentCompanyLogo || NO_IMAGE_URL)
const workorderLogoImage = computed(() => props.currentWorkorderLogo || NO_IMAGE_URL)
</script>
