<template>
  <div>
    <WorkorderMaintenance v-if="memberType === 'maintenance'" :uuid="uuid" />
    <WorkorderTemps v-if="memberType === 'temps'" :uuid="uuid" />
  </div>
</template>
<script>
import WorkorderMaintenance from "./WorkorderMaintenance.vue"
import WorkorderTemps from "./WorkorderTemps.vue"

export default {
  name: "Workorder",
  components: {
  	WorkorderMaintenance,
  	WorkorderTemps
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
