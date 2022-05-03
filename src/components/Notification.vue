<template>
  <div/>
</template>
<script>
import socket from "@/socket.js"

export default {
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
  },
  mounted() {
    const userPk = this.$store.getters.getUserPk
    const memberPk = this.$store.getters.getMemberPk

    socket.setOnmessageHandlerUser(memberPk, userPk, this.handleMessageUser)
    socket.getSocketUser(memberPk, userPk)

    socket.setOnmessageHandlerMember(memberPk, this.handleMessageMember)
    socket.getSocketMember(memberPk)
  },
}
</script>
