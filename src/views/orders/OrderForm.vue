<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3 v-if="!pk">
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <router-link :to="{name:'order-list'}">Orders</router-link> / 
          <strong>new order</strong>
        </h3>
        <h3 v-if="pk">
          <b-icon icon="clipboard"></b-icon>
          <router-link :to="{name:'order-list'}">Orders</router-link> / 
          <router-link :to="{name: 'order-view', pk:pk}">#<strong>{{ pk }}</strong></router-link>
         / edit
        </h3>
      </div>
    </header>
    <div class="app-detail">
      <OrderFormMaintenance
        v-if="memberType === 'maintenance'"
        :pk="pk"
        :unaccepted="unaccepted"
        :maintenance="maintenance"
      />
      <OrderFormTemps v-if="memberType === 'temps'" :pk="pk" />
    </div>
  </div>
</template>

<script>
import OrderFormMaintenance from "./OrderFormMaintenance.vue"
import OrderFormTemps from "./OrderFormTemps.vue"

export default {
  name: "OrderForm",
  data() {
    return {
      memberType: null,
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    unaccepted: {
      type: [Boolean],
      default: false
    },
    maintenance: {
      type: [Boolean],
      default: false
    },
  },
  components: {
    OrderFormMaintenance,
    OrderFormTemps,
  },
  async created() {
    this.memberType = await this.$store.dispatch('getMemberType')
  },
}
</script>
