<template>
  <div v-if="isLoaded" class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <router-link :to="{name: 'order-list'}">Orders</router-link> / 
          <span>#<strong>{{ pk }}</strong></span>
        </h3>
        <div class="flex-columns">
          <router-link class="btn button" :to="{name:'order-edit', pk: pk}">
            <b-icon icon="pencil" font-scale="0.95"></b-icon> &nbsp; {{ $trans('Edit order') }}
          </router-link>
        </div>
      </div>
    </header>
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

export default {
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
    this.memberType = await this.$store.dispatch('getMemberType')
    this.isLoaded = true
  },
}
</script>
