<template>
  <div class='app-page'>
    <h1><IBiLock></IBiLock></h1>

      <div class="panel no-access">
        <div class="text-center" v-if="isLoggedIn">
          <h3>{{ $trans('No access') }}</h3>
          <p>{{ $trans('Your account level may not have permission to access this page.')}}</p>
          <p>{{ $trans('Please contact the administrator.')}}</p>
        </div>
        <div v-else>
          <h3 class="text-center">{{ $trans('Log in') }}</h3>
          <div class="text-left">
            <LoginForm />
          </div>
        </div>
      </div>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'

import { LoginForm, useAuthStore } from '@/features/auth'
import { $trans } from '@/utils'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const isLoggedIn = computed(() => authStore.isLoggedIn)

/**
 * The guard parks denied users here as `/no-access?next=<path>` (see
 * src/router/index.js). Only a same-origin path is honored: an absolute URL,
 * a protocol-relative `//host` value (raw or backslash-smuggled), or
 * anything without a single leading slash is dropped, and the view keeps its
 * current behaviour instead of redirecting off-site.
 */
function safeNextPath(value: LocationQueryValue | LocationQueryValue[]): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  if (raw.includes('\\') || /%5c/i.test(raw)) return null
  return raw
}

// The login form posts and the store flips isLoggedIn; there is no event to
// hook, so watch the flag. Immediate covers landing here already logged in.
// Replace (not push) keeps the gate out of the back-button path.
watch(
  isLoggedIn,
  (loggedIn) => {
    if (!loggedIn) return
    const target = safeNextPath(route.query.next)
    if (target !== null && route.path !== target) {
      router.replace(target)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
h1 {
  color: #fffc;
  text-align: center;
  padding-block: 3rem 1rem;
  font-size: 4rem;
}
.no-access {
    padding: 3rem!important;
    text-align: center;
    margin: -1rem auto 3rem!important;
    inline-size: max-content;
  }
</style>
