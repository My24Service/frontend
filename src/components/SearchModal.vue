<template>
  <div>
    <b-modal
      id="search-modal"
      ref="search-modal"
      v-bind:title="$trans('Search')"
      @ok="doSearch"
    >
      <form ref="search-form">
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
                  id="search-query"
                  ref="searchQuery"
                  :value="value"
                  @input="handleInput"
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
  props: {
    value: {
      type: String
    },
    searchMethod: {
      type: Function
    }
  },
  methods: {
    handleInput(val) {
      this.$emit('input', val)
    },
    doSearch() {
      this.searchMethod()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    }
  },
}
</script>

<style scoped>
</style>
