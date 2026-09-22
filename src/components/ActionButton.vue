<template>
  <BButton
    size="sm"
    :title="resolvedTitle"
    :to="linkTo"
    @click="onClick"
  >
    <component
      :is="icons[icon]"
      aria-hidden="true"
    />
  </BButton>
</template>

<script lang="ts" setup>
import type { RouteParamValueRaw } from 'vue-router'

import IBiArrowRepeat from '~icons/bi/arrow-repeat'
import IBiCloudDownload from '~icons/bi/cloud-download'
import IBiPlus from '~icons/bi/plus'
import IBiSearch from '~icons/bi/search'
/** The toolbar button this renders: add, download, refresh or search. */
export type ActionButtonIcon = 'add' | 'download' | 'refresh' | 'search'

const props = defineProps<{
  icon: ActionButtonIcon
  title?: string
  method?: () => void
  router_name?: string
  router_params?: Record<string, RouteParamValueRaw>
  /** Router location, preferred over router_name/router_params when both are given. */
  to?: RouteLocationRaw
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const icons = {
  add: IBiPlus,
  download: IBiCloudDownload,
  refresh: IBiArrowRepeat,
  search: IBiSearch,
} as const

// ButtonLinkSearch hardcoded its title; keep that default so its callers migrate bare.
const resolvedTitle = computed(() => props.title ?? (props.icon === 'search' ? $trans('Search') : undefined))

// A single BButton with :to: never a BLink nested inside a BButton.
const linkTo = computed<RouteLocationRaw | undefined>(
  () => props.to ?? (props.router_name ? {name: props.router_name, params: props.router_params} : undefined),
)

function onClick(event: MouseEvent) {
  props.method?.()
  emit('click', event)
}
</script>
