<template>
	<div ref='nav-container' class="nav-container">
		<TheNavLoggedIn v-if="isLoggedIn" />
		<TheNavLoggedOut v-if="!isLoggedIn" />
	</div>
</template>

<script>
import { componentMixin } from '@/utils.js'
import TheNavLoggedOut from '@/components/TheNavLoggedOut.vue'
import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'

export default {
  name: "TheNav",
  mixins: [componentMixin],
	components: {
	  TheNavLoggedOut,
	  TheNavLoggedIn,
	},
}
</script>

