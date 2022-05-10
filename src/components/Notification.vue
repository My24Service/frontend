<template>
  <div/>
</template>
<script>
import Socket from "@/socket.js"
import { componentMixin } from '@/utils.js'
import userSocket from '@/services/websocket/UserSocket.js'
import memberSocket from '@/services/websocket/MemberSocket.js'
import memberNewDataSocket from '@/services/websocket/MemberNewDataSocket.js'

export default {
  mixins: [componentMixin],
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

      setInterval(async () => {
        await this.doFetchUnacceptedCountAndUpdateStore()
      }, 5*60*1000)
    },
    onNewData(data) {
      if (data.type === 'unaccepted_order_event') {
        this.doFetchUnacceptedCountAndUpdateStore()
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

    await memberNewDataSocket.init('unaccepted_orders')
    memberNewDataSocket.setOnmessageHandler(this.onNewData)
    memberNewDataSocket.getSocket()

    // unaccepted orders polling
    this.setupPolling()
  },
}
</script>
