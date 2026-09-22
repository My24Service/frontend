<template>
  <BFormGroup
    label-cols="3"
    :label="$trans('Name')"
    :label-for="`${idPrefix}-document-name`"
  >
    <BFormInput
      :id="`${idPrefix}-document-name`"
      size="sm"
      v-model="name"
    />
  </BFormGroup>

  <BFormGroup
    label-cols="3"
    :label="$trans('Description')"
    :label-for="`${idPrefix}-document-description`"
  >
    <BFormTextarea
      :id="`${idPrefix}-document-description`"
      v-model="description"
      rows="1"
    />
  </BFormGroup>
</template>

<script lang="ts" setup>
/**
 * The editable metadata every document editor shares: name and description.
 *
 * `idPrefix` keeps each screen's field ids exactly what they were before the
 * fields moved here (`customer-document-name`, `equipment-document-name`), so
 * a spec selecting by id does not care that the markup now lives one level
 * down.
 */
defineProps<{
  /** `customer`, `equipment` or `location`; the document id prefix. */
  idPrefix: string
}>()

const name = defineModel<string | null | undefined>('name')
const description = defineModel<string | null | undefined>('description')
</script>
