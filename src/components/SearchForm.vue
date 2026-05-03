<template>
  <form ref="search-form" @submit.stop.prevent="doSearch">
      <BFormInput
        size="sm"
        v-model="query"
        :placeholder="placeholderText"
        @keyup="checkInput"
      ></BFormInput>
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
    checkInput() {
      if(!this.query) {
        this.doSearch()
      }
    },
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
