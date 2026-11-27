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
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="equipment-part"
        >
          <td>{{ row.name }}</td>
          <td class="description">{{ row.description }}</td>
          <td>{{ row.sequence }}</td>
          <td>{{ row.score ?? '' }}</td>
          <td>{{ row.rejected_count ?? '' }}</td>
          <td>{{ displayIsoDate(row.date) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { displayIsoDate } from '@/features/checklist'
import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

/**
 * The parts of an equipment, with the condition of each from the finished
 * checklists.
 *
 * Checklists make the parts: a question that names a part creates it at the
 * first finish. So there is no add here, and the name is the key between the
 * questions, the parts and the two tenants, so it cannot change either.
 *
 * The part list gives the description and the position; the equipment's own
 * `parts` give the scores. The two are joined on the part id.
 */
const props = defineProps<{
  equipment: Api.Equipment
}>()

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
</script>

<style scoped>
.description {
  white-space: pre-line;
}
</style>
