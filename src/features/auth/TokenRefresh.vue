<template>
  <div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'

import { useAuthStore } from '@/features/auth'
import { getStoredToken } from './token-storage'

// 'SLIDING_TOKEN_LIFETIME': timedelta(days=2),
// 'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=14),
const INTERVAL_MINUTES = 15
const EXPIRE_REFRESH_THRESHOLD_SEC = 60 * 60 * 12

const authStore = useAuthStore()

let intervalId: ReturnType<typeof setInterval> | null = null

function parseJwt(token: string): { exp: number } {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )

  return JSON.parse(jsonPayload)
}

async function checkToken() {
  const token = getStoredToken()
  if (!token) {
    return
  }

  let tokenVars: { exp: number }
  try {
    tokenVars = parseJwt(token)
  } catch (e) {
    console.error('error parsing token', e)
    return
  }
  if (!Number.isFinite(tokenVars.exp)) {
    return
  }

  const expireInSeconds = tokenVars.exp - Math.round(Date.now() / 1000)
  const expireInHours = Math.round(expireInSeconds / (60 * 60))
  const debugStr = `threshold: ${EXPIRE_REFRESH_THRESHOLD_SEC / (60 * 60)} hrs, expire in seconds: ${expireInSeconds}, ${expireInHours} hrs`

  if (expireInSeconds <= EXPIRE_REFRESH_THRESHOLD_SEC) {
    console.debug(`refreshing token (${debugStr})`)

    try {
      await authStore.refreshToken()
    } catch (e) {
      console.error('error refreshing token', e)
    }
  } else {
    console.debug(`not refreshing token (${debugStr})`)
  }
}

onMounted(() => {
  void checkToken()
  intervalId = setInterval(() => void checkToken(), 1000 * 60 * INTERVAL_MINUTES)
})

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>
