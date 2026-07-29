<template>
  <component :is="activeComponent" :pk="pk" />
</template>

<script>
import LocationViewShltr from './location_view/LocationViewShltr.vue'
import LocationViewDefault from './location_view/LocationViewDefault.vue'
import {isShltrTheme} from '@/theme'

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
      return isShltrTheme ? 'LocationViewShltr' : 'LocationViewDefault';
    }
  }
}
</script>