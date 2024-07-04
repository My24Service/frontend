<template>
  <div>
    <b-nav pills>
      <b-nav-item
        :active="filter.id === getCurrentFilter()"
        @click="changeFilter(filter)"
        v-for="filter in filters"
        :key="filter.id"
      >
        {{ filter.name }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
export default {
  name: "UserFilters",
  components: {},
  props: {
    route_name: {
      type: String,
      default: null
    },
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
        this.$router.push({name: this.route_name, query }).catch(e => {})
      } else {
        const query = {
          ...this.$route.query,
          page: 1
        }
        delete query.user_filter
        this.$router.push({ name:this.route_name, query }).catch(e => {})
      }
    }
  }
}
</script>

<style scoped>

</style>
