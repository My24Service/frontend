<template>
  <div v-if="isLoaded">
    <b-nav tabs>
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
        :active="isActive('users')"
        :to="{ name: 'users-engineers' }">
        {{ $trans('Users') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'temps'"
        :active="isActive('users')"
        :to="{ name: 'users-studentusers' }">
        {{ $trans('Users') }}
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
    </b-nav>
  </div>
</template>

<script>
import { componentMixin } from '@/utils.js'

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
      return parts[2] === item
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
    hasDashBoard() {
      return this.hasAccessToModule('company', 'dashboard')
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
      return true
    }
  },
}
</script>

<style scoped>
</style>
