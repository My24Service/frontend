<template>
  <div/>
</template>
<script setup>
import userSocket from '../services/websocket/UserSocket.js'
import memberSocket from '../services/websocket/MemberSocket.js'
import { NEW_DATA_EVENTS } from '@/constants'
import MemberNewDataSocket from '../services/websocket/MemberNewDataSocket.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans, doFetchUnacceptedCountAndUpdateStore} from "@/utils";
import {onMounted, onUnmounted, ref} from "vue";
import {useStore} from "vuex";
const {create} = useToast()

const memberNewDataSocket = new MemberNewDataSocket();
const intervalId = ref(null)
const store = useStore()

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
  const doPoll = store.getters.getIsStaff || store.getters.getIsSuperuser || (store.getters.getIsPlanning && this.hasAccessToModule('orders'))
  if (!doPoll) {
    console.debug('no polling')
    return
  }

  setTimeout(async () => {
    await doFetchUnacceptedCountAndUpdateStore()
  }, 1000)

  console.debug('setting up polling: doFetchUnacceptedCountAndUpdateStore')
  this.intervalId = setInterval(async () => {
    await doFetchUnacceptedCountAndUpdateStore()
  }, 5*60*1000)
}

function onNewData(data) {
  if (data.type === NEW_DATA_EVENTS.UNACCEPTED_ORDER) {
    doFetchUnacceptedCountAndUpdateStore()
  }

  if (data.type === NEW_DATA_EVENTS.REFRESH_INITIAL) {
    store.dispatch('getInitialData')
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
