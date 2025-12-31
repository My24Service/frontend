<template>
	<div>
    <b-link @click="isOpen = !isOpen">
      <div class="section-header bg-primary">
        <h4>{{ title }}</h4>
        <div class="section-header-icon float-right h4 mb-2">
          <IBiArrowUpShort v-if="isOpen"></IBiArrowUpShort>
          <IBiArrowDownShort v-if="!isOpen"></IBiArrowDownShort>
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
    },
  },
  data() {
  	return {
  		isOpen: false
  	}
  },
  methods: {
    toggleOpen() {
      this.isOpen = !this.isOpen
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
  color: #fff;
}
div.section a {
  text-decoration: none;
}
div.section-header-icon {
  margin-top: -34px;
}
</style>
