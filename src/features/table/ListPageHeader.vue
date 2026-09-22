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
        <slot name="add" />
      </BButton-toolbar>
    </div>
  </header>
</template>

<script lang="ts" setup>
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
}>(), {
  searchable: true,
})

const searchDraft = defineModel<string>('searchDraft', {required: true})
</script>
