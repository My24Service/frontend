<template>
  <component :is="activeComponent" :pk="pk" />
</template>

<script>
import LocationViewShltr from './location_view/LocationViewShltr.vue'
import LocationViewDefault from './location_view/LocationViewDefault.vue'

export default {
  name: 'LocationView',
  props: {
    pk: {
      type: [String, Number],
      default: null
    }
  },
  components: {
    LocationViewShltr,
    LocationViewDefault
  },
  computed: {
    activeComponent() {
      // Check if the HTML element has the shltr theme class
      if (document.documentElement.classList.contains('theme-shltr')) {
        return 'LocationViewShltr';
      }
      return 'LocationViewDefault';
    }
  }
}
</script>