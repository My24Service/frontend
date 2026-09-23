<template>
  <header>
    <div class="page-title">
      <h3><slot name="icon" /> {{ title }}</h3>
      <BButton-toolbar>
        <BButton-group class="me-1">
          <ActionButton icon="refresh"
            :method="refresh"
            :title="$trans('Refresh')"
          />
          <slot name="toolbar-extra" />
        </BButton-group>
        <input
          v-if="searchable"
          v-model="searchDraft"
          class="form-control form-control-sm w-auto me-2"
          :aria-label="searchLabel"
          :placeholder="searchLabel"
        />
        <!-- The column filters, beside the search field: this menu adds one,
             the chip it adds shows in the subnav area under the header (see
             ServerTable). In the header, not in the table's overflow-auto box,
             so an open editor's popover is not clipped. Renders nothing when
             the table declares no filterable column. -->
        <ColumnFilterMenu
          v-if="table"
          :table="table"
          class="filter-menu"
        />
        <slot name="header-actions" />
        <slot name="add" />
      </BButton-toolbar>
    </div>
  </header>
</template>

<script lang="ts" setup generic="TData extends RowData">
import type { RowData, VueTable } from '@tanstack/vue-table'
import type { AppFeatures } from './table'
import ColumnFilterMenu from './filters/ColumnFilterMenu.vue'

withDefaults(defineProps<{
  title: string
  searchLabel: string
  refresh: () => void
  /**
   * Whether the header offers a search field. False for a list whose endpoint
   * declares no search term: the field would send a parameter the backend
   * ignores, and a control that does nothing is worse than no control.
   */
  searchable?: boolean
  /**
   * The list's table, when the header should carry its column filters. Absent
   * for a header with no table behind it — the page-title screens that render
   * this header for its shape alone.
   */
  table?: VueTable<AppFeatures, TData>
}>(), {
  searchable: true,
})

const searchDraft = defineModel<string>('searchDraft', {required: true})
</script>

<style scoped>
/* A gap after the filter menu while it is on screen. The menu renders no
   element at all when the table offers no filterable column, so nothing is
   left behind when there is nothing to filter. */
.filter-menu {
  margin-right: 0.5rem;
}
</style>
