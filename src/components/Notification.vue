<template>
  <div/>
</template>
<script>
import Socket from "@/socket.js"
import { componentMixin } from '@/utils.js'

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
      if (data.type === 'new_unaccepted_order') {
        this.doFetchUnacceptedCountAndUpdateStore()
      }
    }
  },
  mounted() {
    const userPk = this.$store.getters.getUserPk
    const memberPk = this.$store.getters.getMemberPk

    Socket.setOnmessageHandlerUser(memberPk, userPk, this.handleMessageUser)
    Socket.getSocketUser(memberPk, userPk)

    Socket.setOnmessageHandlerMember(memberPk, this.handleMessageMember)
    Socket.getSocketMember(memberPk)

    Socket.getSocketMemberNewData(memberPk)
    Socket.setOnmessageHandlerMemberNewData(memberPk, this.onNewData)

    // unaccepted orders polling
    this.setupPolling()
  },
}
</script>
