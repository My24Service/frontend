<template>
	<div ref='nav-container' class="nav-container">
		<TheNavLoggedIn v-if="isLoggedIn" />
	</div>
</template>

<script>
import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'
import componentMixin from "@/mixins/common";

export default {
  name: "TheNav",
  mixins: [componentMixin],
	components: {
	  TheNavLoggedIn,
	},
}
</script>

