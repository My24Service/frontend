<template>
  <nav class="app-sidebar nav-shltr tw:flex tw:flex-col tw:bg-white">
    <!-- brand -->
    <router-link
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

    <!-- menu -->
    <NavItems v-if="!hasBranches && !onlySettings" />
    <NavItemsBranch v-if="hasBranches && !onlySettings" />
    <NavItemsSettings v-if="onlySettings" />

    <!-- user -->
    <b-nav-item-dropdown
      dropup
      :text="getUsername"
      right
      v-if="userInfo.user"
      class="nav-shltr-user tw:mt-auto tw:border-t tw:border-slate-200"
    >
      <template #button-content>
        <span class="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3">
          <span
            class="tw:grid tw:h-8 tw:w-8 tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-slate-200 tw:text-xs tw:font-semibold tw:text-slate-600"
          >{{ userInitials }}</span>
          <span class="tw:min-w-0 tw:text-left">
            <span class="tw:block tw:truncate tw:text-sm tw:font-medium tw:text-slate-900">
              {{ getUsername }}
            </span>
            <span class="tw:block tw:truncate tw:text-[11px] tw:text-slate-500" v-if="userEmail">
              {{ userEmail }}
            </span>
          </span>
        </span>
      </template>
      <li class="tw:px-4 tw:py-1 tw:text-center tw:text-xs tw:text-slate-500">
        {{ memberInfo.name }}
      </li>
      <li><span class="dropdown-item"><Version /></span></li>
      <b-dropdown-divider></b-dropdown-divider>
      <b-dropdown-item :to="settingsRoute" v-if="hasBranches">
        {{ $trans('Settings') }}
      </b-dropdown-item>
      <b-dropdown-item v-b-modal.lang-modal>{{ $trans('App Language') }}</b-dropdown-item>
      <b-dropdown-item v-b-modal.password-change-modal>{{ $trans('Change password') }}</b-dropdown-item>
      <b-dropdown-item v-b-modal.logout-modal>{{ $trans('Logout') }}</b-dropdown-item>
    </b-nav-item-dropdown>
  </nav>
</template>

<script>
import NavItems from "@/components/NavItems.vue"
import NavItemsBranch from "@/components/NavItemsBranch.vue"
import NavItemsSettings from "@/components/NavItemsSettings.vue"
import Version from "@/components/Version.vue"
import navMixin from "./navMixin"

export default {
  name: 'NavShltr',
  mixins: [navMixin],
  components: {
    NavItems,
    NavItemsBranch,
    NavItemsSettings,
    Version,
  },
  computed: {
    userInitials() {
      // usernames here look like "Richard (admin)" — keep the word characters only
      const parts = (this.getUsername || '')
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean)
      if (!parts.length) return '?'
      return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
    },
    userEmail() {
      return this.userInfo.user && this.userInfo.user.email
    }
  }
}
</script>
