<template>
  <DocumentCollectionEditor
    :resource="quotationDocumentResource"
    :parent-id="quotationId"
    id-prefix="quotation"
    :is-view="isView"
  />
</template>

<script setup lang="ts">
import {
  DocumentCollectionEditor,
  quotationDocumentResource,
} from '@/features/documents'

/**
 * The quotation's documents: the one document editor with the quotation
 * endpoint injected. Used by the form (editable) and the view (read-only).
 */
withDefaults(defineProps<{
  quotationId: number
  isView?: boolean
}>(), {
  isView: false,
})
</script>
