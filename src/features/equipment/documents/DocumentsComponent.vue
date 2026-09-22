<template>
  <DocumentCollectionEditor
    ref="editor"
    :resource="resource"
    :parent-id="parentId"
    :id-prefix="kind"
    :is-view="isView"
  />
</template>

<script setup lang="ts">
import { DocumentCollectionEditor } from '@/features/documents'
import { equipmentDocumentResource, locationDocumentResource } from './document-resources'

/**
 * The document panel a record's form and detail page both show: one editor,
 * with the endpoint injected for whichever kind of record this is.
 *
 * `kind` stays explicit rather than inferred from which record prop is set: a
 * create form holds no record yet, and a panel that read that as "so this must
 * be equipment" would send a location's uploads to the equipment endpoint - a
 * wrong path whose body still validates, which is the worst kind of wrong.
 */
const props = withDefaults(defineProps<{
  /** Which record's documents these are. */
  kind: 'equipment' | 'location'
  /** The location whose documents these are, when `kind` is `location`. */
  location?: {id?: number} | null
  /** The equipment whose documents these are, when `kind` is `equipment`. */
  equipment?: {id?: number} | null
  /** On a detail page the panel is read-only: no add, edit or delete. */
  isView?: boolean
}>(), {
  location: null,
  equipment: null,
  isView: false,
})

// Resolved once, at setup: "is the prop absent?" is not a contract a create
// form can answer, since its record does not exist when this panel mounts.
const resource = props.kind === 'location' ? locationDocumentResource : equipmentDocumentResource
const parentId = computed(() =>
  (props.kind === 'location' ? props.location?.id : props.equipment?.id) ?? null)

const editor = useTemplateRef<{parentCreated: (pk: number) => Promise<unknown>}>('editor')

/**
 * Hand the panel the parent id it did not have when it mounted, then save.
 * A create form calls this once its own create answered.
 */
function parentCreated(pk: number) {
  return editor.value?.parentCreated(pk) ?? Promise.resolve([])
}

defineExpose({parentCreated})
</script>
