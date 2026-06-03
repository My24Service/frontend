<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Link product')"
    ok-only
    @ok="hide"
    ok-title="Annuleer"
    ok-variant="secondary"
  >
    <div v-if="showDetails && product">
      <div>
        <h3>{{ product.name }} {{ $trans('details') }}</h3>
        <dl>
          <dt>{{ $trans('Name') }}</dt>
          <dd>{{ product.name }}</dd>
          <dt>{{ $trans('Code') }}</dt>
          <dd>{{ product.code }}</dd>
          <dt>{{ $trans('Description') }}</dt>
          <dd>{{ product.description }}</dd>
          <dt>{{ $trans('Account') }}</dt>
          <dd>{{ product.product_category_detail.name }}</dd>
          <dt>{{ $trans('Purchase price') }}</dt>
          <dd>{{ product.purchase_price ? product.purchase_price.currency : '-' }} {{ product.purchase_price? product.purchase_price.amount : '-' }}</dd>
          <dt>{{ $trans('Sales price') }}</dt>
          <dd>{{ product.selling_price? product.selling_price.currency : '-' }} {{ product.selling_price ? product.selling_price.amount : '-' }}</dd>
          <dt>{{ $trans('VAT rate') }}</dt>
          <dd>{{ product.tax_detail.rate }}</dd>
          <dt>{{ $trans('Created') }}</dt>
          <dd>{{ product.added_at }}</dd>
          <dt>{{ $trans('Modified') }}</dt>
          <dd>{{ product.updated_at }}</dd>
        </dl>
      </div>
    </div>
    <div v-else-if="showForm">
      <h3>{{ $trans('New Teamleader product') }}</h3>
      <form v-if="product">
        <BFormGroup
          :label="$trans('Name')"
          label-for="name-input"
          :invalid-feedback="$trans('Name is required')"
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
          :label="$trans('Code')"
          label-for="code-input"
        >
          <BFormInput
            id="code-input"
            v-model="product.code"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          :label="$trans('Description')"
          label-for="description-input"
        >
          <BFormInput
            id="description-input"
            v-model="product.description"
          ></BFormInput>
        </BFormGroup>
        <BRow>
          <BCol cols="4">
            <BFormGroup
              :label="$trans('Purchase price')"
              label-for="purchase_price-input"
            >
              <PriceInput
                id="purchase_price-input"
                v-model="product.purchase_price"
                currency="EUR"
              />
            </BFormGroup>
          </BCol>
          <BCol cols="4">
            <BFormGroup
              :label="$trans('Sales price')"
              label-for="selling_price-input"
            >
              <PriceInput
                id="selling_price-input"
                v-model="product.selling_price"
                currency="EUR"
              ></PriceInput>
            </BFormGroup>
          </BCol>
          <BCol cols="4">
            <BFormGroup
              :label="$trans('VAT rate')"
              label-for="tax_rate_uuid-input"
            >
              <BFormSelect
                id="tax_rate_uuid-input"
                v-model="product.tax_rate_id"
                :options="taxRates"
                size="sm"
              ></BFormSelect>
            </BFormGroup>
          </BCol>
        </BRow>
        <div class='flex-columns align-items-center justify-content-center'>
          <BButton
            @click="createLinkProduct"
            variant="primary"
          >{{ $trans('Create') }}</BButton>
        </div>
      </form>
    </div>
    <div v-else>
      <BForm @submit.stop.prevent="doSearch">
        <b-row>
          <b-col cols="8">
            <b-input
              autofocus
              size="sm"
              v-model="query"
            />
          </b-col>
          <b-col cols="2">
            <BButton
              @click="doSearch"
              type="submit"
            >{{ $trans('Search') }}</BButton>
          </b-col>
        </b-row>
      </BForm>

      <b-table
        id="products-table"
        small
        :fields="fields"
        :items="products"
        :hover="true"
        responsive="md"
        tbody-tr-class="tr-pointer"
        @row-clicked="onRowClicked"
      >
        <template #cell(id)="data">
          <BButton
            @click="() => showDetail(data.item.id)"
          >
            {{ $trans('Details') }}
          </BButton>
        </template>
      </b-table>
      <div
        v-if="withCreateButton"
        class='flex-columns align-items-center justify-content-center'
      >
        <BButton
          @click="newTeamleaderProduct"
          variant="primary"
        {{ $trans('Add new Teamleader product') }}</BButton>
      </div>
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
import {constrainPoint} from "@fullcalendar/core/internal";

