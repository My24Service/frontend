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
import { $trans } from '@/services/i18n'

defineProps<{
  title: string
  searchLabel: string
  refresh: () => void
}>()

const searchDraft = defineModel<string>('searchDraft', {required: true})
</script>
