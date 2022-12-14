<template>
  <div>
    <b-nav pills>
      <b-nav-item
        v-if="memberType === 'maintenance'"
        :active="isActive('engineers')"
        :to="{ name: 'users-engineers' }">
        {{ $trans('Engineers') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'temps'"
        :active="isActive('studentusers')"
        :to="{ name: 'users-studentusers' }">
        {{ $trans('Students') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('salesusers')"
        :to="{ name: 'users-salesusers' }">
        {{ $trans('Sales') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('customerusers')"
        :to="{ name: 'users-customerusers' }">
        {{ $trans('Customers') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('planningusers')"
        :to="{ name: 'users-planningusers' }">
        {{ $trans('Planning') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasApiUsers"
        :active="isActive('apiusers')"
        :to="{ name: 'users-apiusers' }">
        {{ $trans('API') }}
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
      memberType: null,
      hasApiUsers: false
    }
  },
  async created() {
    // check api users
    this.hasApiUsers = await this.$store.getters.getMemberHasApiUsers

    // get member type
    this.memberType = await this.$store.dispatch('getMemberType')

    this.isLoaded = true
  },
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[3] === item
    }
  },
}
</script>

<style scoped>
</style>
