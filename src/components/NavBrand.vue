<template>
  <!-- One brand for both product families: the default family shows the member
    logo, shltr shows the company logo or the name tile. This used to be split
    between here (default only) and a duplicated block in TheSidebar (shltr). -->
  <b-navbar-brand
    v-if="isDefaultFamily && memberInfo"
    ref="nav-brand"
    to="/"
    :title="memberInfo.name"
  >
    <img
      class="memberLogo"
      :src="memberInfo.companylogo"
      :alt="memberInfo.name"
    >
  </b-navbar-brand>
  <router-link
    v-else-if="!isDefaultFamily"
    to="/"
    class="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-200 tw:px-5 tw:py-5 tw:no-underline"
    :title="memberInfo && memberInfo.name"
  >
    <img
      v-if="memberInfo && memberInfo.companylogo"
      class="tw:h-9 tw:w-auto tw:max-w-full tw:object-contain tw:object-left"
      :src="memberInfo.companylogo"
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

<script>
import componentMixin from "@/mixins/common";

export default {
  name: 'NavBrand',
  mixins: [componentMixin],
  props: {
    memberInfo: {
      type: Object,
      default: null,
    },
  },
}
</script>
<style scoped>
.memberLogo {
  max-width: 200px;
  max-height: 100px
}
</style>
