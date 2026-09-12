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