export default {
  name: "TeamleaderProductChooser",
  mixins: [componentMixin],
  components: {BInput, PriceInput},
  props: {
    material: Object,
    withCreateButton: {
      type: Boolean,
      default: true
    },
  },
  emits: [
    'product-chosen',
    'product-created-linked',
  ],
  data() {
    return {
      service: new TeamleaderService(),
      products: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'description', label: this.$trans('Description')},
        {key: 'code', label: this.$trans('Code')},
        {key: 'id', label: ''},
      ],
      query: null,
      showForm: false,
      showDetails: false,
      showSearch: true,
      product: null,
      isSubmitClicked: false,
      settings: {},
      taxRates: [],
    }
  },
  setup() {
    const {create} = useToast()
    const loading = useLoading()

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
      }
    }
  },
  methods: {
    showFormMode() {
      this.showForm = true
      this.showSearch = false
      this.showDetails = false
    },
    showDetailMode() {
      this.showForm = false
      this.showSearch = false
      this.showDetails = true
    },
    showSearchMode() {
      this.showForm = false
      this.showSearch = true
      this.showDetails = false
    },
    async showDetail(id) {
      const loader = this.loading.show()
      try {
        this.product = await this.service.fetchProductDetail(id)
        console.log('product', this.product)
        this.showDetailMode()
        loader.hide()
      } catch (e) {
        console.error('error fetching product details', e)
        loader.hide()
      }
    },
    async doSearch() {
      await this.loadData()
    },
    onRowClicked(item, _index, _event) {
      this.$emit('product-chosen', item)
    },
    async newTeamleaderProduct() {
      this.settings = await this.service.configDetail()
      const response = await this.service.fetchTaxRates()
      this.taxRates = response.results.map((rate) => {
        return {
          value: rate.uuid,
          text: `${rate.description} (${rate.rate})`
        }
      })
      const defaultRate = response.results.find((rate) => rate.rate === '0.21')
      this.product = {
        name: this.material.name,
        code: this.material.identifier,
        description: this.material.description,
        tax_rate_id: defaultRate.uuid,
        purchase_price: this.material.price_purchase_ex,
        selling_price: this.material.price_selling_ex,
        material: this.material.id,
      }
      this.showFormMode()
    },
    async createLinkProduct() {
      const createData = {
        ...this.product,
        purchase_price_currency: 'EUR',
        selling_price_currency: 'EUR',
      }

      try {
        const response = await this.service.createLinkProduct(createData)
        console.log({response})
        if (!response['is_ok']) {
          errorToast(this.create,'Fout aanmaken van het product in Teamleader')
          return
        }

        const materialId = response['material']
        this.$emit('product-created-linked', materialId)
      } catch (error) {
        console.error('error in create/link', error)
      }
    },
    async loadData() {
      const loader = this.loading.show()
      try {
        this.products = await this.service.fetchProducts(this.query)
        // const productCategories = await this.service.fetchProductCategories()
        // console.log({productCategories})
        loader.hide()
      } catch(error) {
        console.log('error fetching products', error)
        errorToast(this.create,'Fout bij het ophalen van de producten')
        loader.hide()
      }
    },
    async show() {
      console.log(this.material)
      await this.$refs['modal'].show()
      if (this.material && this.material.name) {
        this.query = this.material.name.trim()
      }
      this.showForm = false
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
