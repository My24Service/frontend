<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="filter.id === getCurrentFilter()"
        @click="changeFilter(filter)"
        v-for="filter in filters"
        :key="filter.id"
        variant="success"
      >
        {{ filter.name }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
export default {
  name: "OrderFilters",
  components: {},
  props: {
    filters: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getCurrentFilter() {
      if (this.$route.query.hasOwnProperty('user_filter')) {
        return parseInt(this.$route.query.user_filter)
      }
      return null
    },
    changeFilter(filter) {
      if (this.getCurrentFilter() !== filter.id) {
        const query = {
          ...this.$route.query,
          user_filter: filter.id,
          page: 1
        }
        this.$router.push({ query }).catch(e => {})
      } else {
        const query = {
          ...this.$route.query,
          page: 1
        }
        delete query.user_filter
        this.$router.push({ query }).catch(e => {})
      }
    }
  }
}
</script>

<style scoped>

</style>
