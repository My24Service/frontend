<template>
  <b-modal
    id="modal"
    ref="modal"
    title="Kies product"
    ok-only
    @ok="hide"
  >
    <form ref="search-form" @submit.stop.prevent="loadData">
      <b-container fluid>
        <b-row>
          <b-col cols="12">
            <b-form-group
              label="Zoek"
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
        <b-row>
          <b-col cols="12">
            <b-table
              id="documents-table"
              small
              :busy="isLoading"
              :fields="fields"
              :items="documents"
              :hover="true"
              responsive="md"
              tbody-tr-class="tr-pointer"
              @row-clicked="onRowClicked"
            >
            </b-table>
          </b-col>
        </b-row>
      </b-container>
    </form>

  </b-modal>
</template>
<script>
import {TeamleaderService} from "@/models/company/Teamleader";
import {useToast} from "bootstrap-vue-next";
import {errorToast} from "@/utils";
import componentMixin from "@/mixins/common";
import {useLoading} from "vue-loading-overlay";

export default {
  name: "ProductChooser",
  mixins: [componentMixin],
  components: {},
  props: {},
  emits: [
    'product-chosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      products: [],
      fields: [
        {key: 'name', label: 'Naam'},
      ],
      query: null
    }
  },
  setup() {
    const {create} = useToast()
    const loading = useLoading()

    return {
      create,
      loading
    }
  },
  methods: {
    onRowClicked(item, _index, _event) {
      this.$emit('product-chosen', item)
    },
    async loadData() {
      const loader = this.loading.show()
      try {
        this.products = await this.service.fetchProducts(this.query)
        loader.hide()
      } catch(error) {
        console.error('error fetching products', error)
        errorToast(this.create,'Fout bij het ophalen van de producten')
        loader.hide()
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
