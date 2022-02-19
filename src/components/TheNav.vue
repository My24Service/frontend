<template>
	<div ref='nav-container'>
		<TheNavNotLoggedIn v-if="!isLoggedIn" />
		<TheNavLoggedIn v-if="isLoggedIn" />
	</div>
</template>

<script>
import { componentMixin } from '@/utils.js'
import TheNavNotLoggedIn from "@/components/TheNavNotLoggedIn.vue"
import TheNavLoggedIn from "@/components/TheNavLoggedIn.vue"

export default {
  name: "empty",
  mixins: [componentMixin],
	components: {
	  TheNavNotLoggedIn,
	  TheNavLoggedIn,
	},
}
</script>

<style scoped>
</style>
