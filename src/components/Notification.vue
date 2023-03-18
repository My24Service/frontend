<template>
  <div/>
</template>
<script>
import { componentMixin } from '../utils.js'
import userSocket from '../services/websocket/UserSocket.js'
import memberSocket from '../services/websocket/MemberSocket.js'
import { NEW_DATA_EVENTS } from '../constants'
import MemberNewDataSocket from '../services/websocket/MemberNewDataSocket.js'

export default {
  mixins: [componentMixin],
  data() {
    return {
      memberNewDataSocket: new MemberNewDataSocket(),
      intervalId: null
    }
  },
  methods:{
    handleMessageUser(data) {
      if (data.level === 'error') {
        this.errorToast(data.message, this.$trans('User message'))
      } else {
        this.infoToast(this.$trans('User message'), data.message)
      }
    },
    handleMessageMember(data) {
      if (data.level === 'error') {
        this.errorToast(data.message, this.$trans('Company message'))
      } else {
        this.infoToast(this.$trans('Company message'), data.message)
      }
    },
    async setupPolling() {
      const doPoll = this.isStaff || this.isSuperuser || (this.isPlanning && this.hasAccessToModule('orders'))
      if (!doPoll) {
        console.debug('no polling')
        return
      }

      setTimeout(async () => {
        await this.doFetchUnacceptedCountAndUpdateStore()
      }, 1000)

      console.debug('setting up polling: doFetchUnacceptedCountAndUpdateStore')
      this.intervalId = setInterval(async () => {
        await this.doFetchUnacceptedCountAndUpdateStore()
      }, 5*60*1000)
    },
    onNewData(data) {
      if (data.type === NEW_DATA_EVENTS.UNACCEPTED_ORDER) {
        this.doFetchUnacceptedCountAndUpdateStore()
      }

      if (data.type === NEW_DATA_EVENTS.REFRESH_INITIAL) {
        this.$store.dispatch('getInitialData')
      }
    }
  },
  async mounted() {
    await userSocket.init()
    userSocket.setOnmessageHandler(this.handleMessageUser)
    userSocket.getSocket()

    await memberSocket.init()
    memberSocket.setOnmessageHandler(this.handleMessageMember)
    memberSocket.getSocket()

    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
    this.memberNewDataSocket.setOnmessageHandler(this.onNewData)
    this.memberNewDataSocket.getSocket()

    // unaccepted orders polling
    await this.setupPolling()
  },
  async beforeDestroy() {
    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
    this.memberNewDataSocket.removeOnmessageHandler()
    this.memberNewDataSocket.removeSocket()

    if (this.intervalId) {
      console.debug('clearing polling: doFetchUnacceptedCountAndUpdateStore')
      clearInterval(this.intervalId)
    } else {
      console.debug('not clearing polling, no interval: doFetchUnacceptedCountAndUpdateStore')
    }
  },
}
</script>
