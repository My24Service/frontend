<template>
  <div class="my24-pagination">
    <span class="count-section">
      {{  this.model_name }}
      <strong><b>{{  currentItemsStart }}</b> - <b>{{  currentItemsEnd }}</b></strong>
      / {{  totalItems }}
    </span>
    <br>
    <span class="pagination-section">
      <b-pagination
        v-if="this.model.count > this.model.perPage"
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
      currentItemsStart: 0,
      currentItemsEnd: 0,
      totalItems: this.model.count,
      currentPage: this.model.currentPage,
    }
  },

  watch: {
    currentPage: function(val) {
      const query = {
        ...this.$route.query,
        ...this.model.queryArgs,
        page: val,
      }

      this.$router.push({ query }).catch(e => {})
    }
  },
  created() {
    this.calculateOrderRange();
  },
  methods: {
    calculateOrderRange() {
      const currentPage = parseInt(this.currentPage)
      let start = 1;
      let end = 2;
      if (this.model.count > this.model.perPage) {
        start = ((currentPage - 1) * this.model.perPage) + 1;
        end = start + this.model.perPage <= this.model.count ? start + this.model.perPage -1 : this.model.count
      } else {
        start = this.model.count > 0 ? 1 : 0
        end = this.model.count
      }
      this.currentItemsStart = start;
      this.currentItemsEnd = end;
    }
  },
}
</script>
