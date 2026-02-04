<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Choose product')"
    ok-only
    @ok="hide"
  >
    <b-overlay :show="isLoading" rounded="sm">
      <div>
        <b-input
          v-model="query"
        />
        <BButton
          @click="doSearch"
        />
      </div>

      <b-table
        id="products-table"
        small
        :busy="isLoading"
        :fields="fields"
        :items="products"
        :hover="true"
        responsive="md"
        tbody-tr-class="table-row"
        @row-clicked="onRowClicked"
      >
      </b-table>
    </b-overlay>
  </b-modal>
</template>
<script>
import componentMixin from "@/mixins/common";
import {TeamleaderService} from "@/models/company/Teamleader";
import {BInput, useToast} from "bootstrap-vue-next";
import {errorToast} from "@/utils";

export default {
  name: "ProductChooser",
  mixins: [componentMixin],
  components: {BInput},
  props: {
    'name_in': String
  },
  emits: [
    'product-chosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      products: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
      ],
      query: null
    }
  },
  setup() {
    const {create} = useToast()
    this.query = this.name_in

    return {
      create,
    }
  },
  methods: {
    async doSearch() {
      await this.loadData()
    },
    onRowClicked(item, _index, _event) {
      this.$emit('product-chosen', item)
    },
    async loadData() {
      this.isLoading = true
      try {
        const response = await this.service.productList(this.query)
        this.products = response.data
        this.isLoading = false

      } catch(error) {
        console.log('error fetching products', error)
        errorToast(this.create, this.$trans('Error fetching products'))
        this.isLoading = false
      }
    },
    async show() {
      await this.$refs['modal'].show()
      await this.loadData()
    },
    hide() {
      this.$refs['modal'].hide()
    }
  }
}
</script>
<style scoped>

</style>
