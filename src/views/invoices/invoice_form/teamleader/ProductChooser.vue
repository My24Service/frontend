<template>
  <b-modal
    id="modal"
    ref="modal"
    title="Kies product"
    ok-only
    @ok="hide"
  >
    <div v-if="!showForm">
      <b-row>
        <b-col cols="10">
          <b-input
            v-model="query"
          />
        </b-col>
        <b-col cols="2">
          <BButton
            @click="doSearch"
          >Zoeken</BButton>
        </b-col>
      </b-row>

      <b-table
        id="products-table"
        small
        :fields="fields"
        :items="products"
        :hover="true"
        responsive="md"
        tbody-tr-class="table-row"
        @row-clicked="onRowClicked"
      >
      </b-table>
      <div class='flex-columns align-items-center justify-content-center'>
        <BButton
          @click="newTeamleaderProduct"
          variant="primary"
          >Voeg nieuw teamleader product toe</BButton>
      </div>
    </div>
    <div v-else>
      <h3>Nieuw teamleader product</h3>
      <form v-if="product">
        <BFormGroup
          label="Naam"
          label-for="name-input"
          invalid-feedback="Naam is vereist"
          :state="isSubmitClicked ? !v$.product.name.$error : null"
        >
          <BFormInput
            id="name-input"
            :autofocus="true"
            v-model="product.name"
            :state="isSubmitClicked ? !v$.product.name.$error : null"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          label="Code"
          label-for="code-input"
        >
          <BFormInput
            id="code-input"
            v-model="product.code"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          label="Omschrijving"
          label-for="description-input"
        >
          <BFormInput
            id="description-input"
            v-model="product.description"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          label="Inkoopprijs"
          label-for="purchase_price-input"
        >
          <PriceInput
            id="purchase_price-input"
            v-model="product.purchase_price"
            currency="EUR"
          />
        </BFormGroup>
        <BFormGroup
          label="Verkoopprijs"
          label-for="selling_price-input"
        >
          <PriceInput
            id="selling_price-input"
            v-model="product.selling_price"
            currency="EUR"
          ></PriceInput>
        </BFormGroup>
        <BFormGroup
          label="Categorie"
          label-for="categorie"
          invalid-feedback="Categorie is verplicht"
          :state="isSubmitClicked ? !v$.product.product_category_id.$error : null"
        >
          <BFormSelect
            v-model="product.product_category_id"
            :options="productCategories"
            size="sm"
            :state="isSubmitClicked ? !v$.product.product_category_id.$error : null"
          ></BFormSelect>
        </BFormGroup>
        <div class='flex-columns align-items-center justify-content-center'>
          <BButton type="submit">Verstuur</BButton>
        </div>
      </form>
    </div>

  </b-modal>
</template>
<script>
import {BInput, useToast} from "bootstrap-vue-next";
import {errorToast} from "@/utils";
import {useLoading} from "vue-loading-overlay";
import {useVuelidate} from "@vuelidate/core";
import {required} from "@vuelidate/validators";
import componentMixin from "@/mixins/common";
import {TeamleaderService} from "@/models/company/Teamleader";
import PriceInput from "@/components/PriceInput.vue";

export default {
  name: "ProductChooserTeamleader",
  mixins: [componentMixin],
  components: {BInput, PriceInput},
  props: {
    'material': Object
  },
  emits: [
    'product-chosen'
  ],
  data() {
    return {
      service: new TeamleaderService(),
      products: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
      ],
      query: null,
      showForm: true,
      product: null,
      isSubmitClicked: false,
      productCategories: [],
      settings: {}
    }
  },
  setup() {
    const {create} = useToast()
    const loading = useLoading();

    return {
      create,
      loading,
      v$: useVuelidate(),
    }
  },
  validations() {
    return {
      product: {
        name: {
          required,
        },
        product_category_id: {
          required,
        },
      }
    }
  },
  methods: {
    async doSearch() {
      await this.loadData()
    },
    onRowClicked(item, _index, _event) {
      this.$emit('product-chosen', item)
    },
    newTeamleaderProduct() {
      this.product = {
        department_id: this.settings.department_id
      }
      this.showForm = true
    },
    async loadData() {
      let loader = this.loading.show();
      try {
        this.products = await this.service.fetchProducts(this.query)
        this.settings = await this.service.configDetail()
        loader.hide()
      } catch(error) {
        console.log('error fetching products', error)
        errorToast(this.create, this.$trans('Error fetching products'))
        loader.hide()
      }
    },
    async fetchCategories() {
      let loader = this.loading.show();
      try {
        this.productCategories = await this.service.fetchProductCategories()
        loader.hide()
      } catch(error) {
        console.log('error fetching product categories', error)
        errorToast(this.create, this.$trans('Error fetching product categories'))
        loader.hide()
      }
    },
    async show() {
      await this.$refs['modal'].show()
      this.query = this.material.name.trim()
      await this.loadData()
    },
    hide() {
      this.$refs['modal'].hide()
    }
  },
  created() {
  }
}
</script>
<style scoped>

</style>
