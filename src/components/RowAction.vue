<template>
  <BButton
    variant="light"
    :title="title"
    :to="linkTo"
    :class="{'icon-th': header}"
    @click="onClick"
  >
    <component
      :is="icons[icon]"
      :class="{'edit-icon': !header}"
      :variant="icon === 'plus' && header ? 'info' : undefined"
      aria-hidden="true"
    />
  </BButton>
</template>

<script lang="ts" setup>
import type { RouteParamValueRaw } from 'vue-router'

import IBiPencil from '~icons/bi/pencil'
import IBiPersonCheckFill from '~icons/bi/person-check-fill'
import IBiPlus from '~icons/bi/plus'
import IBiTrashFill from '~icons/bi/trash-fill'

/** The row action this renders: assign, delete, edit or plus. */
export type RowActionIcon = 'assign' | 'delete' | 'edit' | 'plus'

const props = defineProps<{
  icon: RowActionIcon
  title?: string
  method?: () => void
  router_name?: string
  router_params?: Record<string, RouteParamValueRaw>
  /** Router location, preferred over router_name/router_params when both are given. */
  to?: RouteLocationRaw
  /** Header cell (replaces IconLinkPlus type="th"): icon-th styling, no dimmed edit-icon. */
  header?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const icons = {
  assign: IBiPersonCheckFill,
  delete: IBiTrashFill,
  edit: IBiPencil,
  plus: IBiPlus,
} as const

// A single BButton with :to: never a router-link wrapped around a BButton.
const linkTo = computed<RouteLocationRaw | undefined>(
  () => props.to ?? (props.router_name ? {name: props.router_name, params: props.router_params} : undefined),
)

function onClick(event: MouseEvent) {
  props.method?.()
  emit('click', event)
}
</script>
