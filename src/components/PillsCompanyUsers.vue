<template>
  <div>
    <b-nav pills>
      <b-nav-item
        v-if="hasEngineers()"
        :active="isActive('engineer-users')"
        :to="{ name: 'users-engineers' }">
        {{ $trans('Engineers') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasStudents()"
        :active="isActive('student-users')"
        :to="{ name: 'users-studentusers' }">
        {{ $trans('Students') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasSales()"
        :active="isActive('sales-users')"
        :to="{ name: 'users-salesusers' }">
        {{ $trans('Sales') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasCustomers()"
        :active="isActive('customer-users')"
        :to="{ name: 'users-customerusers' }">
        {{ $trans('Customers') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('planning-users')"
        :to="{ name: 'users-planningusers' }">
        {{ $trans('Planning') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasApiUsers"
        :active="isActive('api-users')"
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
      hasApiUsers: false,
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
    hasEngineers() {
      return this.memberType === 'maintenance' && this.hasAccessToModule('company', 'engineer-users')
    },
    hasStudents() {
      return this.memberType === 'temps' && this.hasAccessToModule('company', 'student-users')
    },
    hasSales() {
      return this.hasAccessToModule('company', 'sales-users')
    },
    hasCustomers() {
      return this.hasAccessToModule('company', 'customer-users')
    },
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
}
</script>

<style scoped>
</style>
