<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="statuscode.statuscode === currentFilter"
        @click="changeFilter(statuscode)"
        v-for="statuscode in statuscodes"
        :key="statuscode.id"
      >
        {{ statuscode.statuscode }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
export default {
  name: "OrderFilters",
  components: {},
  props: {
    statuscodes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentFilter: null
    }
  },
  methods: {
    changeFilter(statuscode) {
      if (this.currentFilter !== statuscode.statuscode) {
        this.currentFilter = statuscode.statuscode
        this.$emit('set-filter', this.currentFilter)
      } else {
        this.$emit('remove-filter', this.currentFilter)
        this.currentFilter = null
      }
    }
  }
}
</script>

<style scoped>

</style>
