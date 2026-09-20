<template>
  <DocumentCollectionEditor
    :resource="quotationDocumentResource"
    :parent-id="quotationId"
    id-prefix="quotation"
    :is-view="isView"
  />
</template>

<script setup lang="ts">
import DocumentCollectionEditor from '@/features/documents/DocumentCollectionEditor.vue'
import { quotationDocumentResource } from '@/features/documents/quotation-document-resource'

/**
 * The quotation's documents: the one document editor, with the quotation
 * endpoint injected. This replaces the legacy `DocumentService` editor, which
 * staged and reconciled the same set through its own model; the generated
 * quotation-document ops carry the same shape (`quotation`, `name`,
 * `description`, `file` in, a URL back), so the editor needs no quotation
 * specific logic.
 */
const props = withDefaults(defineProps<{
  quotation?: {id?: number} | null
  isView?: boolean
}>(), {
  quotation: null,
  isView: false,
})

// Both call sites mount this only once the quotation exists
// (`v-if="quotation && quotation.id"`), so null is a type-level state.
const quotationId = computed(() => props.quotation?.id ?? null)
</script>
