<template>
  <div v-if="isLoaded">
    <b-nav>
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
        v-if="hasPartners"
        :to="{ name: 'company-partners-active' }">
        {{ $trans('Partners') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('branches')"
        v-if="hasBranches"
        :to="{ name: 'company-branches' }">
        {{ $trans('Branches') }}
      </b-nav-item>
      <b-nav-item
        v-if="memberType === 'maintenance'"
        :active="isActive('settings')"
        :to="{ name: 'company-settings' }">
        {{ $trans('Settings') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('company')"
        :to="{ name: 'company-info' }">
        {{ $trans('Info') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('pictures')"
        :to="{ name: 'company-pictures' }">
        {{ $trans('Pictures') }}
      </b-nav-item>
      <b-nav-item
        v-if="hasStatuscodes"
        :active="isActive('statuscodes')"
        :to="{ name: 'company-statuscodes' }">
        {{ $trans('Statuscodes') }}
      </b-nav-item>
      <b-nav-item
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
        v-if="hasBranches"
        :to="{ name: 'company-budgets' }">
        {{ $trans('Budgets') }}
      </b-nav-item>
      <b-nav-item
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

export default {
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
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
    this.mainStore.getMemberType().then((memberType) => {
      this.memberType = memberType
      this.isLoaded = true
    })
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

      return { name: 'users-planningusers' }
    },
    getToRouteTempsUsers() {
      if (this.hasAccessToModule('company', 'student-users')) {
        return { name: 'users-studentusers' }
      }

      return { name: 'users-planningusers' }
    },
    hasBranches() {
      return this.hasBranches()
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
