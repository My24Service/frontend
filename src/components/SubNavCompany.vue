<template>
  <div v-if="isLoaded">
    <b-nav>
      <b-nav-item
        v-if="!isBranchEmployee"
        :active="isActive('dashboard')"
        :to="{ name: 'company-dashboard' }">
        {{ $trans('Dashboard') }}
      </b-nav-item>
      <b-nav-item
        v-if="isBranchEmployee"
        :active="isActive('employee-dashboard')"
        :to="{ name: 'employee-dashboard' }">
        {{ $trans('Dashboard') }}
      </b-nav-item>
      <b-nav-item
        v-if="!hasBranches"
        :active="isActive('time-registration')"
        :to="{ name: 'company-time-registration' }">
        {{ $trans('Time registration') }}
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
        v-if="hasPartners && (isPlanning || isAdmin)"
        :to="{ name: 'company-partners-active' }">
        {{ $trans('Partners') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('branches')"
        v-if="hasBranches && (isPlanning || isAdmin)"
        :to="{ name: 'company-branches' }">
        {{ $trans('Branches') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('my-branch')"
        v-if="hasBranches && (isPlanning || isAdmin)"
        :to="{ name: 'company-my-branch-view' }">
        {{ $trans('My branch') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'maintenance' && (isPlanning || isAdmin)"
        :active="isActive('settings')"
        :to="{ name: 'company-settings' }">
        {{ $trans('Settings') }}
      </b-nav-item>
      <b-nav-item
        v-if="isPlanning || isAdmin"
        :active="isActive('company')"
        :to="{ name: 'company-info' }">
        {{ $trans('Info') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasBranches && isBranchEmployee"
        :active="isActive('branch')"
        :to="{ name: 'company-my-branch' }">
        {{ $trans('My branch') }}
      </b-nav-item>
      <b-nav-item
        v-if="isPlanning || isAdmin"
        :active="isActive('pictures')"
        :to="{ name: 'company-pictures' }">
        {{ $trans('Pictures') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasStatuscodes && (isPlanning || isAdmin)"
        :active="isActive('statuscodes')"
        :to="{ name: 'company-statuscodes' }">
        {{ $trans('Statuscodes') }}
      </b-nav-item>
      <b-nav-item
        v-if="isPlanning || isAdmin"
        :active="isActive('templates')"
        :to="{ name: 'company-templates' }">
        {{ $trans('Templates') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('import')"
        v-if="isStaff || isSuperuser"
        :to="{ name: 'company-import-list' }">
        {{ $trans('Import') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('budgets')"
        v-if="hasBranches && !isBranchEmployee"
        :to="{ name: 'company-budgets' }">
        {{ $trans('Budgets') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('budgets')"
        v-if="hasBranches && isBranchEmployee"
        :to="{ name: 'company-my-budgets' }">
        {{ $trans('My budgets') }}
      </b-nav-item>
      <b-nav-item
        v-if="isPlanning || isAdmin"
        :active="isActive('activity')"
        :to="{ name: 'company-activity' }">
        {{ $trans('Activity') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('connector-gripp')"
        v-if="hasGripp"
        :to="{ name: 'company-connector-gripp' }">
        {{ $trans('Gripp') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script>
import {useMainStore} from "@/stores/main";
import componentMixin from "@/mixins/common";

export default {
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
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
    this.memberType = this.mainStore.getMemberType
    this.isLoaded = true
  },
  computed: {
    hasStatuscodes() {
      const has = ['demo', 'viavandalen']
      return has.indexOf(this.mainStore.getMemberCompanycode) !== -1;
    },
    getToRouteMaintenanceUsers() {
      if (this.hasAccessToModule('company', 'engineer-users') && !this.hasBranches) {
        return { name: 'users-engineers' }
      }

      if (this.hasAccessToModule('company', 'sales-users') && !this.hasBranches) {
        return { name: 'users-salesusers' }
      }

      if (this.hasAccessToModule('company', 'customer-users') && !this.hasBranches) {
        return { name: 'users-customerusers' }
      }

      if (this.hasBranches && this.isBranchEmployee) {
        return { name: 'users-employees' }
      }

      return { name: 'users-planningusers' }
    },
    getToRouteTempsUsers() {
      if (this.hasAccessToModule('company', 'student-users')) {
        return { name: 'users-studentusers' }
      }

      return { name: 'users-planningusers' }
    },
    hasPartners() {
      return this.hasAccessToModule('company', 'partners')
    },
    hasGripp() {
      return this.hasAccessToModule('company','connector-gripp');
    }
  },
}
</script>

<style scoped>
</style>
