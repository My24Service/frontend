<template>
  <component :is="activeComponent" :pk="pk" />
</template>

<script>
import EquipmentViewShltr from './equipment_view/EquipmentViewShltr.vue'
import EquipmentViewDefault from './equipment_view/EquipmentViewDefault.vue'
import {isShltrTheme} from '@/theme'

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
      return isShltrTheme ? 'EquipmentViewShltr' : 'EquipmentViewDefault';
    }
  }
}
</script>
