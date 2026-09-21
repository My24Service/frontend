<template>
  <div/>
</template>
<script setup>
import userSocket from '../services/websocket/UserSocket'
import memberSocket from '../services/websocket/MemberSocket'
import { NEW_DATA_EVENTS } from '@/constants'
import MemberNewDataSocket from '../services/websocket/MemberNewDataSocket'
import {
  errorToast,
  infoToast,
  $trans
} from "@/services/i18n";
import {
  doFetchUnacceptedCountAndUpdateStore,
  hasAccessToModule
} from "@/utils";

import {useAuthStore} from '@/features/auth';

import {useMainStore} from "@/stores/main";

const memberNewDataSocket = new MemberNewDataSocket();
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create} = useToast()

// Both timers are created here rather than in setupPolling(), which runs after
// the awaits in onMounted: a composable created there registers no scope
// cleanup, so its timer would outlive the component. Started only once the
// role check passes.
const pollUnacceptedCount = () => doFetchUnacceptedCountAndUpdateStore()
const { start: startWarmUpPoll } = useTimeoutFn(pollUnacceptedCount, 1000, { immediate: false })
const { resume: startPolling } = useIntervalFn(pollUnacceptedCount, 5 * 60 * 1000, { immediate: false })

function handleMessageUser(data) {
  if (data.level === 'error') {
    errorToast(create, data.message, $trans('User message'))
  } else {
    infoToast(create, $trans('User message'), data.message)
  }
}

function handleMessageMember(data) {
  if (data.level === 'error') {
    errorToast(create, data.message, $trans('Company message'))
  } else {
    infoToast(create, $trans('Company message'), data.message)
  }
}

async function setupPolling() {
  const doPoll = authStore.isStaff || authStore.isSuperuser || (authStore.isPlanning && hasAccessToModule('orders'))
  if (!doPoll) {
    console.debug('no polling')
    return
  }

  console.debug('setting up polling: doFetchUnacceptedCountAndUpdateStore')
  startWarmUpPoll()
  startPolling()
}

function onNewData(data) {
  if (data.type === NEW_DATA_EVENTS.UNACCEPTED_ORDER) {
    doFetchUnacceptedCountAndUpdateStore()
  }

  if (data.type === NEW_DATA_EVENTS.REFRESH_INITIAL) {
    mainStore.getInitialData()
  }
}

onMounted(async () => {
  await userSocket.init()
  userSocket.setOnmessageHandler(handleMessageUser)
  userSocket.getSocket()

  await memberSocket.init()
  memberSocket.setOnmessageHandler(handleMessageMember)
  memberSocket.getSocket()

  await memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
  memberNewDataSocket.setOnmessageHandler(onNewData)
  memberNewDataSocket.getSocket()

  // unaccepted orders polling
  await setupPolling()
})

onUnmounted(async () => {
  // Every handler registered above goes with the component, and each socket is
  // closed with it. The pairing is not decorative: BaseSocket._onMessageMethod
  // calls `onmessageHandler` unconditionally, so a handler dropped while its
  // socket stays open turns the next message into a TypeError rather than
  // being ignored. Dropping both is what stops the two singletons holding a
  // dead component's closures - its toasts, its store.
  userSocket.removeOnmessageHandler()
  userSocket.removeSocket()

  memberSocket.removeOnmessageHandler()
  memberSocket.removeSocket()

  memberNewDataSocket.removeOnmessageHandler()
  memberNewDataSocket.removeSocket()
})
</script>
