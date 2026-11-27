<template>
  <div class="equipment-parts">
    <p
      v-if="rows.length === 0"
      class="dimmed"
    >{{ $trans('This equipment has no parts yet') }}</p>
    <table
      v-else
      class="table table-sm data-table"
    >
      <thead>
        <tr>
          <th>{{ $trans('Part') }}</th>
          <th>{{ $trans('Description') }}</th>
          <th>{{ $trans('Position') }}</th>
          <th>{{ $trans('Condition score') }}</th>
          <th>{{ $trans('Rejected points') }}</th>
          <th>{{ $trans('Last inspection') }}</th>
          <th v-if="canEdit"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="equipment-part"
        >
          <td>{{ row.name }}</td>
          <template v-if="editing?.id === row.id">
            <td>
              <BFormTextarea
                :id="`part_description-${row.id}`"
                v-model="editing.description"
                size="sm"
                rows="1"
                :aria-label="$trans('Description')"
              />
            </td>
            <td>
              <BFormInput
                :id="`part_sequence-${row.id}`"
                v-model="editing.sequence"
                size="sm"
                type="number"
                :aria-label="$trans('Position')"
                :state="editError ? false : null"
              />
              <b-form-invalid-feedback :state="editError ? false : null">
                {{ editError }}
              </b-form-invalid-feedback>
            </td>
          </template>
          <template v-else>
            <td class="description">{{ row.description }}</td>
            <td>{{ row.sequence }}</td>
          </template>
          <td>{{ row.score ?? '' }}</td>
          <td>{{ row.rejected_count ?? '' }}</td>
          <td>{{ displayIsoDate(row.date) }}</td>
          <td
            v-if="canEdit"
            class="part-actions"
          >
            <template v-if="editing?.id === row.id">
              <BButton
                class="save-part"
                size="sm"
                variant="primary"
                :disabled="updatePart.isPending.value"
                @click="savePart"
              >{{ $trans('Save') }}</BButton>
              <BButton
                class="cancel-part"
                size="sm"
                variant="secondary"
                @click="editing = null"
              >{{ $trans('Cancel') }}</BButton>
            </template>
            <template v-else>
              <BButton
                class="edit-part"
                size="sm"
                variant="light"
                :title="$trans('Edit')"
                @click="editPart(row)"
              ><IBiPencil /></BButton>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { displayIsoDate } from '@/features/checklist'
import { fieldErrors, useQueryErrorToast, type FieldLabels } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import { invalidateEquipmentPartQueries } from './invalidation'

/**
 * The parts of an equipment, with the condition of each from the finished
 * checklists.
 *
 * Checklists make the parts: a question that names a part creates it at the
 * first finish. So there is no add here, and the name is the key between the
 * questions, the parts and the two tenants, so it cannot change either. A
 * planner changes the description and the position of a part.
 *
 * The part list gives the description and the position; the equipment's own
 * `parts` give the scores. The two are joined on the part id.
 */
const props = defineProps<{
  equipment: Api.Equipment
}>()

const {authStore, toast: create} = useCommon()

/** Planning users and staff: the API refuses every other role a part write. */
const canEdit = computed(() => Boolean(authStore.isPlanning || authStore.isAdmin))

// Every part of this equipment, not the first page: 1000 is the API's ceiling.
const partsQuery = useQuery(() => Api.EquipmentEquipmentPart.list.options({
  query: {equipment: props.equipment.id, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
}))

useQueryErrorToast(partsQuery.error, $trans('Error loading parts'))

interface PartRow {
  id: number
  name: string
  description: string
  sequence: number
  score: number | null
  rejected_count: number | null
  date: string | null
}

/** The parts in the API's order (position, then name), each with its condition. */
const rows = computed<PartRow[]>(() => {
  const conditions = new Map(props.equipment.parts.map((part) => [part.id, part]))
  return (partsQuery.data.value?.results ?? []).map((part) => {
    const condition = conditions.get(part.id)
    return {
      id: part.id,
      name: part.name,
      description: part.description ?? '',
      sequence: part.sequence ?? 0,
      score: condition?.score ?? null,
      rejected_count: condition?.rejected_count ?? null,
      date: condition?.date ?? null,
    }
  })
})

/** The row being edited. `sequence` is the input's string until the save. */
const editing = ref<{id: number, description: string, sequence: string | number} | null>(null)
const editError = ref<string | undefined>(undefined)

const PART_LABELS = {
  description: () => $trans('Description'),
  sequence: () => $trans('Position'),
} as const satisfies FieldLabels<'description' | 'sequence'>

const updatePart = useMutation(Api.EquipmentEquipmentPart.update.mutation())
const queryClient = useQueryClient()

function editPart(row: PartRow) {
  editError.value = undefined
  editing.value = {id: row.id, description: row.description, sequence: row.sequence}
}

async function savePart() {
  const draft = editing.value
  if (!draft) return
  // A blank position is the first position, as on a new part.
  const body = {description: draft.description, sequence: draft.sequence === '' ? 0 : Number(draft.sequence)}
  const errors = fieldErrors(Api.EquipmentEquipmentPart.update.body, body, {}, PART_LABELS)
  editError.value = errors.sequence ?? errors.description
  if (editError.value) return

  try {
    await updatePart.mutateAsync({path: {id: draft.id}, body})
  } catch {
    errorToast(create, $trans('Error updating part'))
    return
  }
  infoToast(create, $trans('Updated'), $trans('Part has been updated'))
  editing.value = null
  await invalidateEquipmentPartQueries(queryClient)
}
</script>

<style scoped>
.description {
  white-space: pre-line;
}
.part-actions {
  white-space: nowrap;
}
</style>
