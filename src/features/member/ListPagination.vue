<template>
  <div class="my24-pagination">
    <span class="count-section">
      {{ label }}
      <strong><b>{{ currentItemsStart }}</b> - <b>{{ currentItemsEnd }}</b></strong>
      / {{ count }}
    </span>
    <br>
    <span class="pagination-section">
        <b-pagination
          v-if="count > PER_PAGE"
          class="pt-4"
          :model-value="page"
          :total-rows="count"
          :per-page="PER_PAGE"
          :aria-controls="controlsId"
          @update:model-value="goToPage"
        ></b-pagination>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoutePagedList } from './route-paged-list'

/**
 * The count-and-pagination block every list in this Slice renders.
 *
 * Extracted alongside `route-paged-list.ts` at #324, when a fourth screen was
 * about to copy it. The page lives in the URL, so this reads the same route
 * state the list's query does and pushes the same way — no props to thread
 * beyond what varies: the row count, the label, and which table it controls.
 */
const props = defineProps<{
  count: number
  label: string
  controlsId: string
}>()

// Every list in the Slice paginates at twenty; nothing has ever varied it.
const PER_PAGE = 20

const {page, goToPage} = useRoutePagedList()

// Both ends clamp to the real row count, so a stale or hand-edited
// `?page=` beyond the last page reads as a collapsed range ("45 - 45 / 45")
// instead of arithmetic that has drifted past the data ("1981 - 45 / 45").
const currentItemsStart = computed(() =>
  props.count === 0 ? 0 : Math.min((page.value - 1) * PER_PAGE + 1, props.count))
const currentItemsEnd = computed(() =>
  props.count === 0 ? 0 : Math.min(page.value * PER_PAGE, props.count))
</script>
