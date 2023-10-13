<template>
  <Collapse
    :title="$trans('Materials')"
  >
    <b-overlay :show="compLoading" rounded="sm">
      <b-container fluid>
        <b-row>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Material")'
            />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Amount")'
            />
          </b-col>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Price")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("VAT type")'
            />
          </b-col>
          <b-col cols="2" />
        </b-row>
        <b-row
          v-for="(cost, index) in this.costService.collection"
          :key="index"
          class="material_row"
        >
          <b-col cols="8" role="group" v-if="!cost.material">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Search material')"
              label-for="material-search"
            >
              <multiselect
                id="material-search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="materials"
                :loading="compLoading"
                :multiple="false"
                :internal-search="false"
                :clear-on-select="false"
                :close-on-select="true"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :show-no-results="false"
                :hide-selected="true"
                @search-change="getMaterialsDebounced"
                @select="(material) => selectMaterial(material, index)"
                :custom-label="materialLabel"
                ref="searchMaterial"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
          <b-col cols="3" v-if="cost.material">
            {{ cost.material_name }}
          </b-col>
          <b-col cols="2" v-if="cost.material">
            <AmountDecimalInput
              v-model="cost.amount_decimal"
              @amountChanged="(amount) => changeAmount(cost, amount)"
            />
          </b-col>
          <b-col cols="3" v-if="cost.material">
            <b-form-radio-group
              @change="updateTotals"
              v-model="cost.use_price"
            >
              <b-form-radio :value="usePriceOptions.USE_PRICE_PURCHASE">
                {{ $trans('Pur.') }} {{ getMaterialPriceFor(cost, usePriceOptions.USE_PRICE_PURCHASE).toFormat('$0.00') }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_SELLING">
                {{ $trans('Sel.') }} {{ getMaterialPriceFor(cost, usePriceOptions.USE_PRICE_SELLING).toFormat('$0.00') }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="cost.price"
                    :currency="cost.price_currency"
                    @priceChanged="(val) => otherPriceChanged(val, cost)"
                  />
                </p>
              </b-form-radio>
            </b-form-radio-group>
          </b-col>
          <b-col cols="1" v-if="cost.material">
            <VAT @vatChanged="(val) => changeVatType(cost, val)" />
          </b-col>
          <b-col cols="2" v-if="cost.material && cost.total_dinero">
            <TotalsInputs
              :total="cost.total_dinero"
              :vat="cost.vat_dinero"
            />
          </b-col>
          <b-col cols="1 delete-button" v-if="cost.material">
            <IconLinkDelete
              :title="$trans('Delete')"
              :method="() => deleteCost(index)"
            />
          </b-col>
        </b-row>
        <hr>
        <TotalRow
          class="total-row"
          v-if="!compLoading"
          :items_total="totalAmount"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />
        <hr v-if="!parentHasQuotationLines">
        <AddToQuotationLines
          v-if="!parentHasQuotationLines"
          :useOnQuotationOptions="useOnQuotationOptions"
          @buttonClicked="createQuotationLinesClicked"
        />
        <hr>
        <b-row>
          <b-col cols="8"></b-col>
          <b-col cols="4">
            <div class="float-right">
              <b-button
                :disabled="compLoading"
                @click="addCost"
                class="btn add-button"
                type="button"
              >
                {{ $trans("Add cost") }}
              </b-button>
            </div>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="8"></b-col>
          <b-col cols="4">
            <div class="float-right">
              <b-button
                :disabled="compLoading"
                @click="() => saveCosts()"
                class="btn btn-danger update-button"
                type="button"
                variant="danger"
              >
                {{ $trans("Save costs") }}
              </b-button>
            </div>
          </b-col>
        </b-row>
      </b-container>
    </b-overlay>
  </Collapse>
</template>

<script>
import quotationMixin from "./mixin.js";
import Multiselect from 'vue-multiselect'
import AmountDecimalInput from "../../../components/AmountDecimalInput.vue"
import quotationLineService from '@/models/quotations/QuotationLine.js'
import Collapse from "../../../components/Collapse";
import CostService, {COST_TYPE_USED_MATERIALS} from "../../../models/quotations/Cost";
import {
  INVOICE_LINE_TYPE_USED_MATERIALS,
  USE_PRICE_OTHER,
  USE_PRICE_PURCHASE,
  USE_PRICE_SELLING
} from "./constants";
import HeaderCell from "./Header";
import VAT from "./VAT";
import materialService, {MaterialModel} from "../../../models/inventory/Material";
import PriceInput from "../../../components/PriceInput";
import TotalRow from "./TotalRow";
import TotalsInputs from "../../../components/TotalsInputs";
import inventoryModel from '@/models/inventory/Inventory.js'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import AddToQuotationLines from './AddToQuotationLines.vue'
import AwesomeDebouncePromise from "awesome-debounce-promise";


export default {
  name: "MaterialsCreateComponent",
  emits: ['quotationLinesCreated', 'emptyCollectionClicked'],
  mixins: [quotationMixin],
  components: {
    PriceInput,
    IconLinkDelete,
    Collapse,
    HeaderCell,
    VAT,
    TotalRow,
    TotalsInputs,
    Multiselect,
    AmountDecimalInput,
    AddToQuotationLines
  },
  props: {
    quotation_pk: {
      type: [Number, String],
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    quotationLinesParent: {
      type: [Array],
      default: null
    },
  },
  computed: {
    compLoading () {
      return this.loading || this.isLoading
    }
  },
  data() {
    return {
      isLoading: false,
      materials: [],
      materialModels: [],
      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,
      costService: new CostService(),
      usePriceOptions: {
        USE_PRICE_PURCHASE,
        USE_PRICE_SELLING,
        USE_PRICE_OTHER,
      },
      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,
      hasStoredData: false,
      costType: COST_TYPE_USED_MATERIALS,
      getMaterialsDebounced: '',
      parentHasQuotationLines: false,
      quotationLineType: INVOICE_LINE_TYPE_USED_MATERIALS,
      quotationLineService
    }
  },
  async created() {
    this.isLoading = true
    this.getMaterialsDebounced = AwesomeDebouncePromise(this.getMaterials, 500)

    // set vars in service
    this.costService.invoice_default_margin = this.invoice_default_margin
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency


    this.costService.addListArg(`quotation=${this.quotation_pk}`)
    this.costService.addListArg(`cost_type=${COST_TYPE_USED_MATERIALS}`)

    await this.loadData()

    this.isLoading = false
  },
  methods: {
    otherPriceChanged(priceDinero, cost) {
      cost.setPriceField('price', priceDinero)
      this.updateTotals()
    },
    addCost() {
      this.costService.collection.push({
        material: null
      })
    },
    deleteCost(index) {
      this.costService.deleteCollectionItem(index)
      this.updateTotals()
    },
    async saveCosts() {
      try {
        this.isLoading = true
        await this.costService.updateCollection()
        this.infoToast(this.$trans('Created'), this.$trans('Materials costs have been updated'))
        this.isLoading = false
        this.loadData()
      } catch(error) {
        console.log('Error creating material costs', error)
        this.errorToast(this.$trans('Error creating material costs'))
        this.isLoading = false
      }
    },
    async selectMaterial(material, index) {
      try {
        this.isLoading = true
        const data = await materialService.detail(material.material_id)

        this.materialModels.push(
          new MaterialModel({
            ...data,
            margin_perc: this.invoice_default_margin
          })
        )
        data.material_id = data.id
        data.material_name = data.name
        delete data.id
        delete data.name
        this.costService.collection[index] = new this.costService.model({
          ...data,
          ...this.costService.getDefaultCostProps(),
          ...this.getDefaultProps(),
          price: this.getPrice(
            {...data, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
          price_currency: this.getCurrency(
            {...data, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
          material: data.material_id,
          amount_decimal: "0.00",
          cost_type: COST_TYPE_USED_MATERIALS
        })
        this.isLoading = false
      } catch(error) {
        console.log('error fetching material', error)
        this.errorToast(this.$trans('Error fetching material'))
        this.isLoading = false
      }
      this.updateTotals()
    },
    materialLabel(material) {
      const text = this.$trans('in stock')
      return `${material.material_name}, ${text}: ${material.total_amount}`
    },
    async getMaterials(query) {
      try {
        this.materials = await inventoryModel.getMaterials(query)
      } catch(error) {
        console.log('Error fetching materials', error)
        this.errorToast(this.$trans('Error fetching materials'))
      }
    },
    changeVatType(obj, vatType) {
      obj.vat_type = vatType
      this.updateTotals()
    },
    changeAmount(cost, amount) {
      cost.amount_decimal = amount
      this.updateTotals()
    },
    getMaterialName(material_id) {
      const material = this.materialModels.find((m) => m.id === material_id)
      return material ? material.name : this.$trans("unknown")
    },
    async loadData() {
      this.costService.collection = []
      this.isLoading = true

      try {
        let materialIds = []
        const response = await this.costService.list()
        const costs = response.results.map((cost) => {
          cost.material_id = cost.material
          materialIds.push(cost.material)
          return new this.costService.model(cost)
        })
        await this.loadMaterials(materialIds)
        this.costService.collection = costs
        this.updateTotals()
        this.isLoading = false
      } catch(error) {
        this.errorToast(this.$trans('Error fetching material cost'))
        this.isLoading = false
      }
    },
    async loadMaterials (materialIds) {
      let data

      this.isLoading = true
      for (let id of materialIds) {
        data = await materialService.detail(id)
        this.materialModels.push(
          new MaterialModel({
            ...data,
            margin_perc: this.invoice_default_margin
          })
        )
      }
      this.isLoading = false
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_PURCHASE,
        quotation: this.quotation_pk,
      }
    },
    getPrice(material) {
      let model

      switch (material.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_purchase_ex
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_selling_ex
        case this.usePriceOptions.USE_PRICE_OTHER:
          return material.price
        default:
          throw `unknown use price: ${material.use_price}`
      }
    },
    getCurrency(material) {
      let model

      switch (material.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_purchase_ex_currency
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material.material_id)
          return model.price_selling_ex_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return material.price_currency
        default:
          throw `unknown use price: ${material.use_price}`
      }
    },
    getMaterialPriceFor(used_material, use_price) {
      const model = this.materialModels.find((m) => m.id === used_material.material_id)
      if (model) {
        return use_price === this.usePriceOptions.USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
      this.totalAmount = this.costService.collection.reduce(
        (total, m) => (total + parseFloat(m.amount_decimal)),
        0
      )
    },
    getDescriptionUserTotalsQuotationLine(cost) {
      return `${this.$trans("material")}: ${this.getMaterialName(cost.material)}`
    },
    getDescriptionOnlyTotalQuotationLine() {
      return `${this.$trans("Materials")}`
    },
    getTotalAmountQuotationLine() {
      return this.totalAmount
    },
  }
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.add-button {
  margin: 20px 0;
}
.row.total-row {
  margin-top: 20px;
}
.material_row {
  margin-bottom: 20px;
}
.delete-button {
  font-size: 1.8rem;
}
</style>
