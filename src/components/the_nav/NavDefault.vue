<template>
  <nav class="app-sidebar">
    <NavBrand
      v-if="memberInfo"
      :member-info="memberInfo"
    />
    <NavItems v-if="!hasBranches && !onlySettings" />
    <NavItemsBranch v-if="hasBranches && !onlySettings" />
    <NavItemsSettings v-if="onlySettings" />
    <b-nav-item-dropdown
      dropup
      :text="getUsername"
      right
      v-if="userInfo.user"
      class="mb-1 border-top p-1"
    >
      <template #button-content>
        <IBiPersonCircle></IBiPersonCircle>&nbsp;
        <span>{{ getUsername }}</span>
      </template>
      <li style="text-align: center;">
        {{ memberInfo.name }}
      </li>
      <li><span class='dropdown-item'><Version /></span></li>
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
import NavBrand from "@/components/NavBrand.vue"
import Version from "@/components/Version.vue"
import navMixin from "./navMixin"

export default {
  name: 'NavDefault',
  mixins: [navMixin],
  components: {
    NavItems,
    NavItemsBranch,
    NavItemsSettings,
    NavBrand,
    Version,
  },
}
</script>
