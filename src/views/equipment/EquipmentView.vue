<template>
  <component :is="activeComponent" :pk="pk" />
</template>

<script>
import EquipmentViewShltr from './equipment_view/EquipmentViewShltr.vue'
import EquipmentViewDefault from './equipment_view/EquipmentViewDefault.vue'

export default {
  name: 'EquipmentView',
  props: {
    pk: {
      type: [String, Number],
      default: null
    }
  },
  components: {
    EquipmentViewShltr,
    EquipmentViewDefault
  },
  computed: {
    activeComponent() {
      // Check if the HTML element has the shltr theme class
      if (document.documentElement.classList.contains('theme-shltr')) {
        return 'EquipmentViewShltr';
      }
      return 'EquipmentViewDefault';
    }
  }
}
</script>
