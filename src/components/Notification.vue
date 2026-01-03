<template>
  <div/>
</template>
<script setup>
import userSocket from '../services/websocket/UserSocket.js'
import memberSocket from '../services/websocket/MemberSocket.js'
import { NEW_DATA_EVENTS } from '@/constants'
import MemberNewDataSocket from '../services/websocket/MemberNewDataSocket.js'
import {
  errorToast,
  infoToast,
  $trans,
  doFetchUnacceptedCountAndUpdateStore,
  hasAccessToModule
} from "@/utils";
import {onMounted, onUnmounted, ref} from "vue";
import {useAuthStore} from "@/stores/auth";
import {useToast} from "bootstrap-vue-next";
import {useMainStore} from "@/stores/main";

const memberNewDataSocket = new MemberNewDataSocket();
const intervalId = ref(null)
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create} = useToast()

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

  setTimeout(async () => {
    await doFetchUnacceptedCountAndUpdateStore()
  }, 1000)

  console.debug('setting up polling: doFetchUnacceptedCountAndUpdateStore')
  intervalId.value = setInterval(async () => {
    await doFetchUnacceptedCountAndUpdateStore()
  }, 5*60*1000)
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
  await memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
  memberNewDataSocket.removeOnmessageHandler()
  memberNewDataSocket.removeSocket()

  if (intervalId.value) {
    console.debug('clearing polling: doFetchUnacceptedCountAndUpdateStore')
    clearInterval(intervalId.value)
  } else {
    console.debug('not clearing polling, no interval: doFetchUnacceptedCountAndUpdateStore')
  }
})
</script>
