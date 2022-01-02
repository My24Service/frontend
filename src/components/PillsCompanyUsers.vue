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
    </b-nav>
  </div>
</template>
<script>
import { componentMixin } from '@/utils'

export default {
  mixins: [componentMixin],
  data() {
    return {
      isLoaded: false,
      memberType: null,
    }
  },
  created() {
    // get member type
    this.$store.dispatch('getMemberType').then((memberType) => {
      this.memberType = memberType
      this.isLoaded = true
    })
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
