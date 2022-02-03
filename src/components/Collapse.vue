<template>
	<div>
    <b-link @click="isOpen = !isOpen">
      <div class="section-header">
        <h4>{{ title }}</h4>
        <div class="section-header-icon float-right h4 mb-2">
          <b-icon-arrow-up-short v-if="isOpen"></b-icon-arrow-up-short>
          <b-icon-arrow-down-short v-if="!isOpen"></b-icon-arrow-down-short>
        </div>
      </div>
    </b-link>
    <collapse-transition>
      <div v-show="isOpen">
      	<slot />
      </div>
    </collapse-transition>
	</div>
</template>

<script>
import { CollapseTransition } from '@ivanv/vue-collapse-transition'
export default {
  components: {
    CollapseTransition
  },
  name: "Collapse",
  props: {
    title: {
      type: [String],
    }
  },
  data() {
  	return {
  		isOpen: false
  	}
  }
}
</script>

<style scoped>
div.section {
  padding-bottom: 20px;
}
div.section-header {
  padding: 4px;
  background-color: #ff9933;
  color: #fff;
}
div.section a {
  text-decoration: none;
}
div.section-header-icon {
  margin-top: -34px;
}
</style>
