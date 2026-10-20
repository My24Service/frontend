<template>
  <!-- One brand for every caller: the centered member logo, or — only when the
    shltr sidebar asks for it with `sidebar` — the tile at the top of that
    sidebar. The logged-out pages (TheIndex, TheAppLayout) never pass `sidebar`,
    so they keep the centered logo on both product families. -->
  <BNavbarBrand
    v-if="!showTile && memberInfo"
    ref="nav-brand"
    to="/"
    :title="memberInfo.name"
  >
    <img
      class="memberLogo"
      :src="memberInfo.companylogo ?? undefined"
      :alt="memberInfo.name"
    >
  </BNavbarBrand>
  <router-link
    v-else-if="showTile"
    to="/"
    class="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-200 tw:px-5 tw:py-5 tw:no-underline"
    :title="memberInfo?.name"
  >
    <img
      v-if="memberInfo && memberInfo.companylogo"
      class="tw:h-9 tw:w-auto tw:max-w-full tw:object-contain tw:object-left"
      :src="memberInfo.companylogo ?? undefined"
      :alt="memberInfo.name"
    >
    <template v-else-if="memberInfo">
      <span
        class="tw:grid tw:h-8 tw:w-8 tw:shrink-0 tw:place-items-center tw:rounded-md tw:bg-teal-500 tw:text-white"
      >
        <IBiBuilding class="tw:h-4 tw:w-4"></IBiBuilding>
      </span>
      <span class="tw:min-w-0 tw:truncate tw:text-sm tw:font-semibold tw:leading-tight tw:text-slate-900">
        {{ memberInfo.name }}
      </span>
    </template>
  </router-link>
</template>

<script setup lang="ts">
export interface MemberInfo {
  name: string
  companylogo?: string | null
}

const props = withDefaults(defineProps<{
  memberInfo?: MemberInfo | null
  /** Render as the shltr sidebar's brand tile rather than the centered logo. */
  sidebar?: boolean
}>(), {
  memberInfo: null,
  sidebar: false,
})

const mainStore = useMainStore()

const showTile = computed<boolean>(() => props.sidebar && mainStore.getProductFamily !== 'default')
</script>
<style scoped>
.memberLogo {
  max-width: 200px;
  max-height: 100px
}
</style>
