<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="isActive('materials')"
        :to="{ name: 'material-list' }">
        {{ $trans('Materials') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('material-event-types')"
        :to="{ name: 'material-event-type-list' }">
        {{ $trans('Event types') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '../utils.js'

export default {
  mixins: [componentMixin],
  data() {
    return {
      isLoaded: false,
    }
  },
  async created() {
    this.isLoaded = true
  },
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
}
</script>

<style scoped>
</style>
