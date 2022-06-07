<template>
  <div>
    <b-modal
      id="search-modal"
      ref="search-modal"
      v-bind:title="$trans('Search')"
      @ok="doSearch"
    >
      <form ref="search-form" @submit.stop.prevent="doSearch">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Search')"
                label-for="search-query"
              >
                <b-form-input
                  size="sm"
                  autofocus
                  v-model="query"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>
  </div>
</template>

<script>
export default {
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
