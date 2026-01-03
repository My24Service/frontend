<template>
  <div v-if="isLoaded">

    <OrderViewMaintenance
      v-if="memberType === 'maintenance'"
      v-bind:pk="pk"
      v-bind:uuid="uuid"
      v-bind:past="past"
    />
    <OrderViewTemps
      v-if="memberType === 'temps'"
      v-bind:uuid="uuid"
      v-bind:pk="pk"
      v-bind:past="past"
    />
  </div>
</template>

<script>
import OrderViewMaintenance from "./OrderViewMaintenance.vue"
import OrderViewTemps from "./OrderViewTemps.vue"
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      mainStore
    }
  },
  name: "OrderView",
  data() {
    return {
      isLoaded: false,
      memberType: null,
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    uuid: {
      type: [String],
      default: null
    },
    past: {
      type: [Boolean],
      default: false
    },
  },
  components: {
    OrderViewMaintenance,
    OrderViewTemps,
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    }
  },
  async created() {
    // get member type
    this.memberType = await this.mainStore.getMemberType()
    this.isLoaded = true
  },
}
</script>
