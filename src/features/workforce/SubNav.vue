<template>
  <div class="space">
    <b-nav tabs>
      <b-nav-item
        v-for="item in items"
        :key="item.name"
        :active="route.name === item.name"
        :to="toRoute(item.name)"
      >
        {{ item.label() }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script setup lang="ts">
/**
 * The pills every screen in this Slice carries. The route names are the legacy
 * screen's, verbatim - a bookmark and every spec depend on them.
 *
 * The legacy screen wrapped this in a `hasNav` computed that hid it for one
 * tenant ('demo'), keyed on the company code. Nothing in this application
 * branches on a company code (AGENTS.md: family comes from `profile.family`,
 * flavour from `profile.flavour`, never the code or the hostname), and the
 * pills are this Slice's own navigation, not a per-tenant product decision, so
 * they render for every tenant. The ledger in the module README records it.
 */
const route = useRoute()

const items: {name: RouteName; label: () => string}[] = [
  {name: 'company-time-registration', label: () => $trans('Time registration')},
  {name: 'leave-requests', label: () => $trans('Leave requests')},
  {name: 'leave-list', label: () => $trans('Leave')},
  {name: 'leave-types', label: () => $trans('Leave types')},
  {name: 'sick-leave-list', label: () => $trans('Sick leave')},
  {name: 'unconfirmed-sick-leave', label: () => $trans('Unconfirmed sick leave')},
]
</script>

<style scoped>
.space {
  padding-bottom: 10px;
}
</style>
