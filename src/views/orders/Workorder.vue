<template>
  <div>
    <WorkorderMaintenance v-if="memberType === 'maintenance'" :uuid="uuid" />
  </div>
</template>
<script>
import WorkorderMaintenance from "./WorkorderMaintenance.vue"

export default {
  name: "Workorder",
  components: {
  	WorkorderMaintenance,
  },
	props: {
		uuid: {
			type: String
		}
	},
	data() {
		return {
			memberType: null
		}
	},
	async created() {
    this.memberType = await this.$store.dispatch('getMemberType')
	}
}
</script>
