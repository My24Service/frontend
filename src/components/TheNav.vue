<template>
	<div ref='nav-container' class="nav-container">
		<TheNavLoggedIn v-if="isLoggedIn" />
	</div>
</template>

<script>
import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'

export default {
  name: "TheNav",

	components: {
	  TheNavLoggedIn,
	},
}
</script>

