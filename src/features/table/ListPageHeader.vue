<template>
  <header>
    <div class="page-title">
      <h3><slot name="icon" /> {{ title }}</h3>
      <BButton-toolbar>
        <BButton-group class="me-1">
          <ButtonLinkRefresh
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
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/services/i18n'

/**
 * The list-screen header every `*List.vue` repeats: an h3 (with a slotted
 * icon), the refresh button, the search input and an Add link — identical
 * across the lists bar the text. What varies per screen (the icon, extra
 * toolbar buttons like Customer's download, and the Add link(s) — Member
 * renders two, conditionally) stays in slots rather than props, since none
 * of those follow a single shared shape.
 *
 * The toolbar markup matches the converted screens byte for byte
 * (`ButtonLinkRefresh`, the search input's classes and aria wiring), so a
 * screen adopting this renders what it rendered before.
 */
defineProps<{
  title: string
  searchLabel: string
  refresh: () => void
}>()

const searchDraft = defineModel<string>('searchDraft', {required: true})
</script>
