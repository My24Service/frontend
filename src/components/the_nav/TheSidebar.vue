<template>
  <nav
    class="app-sidebar"
    :class="isDefaultFamily ? '' : 'nav-shltr tw:flex tw:flex-col tw:bg-white'"
  >
    <!-- brand -->
    <NavBrand :member-info="memberInfo" sidebar />

    <!-- menu -->
    <NavItems :mode="onlySettings ? 'settings' : (hasBranches ? 'branch' : 'default')" />

    <!-- user -->
    <BNavItemDropdown
      dropup
      :text="getUsername"
      right
      v-if="userInfo.user"
      :class="isDefaultFamily ? 'mb-1 border-top p-1' : 'nav-shltr-user tw:mt-auto tw:border-t tw:border-slate-200'"
    >
      <template #button-content>
        <template v-if="isDefaultFamily">
          <IBiPersonCircle></IBiPersonCircle>&nbsp;
          <span>{{ getUsername }}</span>
        </template>
        <span v-else class="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3">
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
      <li class="tw:text-center" :class="isDefaultFamily ? '' : 'tw:px-4 tw:py-1 tw:text-xs tw:text-slate-500'">
        {{ memberInfo?.name }}
      </li>
      <li><span class="dropdown-item"><AppVersion /></span></li>
      <BDropdownDivider></BDropdownDivider>
      <BDropdownItem :to="settingsRoute" v-if="hasBranches">
        {{ $trans('Settings') }}
      </BDropdownItem>
      <BDropdownItem v-b-modal.lang-modal>{{ $trans('App Language') }}</BDropdownItem>
      <BDropdownItem v-b-modal.password-change-modal>{{ $trans('Change password') }}</BDropdownItem>
      <BDropdownItem v-b-modal.logout-modal>{{ $trans('Logout') }}</BDropdownItem>
    </BNavItemDropdown>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/features/auth'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import NavItems from '@/components/NavItems.vue'
import NavBrand, { type MemberInfo } from '@/components/NavBrand.vue'
import AppVersion from '@/components/AppVersion.vue'

// The sidebar for both product families. The shltr layout is the base; the
// default family branches on `profile.family` for its root class, brand,
// dropdown class, dropdown button and member line. The former sidebar mixin is
// inlined here: its modals (logout / language / password) live in
// TheNavLoggedIn and are reached by id through the v-b-modal directive.
withDefaults(defineProps<{
  onlySettings?: boolean
}>(), {
  onlySettings: false,
})

const mainStore = useMainStore()
const authStore = useAuthStore()

const memberInfo = computed<MemberInfo | null>(() => mainStore.memberInfo)
const session = computed(() => authStore.userInfo)
const userInfo = computed<{ user?: unknown }>(() => session.value ?? {})
const getUsername = computed<string>(() => authStore.getUserName)
const isDefaultFamily = computed<boolean>(() => mainStore.getProductFamily === 'default')
const hasBranches = computed<boolean>(() => mainStore.getMemberHasBranches)
const isBranchEmployee = computed<boolean>(() => authStore.isBranchEmployee)

// Branch employees have no access to /settings/company, so send them to
// the first settings page they may actually open.
const settingsRoute = computed<RouteLocationRaw>(() =>
  isBranchEmployee.value
    ? { name: 'settings-my-branch' }
    : { name: 'settings-company' })

const userInitials = computed<string>(() => {
  // usernames here look like "Richard (admin)" — keep the word characters only
  const parts = (getUsername.value || '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
})

const userEmail = computed<string | undefined>(() => {
  const email = session.value?.user?.email
  return typeof email === 'string' ? email : undefined
})
</script>
