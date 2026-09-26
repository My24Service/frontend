<template>
  <div>
  </div>
</template>

<script lang="ts" setup>
import { useAuthToken } from './token'

// 'SLIDING_TOKEN_LIFETIME': timedelta(days=2),
// 'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=14),
const INTERVAL_MINUTES = 15
const EXPIRE_REFRESH_THRESHOLD_SEC = 60 * 60 * 12

const authStore = useAuthStore()

/**
 * The refresh cadence as a managed interval: it cleans itself up on unmount,
 * and a hidden tab pauses it instead of firing — or queueing — checks nobody
 * sees. Becoming visible checks at once and resumes, so a laptop that slept
 * past the threshold refreshes on wake rather than at the next tick. The
 * threshold itself is untouched.
 */
const { pause, resume } = useIntervalFn(() => void checkToken(), 1000 * 60 * INTERVAL_MINUTES)
const visibility = useDocumentVisibility()

watch(visibility, (state) => {
  if (state === 'visible') {
    void checkToken()
    resume()
  } else {
    pause()
  }
})

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

  // The token payload is `{exp}`, but `JSON.parse` answers `any`: a payload
  // that is missing or misshapen reads as expired rather than crashing the
  // refresh check below.
  const payload: unknown = JSON.parse(jsonPayload)
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'exp' in payload &&
    typeof payload.exp === 'number'
  ) {
    return { exp: payload.exp }
  }
  return { exp: NaN }
}

async function checkToken() {
  const token = useAuthToken().value
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
})
</script>
