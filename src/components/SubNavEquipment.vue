<template>
  <div>
    <b-nav>
      <b-nav-item
        :active="isActive('equipment')"
        v-if="hasEquipment"
        :to="{ name: 'equipment-equipment-list' }">
        {{ $trans('Equipment') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('locations')"
        v-if="hasEquipmentLocations"
        :to="{ name: 'equipment-location-list' }">
        {{ $trans('Locations') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('buildings')"
        v-if="hasEquipmentBuildings"
        :to="{ name: 'equipment-building-list' }">
        {{ $trans('Buildings') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>


export default {
  name: 'SubNavEquipment',

  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
  computed: {
    hasEquipment() {
      return this.hasAccessToModule('equipment', 'equipment')
    },
    hasEquipmentLocations() {
      return this.hasAccessToModule('equipment', 'locations')
    },
    hasEquipmentBuildings() {
      return this.hasAccessToModule('equipment', 'buildings')
    },
  },
}
</script>

<style scoped>
</style>
