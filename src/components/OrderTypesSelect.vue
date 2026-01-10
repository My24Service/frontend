<template>
  <BFormSelect
    v-if="this.orderTypes.length > 0"
    v-model="orderType"
    :options="orderTypes"
  ></BFormSelect>
</template>

<script>
import {useMainStore} from "@/stores/main";
import {computed} from "vue";

export default {
  name: "OrderTypesSelect",
  setup(props, { emit }) {
    const orderType = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    const mainStore = useMainStore()

    return {
      mainStore,
      orderType
    }
  },
  emits: ['update:modelValue'],
  props: {
    includeAll: {
      type: [Boolean],
      default: false
    },
    modelValue: {
      type: String
    },
  },
  data() {
    return {
      orderTypes: []
    }
  },
  mounted() {
    const order_types = this.mainStore.getOrderTypes
    this.orderTypes = this.includeAll ? ['all', ...order_types] : order_types
    this.orderType = this.modelValue !== null ? this.modelValue : this.orderTypes[0]
  }
}
</script>

<style scoped>
</style>
