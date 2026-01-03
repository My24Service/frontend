<template>
  <div>
    <WorkorderMaintenance v-if="memberType === 'maintenance'" :uuid="uuid" />
  </div>
</template>
<script>
import WorkorderMaintenance from "./WorkorderMaintenance.vue"
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      mainStore
    }
  },
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
    this.memberType = await this.mainStore.getMemberType()
	}
}
</script>
