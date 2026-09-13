<template>
  <b-nav pills class="statuscode-pills">
    <b-nav-item
      v-for="type in CODE_TYPES"
      :key="type"
      :active="type === active"
      :to="{name: routeNamesFor(type, fromSettings).list}"
    >
      {{ codeTypeLabel(type) }}
    </b-nav-item>
  </b-nav>
</template>

<script lang="ts" setup>
import { CODE_TYPES, codeTypeLabel, routeNamesFor, type CodeType } from './code-types'

/**
 * One pill per code type, linking to that type's list in the tree the screen
 * was mounted from. The legacy pills sent every company-tree pill to the
 * order list (`getNavLink` dropped its argument) and hid themselves in the
 * settings tree; both trees now get working pills.
 */
withDefaults(defineProps<{
  active: CodeType
  fromSettings?: boolean
}>(), {
  fromSettings: false,
})
</script>

<style scoped>
/* The pills sit in the page header, whose text colour differs per theme
   (dark on the shltr header, white on the orange default one). The theme
   link colour is the header's own colour on the default theme, so an
   inactive pill takes the text colour of the header it sits in instead. */
.statuscode-pills :deep(.nav-link:not(.active)) {
  color: inherit;
}
/* The active pill's background is the theme's primary colour, which on the
   default theme is also the header's; a ring in the pill's own text colour
   keeps it visible there and disappears into the white shltr header. */
.statuscode-pills :deep(.nav-link.active) {
  box-shadow: 0 0 0 2px currentColor;
}
</style>
