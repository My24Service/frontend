<template>
  <div class="my24-pagination">
    <span class="count-section">
      {{ displayOrderRange }}
    </span>
    <span class="pagination-section">
      <b-pagination
        v-if="this.model.count > 20"
        class="pt-4"
        v-model="currentPage"
        :total-rows="this.model.count"
        :per-page="this.model.perPage"
        aria-controls="order-table"
      ></b-pagination>
    </span>
  </div>
</template>

<script>
export default {
  name: "PaginationComponent",
  props: {
    model: {
      type: [Object],
    },
    model_name: {
      type: [String],
    },
  },
  data() {
    return {
      currentPage: this.model.currentPage,
    }
  },
  watch: {
    currentPage: function(val) {
      const query = {
        ...this.$route.query,
        page: val
      }
      this.$router.push({ query }).catch(e => {})
    }
  },
  computed: {
    displayOrderRange() {
      const currentPage = parseInt(this.currentPage)
      if (this.model.count > this.model.perPage) {
        const start = ((currentPage - 1) * this.model.perPage) + 1;
        const end = start + this.model.perPage < this.model.count ? start + this.model.perPage -1 : this.model.count

        return `${ this.model_name } ${ start } - ${ end }, ${ this.$trans('total') } ${ this.model.count }`
      } else {
        const start = this.model.count > 0 ? 1 : 0
        const end = this.model.count

        return `${ this.model_name } ${start} - ${end} (${this.model.perPage} ${ this.$trans('per page') })`
      }
    }
  },
}
</script>

<style scoped>
.count-section {
}
.pagination-section {
}
</style>
