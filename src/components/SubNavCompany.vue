<template>
  <div v-if="isLoaded">
    <b-nav>
      <b-nav-item
        :active="isActive('dashboard')"
        v-if="hasDashBoard"
        :to="{ name: 'company-dashboard' }">
        {{ $trans('Dashboard') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('company')"
        v-if="hasCompany"
        :to="{ name: 'company-info' }">
        {{ $trans('Company') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'maintenance'"
        :active="isActive('settings')"
        :to="{ name: 'company-settings' }">
        {{ $trans('Settings') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'maintenance'"
        :active="isActive('users')"
        :to="getToRouteMaintenanceUsers">
        {{ $trans('People') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'temps'"
        :active="isActive('users')"
        :to="getToRouteTempsUsers">
        {{ $trans('People') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('partners')"
        v-if="hasPartners"
        :to="{ name: 'company-partners-active' }">
        {{ $trans('Partners') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('activity')"
        v-if="hasActivity"
        :to="{ name: 'company-activity' }">
        {{ $trans('Activity') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('pictures')"
        v-if="hasPictures"
        :to="{ name: 'company-pictures' }">
        {{ $trans('Pictures') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('workhours')"
        v-if="hasWorkhours"
        :to="{ name: 'company-workhours' }">
        {{ $trans('Work hours') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('time-registration')"
        v-if="hasTimeRegistration"
        :to="{ name: 'company-time-registration' }">
        {{ $trans('Time registration') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('branches')"
        v-if="hasBranches"
        :to="{ name: 'company-branches' }">
        {{ $trans('Branches') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('budgets')"
        v-if="hasBranches"
        :to="{ name: 'company-budgets' }">
        {{ $trans('Budgets') }}
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
    }
  },
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item || parts[2].indexOf(item) !== -1
    }
  },
  created() {
    // get member type
    this.$store.dispatch('getMemberType').then((memberType) => {
      this.memberType = memberType
      this.isLoaded = true
    })
  },
  computed: {
    getToRouteMaintenanceUsers() {
      if (this.hasAccessToModule('company', 'engineer-users')) {
        return { name: 'users-engineers' }
      }

      if (this.hasAccessToModule('company', 'sales-users')) {
        return { name: 'users-salesusers' }
      }

      if (this.hasAccessToModule('company', 'customer-users')) {
        return { name: 'users-customerusers' }
      }

      return { name: 'users-planningusers' }
    },
    getToRouteTempsUsers() {
      if (this.hasAccessToModule('company', 'student-users')) {
        return { name: 'users-studentusers' }
      }

      return { name: 'users-planningusers' }
    },
    hasBranches() {
      return this.$store.getters.getMemberHasBranches
    },
    hasDashBoard() {
      return this.hasAccessToModule('company', 'dashboard')
    },
    hasTimeRegistration() {
      return this.hasAccessToModule('company', 'time-registration')
    },
    hasCompany() {
      return true
    },
    hasUsers() {
      return true
    },
    hasPartners() {
      return this.hasAccessToModule('company', 'partners')
    },
    hasActivity() {
      return true
    },
    hasPictures() {
      return true
    },
    hasWorkhours() {
      return this.hasAccessToModule('company', 'workhours')
    }
  },
}
</script>

<style scoped>
</style>
