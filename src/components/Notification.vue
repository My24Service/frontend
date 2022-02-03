<template>
	<div/>
</template>
<script>
import socket from "@/socket"

export default {
	methods:{
    handleMessageUser(data) {
			this.flashMessage.show({
        status: data.level,
        title: this.$trans('User message'),
        message: data.message
      })
    },
    handleMessageMember(data) {
      this.flashMessage.show({
        status: data.level,
        title: this.$trans('Company message'),
        message: data.message
      })
    },
	},
	mounted() {
    const userPk = this.$store.getters.getUserPk
    const memberPk = this.$store.getters.getMemberPk

    socket.setOnmessageHandlerUser(userPk, this.handleMessageUser)
  	socket.getSocketUser(userPk)

    socket.setOnmessageHandlerMember(memberPk, this.handleMessageMember)
    socket.getSocketMember(memberPk)
	},
}
</script>
