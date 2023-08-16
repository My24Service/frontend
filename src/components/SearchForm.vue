<template>  
  <form ref="search-form" @submit.stop.prevent="doSearch">
      <b-form-input
        size="sm"
        autofocus
        v-model="query"
        :placeholder="placeholderText"
      ></b-form-input>
      
  </form>
</template>

<script>
export default {
  props: {
    placeholderText: String || undefined
  },
  data() {
    return {
      query: null
    }
  },
  methods: {
    doSearch() {
      this.$emit('do-search', this.query)
    },
    show() {
      this.$refs['search-modal'].show()
    },
    hide() {
      this.$refs['search-modal'].hide()
    }
  },
}
</script>

<style scoped>
</style>
