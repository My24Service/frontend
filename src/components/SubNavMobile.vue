<template>
  <div v-if="isLoaded">
    <b-nav-item
      :active="this.$route.name === 'mobile-dispatch'"
      v-if="hasDispatch"
      :to="{name: 'mobile-dispatch'}"
    >
      {{ $trans('Dispatch') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('map')"
      v-if="!hasBranches && hasMap"
      :to="{ name: 'mobile-map' }">
      {{ $trans('Map') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('orders')"
      v-if="hasOrders"
      :to="{name: 'mobile-orders'}">
      {{ $trans('Orders') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('orders-in-progress')"
      v-if="hasOrdersInProgress && memberType === 'maintenance'"
      :to="{name: 'mobile-orders-in-progress'}">
      {{ $trans('In progress') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('orders-finished')"
      v-if="hasOrdersFinished"
      :to="{name: 'mobile-orders-finished'}">
      {{ $trans('Finished') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('orders-unassigned')"
      v-if="hasOrdersUnassigned"
      :to="{name: 'mobile-orders-unassigned'}">
      {{ $trans('Unassigned') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('assigned-finished')"
      v-if="hasAssignedFinished"
      :to="{name: 'mobile-assigned-finished'}">
      {{ $trans('Assigned finished') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('trips')"
      v-if="hasTrips && memberType === 'temps'"
      :to="{name: 'mobile-trips'}">
      {{ $trans('Trips') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('trip-availability')"
      v-if="hasTripAvailability && memberType === 'temps'"
      :to="{name: 'mobile-trip-availability'}">
      {{ $trans('Trip availability') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('trip-statuscodes')"
      v-if="hasTripStatuscodes && memberType === 'temps'"
      :to="{ name: 'trip-statuscode-list' }">
      {{ $trans('Trip statuscodes') }}
    </b-nav-item>

    <!--
    <b-nav-item
      :active="isActive('timesheet')"
      v-if="hasTimesheet"
      :to="{name: 'mobile-timesheet'}">
      {{ $trans('Timesheet') }}
    </b-nav-item>
    -->

<!--    <b-nav-item-->
<!--      :active="isActive('assignedorder-materials')"-->
<!--      v-if="hasAssignedorderMaterials"-->
<!--      :to="{name: 'assignedorder-materials'}">-->
<!--      {{ $trans('Materials') }}-->
<!--    </b-nav-item>-->
  </div>
</template>

<script>


export default {
  name: "OrdersSubNav",

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
      return parts[2] === item
    }
  },
  computed: {
    hasMap() {
      const notHasMap = ['viavandalen']
      return notHasMap.indexOf(this.$store.getters.getMemberCompanycode) === -1
    },
    hasDispatch() {
      return this.hasAccessToModule('mobile', 'dispatch')
    },
    hasOrders() {
      return this.hasAccessToModule('mobile', 'orders')
    },
    hasOrdersInProgress() {
      return this.hasAccessToModule('mobile', 'orders-in-progress')
    },
    hasOrdersFinished() {
      return this.hasAccessToModule('mobile', 'orders-finished')
    },
    hasOrdersUnassigned() {
      return this.hasAccessToModule('mobile', 'orders-unassigned')
    },
    hasAssignedFinished() {
      return this.hasAccessToModule('mobile', 'assigned-finished')
    },
    hasTrips() {
      return this.hasAccessToModule('mobile', 'trips')
    },
    hasTripAvailability() {
      return this.hasAccessToModule('mobile', 'trip-availability')
    },
    hasTripStatuscodes() {
      return this.hasAccessToModule('mobile', 'trip-statuscodes')
    },
  },
}
</script>

<style scoped>
</style>
