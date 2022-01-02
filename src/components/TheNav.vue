<template>
	<div ref='nav-container'>
		<TheNavNotLoggedIn v-if="!isLoggedIn" />
		<TheNavLoggedIn v-if="isLoggedIn" />
	</div>
</template>

<script>
import TheNavNotLoggedIn from "@/components/TheNavNotLoggedIn";
import TheNavLoggedIn from "@/components/TheNavLoggedIn";
import { componentMixin } from '@/utils';

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
