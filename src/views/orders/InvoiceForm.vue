<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="!isLoading">
        <div v-if="isCreate">
          <h2>{{ $trans('New invoice') }}</h2>
        </div>

        <b-container fluid>
          <h3>{{ $trans("Materials") }}</h3>
          <b-row>
            <b-col cols="3">
              {{ $trans("Name") }}
            </b-col>
            <b-col cols="2">
              {{ $trans("Identifier") }}
            </b-col>
            <b-col cols="2">
              {{ $trans("Price purchase") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="3">
              {{ $trans("Price selling") }}
            </b-col>
            <b-col cols="1">

            </b-col>
          </b-row>
          <b-row v-for="material in material_models" :key="material.id">
            <b-col cols="3">
              {{ material.name }}
            </b-col>
            <b-col cols="2">
              {{ material.identifier }}
            </b-col>
            <b-col cols="2">
              <p class="flex">
                <span class="value-container">{{ material.price_purchase_ex_dinero.toFormat('$0.00') }}</span>
                <b-form-input
                  @blur="setPurchasePrice(material.id)"
                  v-model="material.price_purchase_ex_number"
                  size="sm"
                  class="input-number"
                ></b-form-input>
                <span class="bottom">.</span>
                <b-form-input
                  @blur="setPurchasePrice(material.id)"
                  v-model="material.price_purchase_ex_decimal"
                  size="sm"
                  class="input-decimal"
                ></b-form-input>
              </p>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  v-model="material.margin"
                  size="sm"
                  class="input-decimal"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="3">
              <p class="flex">
                <span class="value-container">{{ material.price_selling_ex_dinero.toFormat('$0.00') }}</span>
                <b-form-input
                  @blur="setSellingPrice(material.id)"
                  v-model="material.price_selling_ex_number"
                  size="sm"
                  class="input-number"
                ></b-form-input>
                <span class="bottom">.</span>
                <b-form-input
                  @blur="setSellingPrice(material.id)"
                  v-model="material.price_selling_ex_decimal"
                  size="sm"
                  class="input-decimal"
                ></b-form-input>
                <b-link
                  @click="() => { recalcSelling(material.id) }"
                  :title="`${$trans('Recalculate selling price with margin')}`"
                >{{ $trans("recalc")}}</b-link>
              </p>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-button
                  @click="() => { updateMaterial(material.id) }"
                  class="btn btn-primary update-button"
                  size="sm"
                  type="button"
                  variant="primary"
                >
                  {{ $trans("Update") }}
                </b-button>
              </p>
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <b-container fluid>
          <h3>{{ $trans("Used materials") }}</h3>
          <b-row>
            <b-col cols="3">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="3">
              {{ $trans("Material") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Amount") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Price") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("VAT") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Total") }}
            </b-col>
          </b-row>
          <b-row v-for="material in used_materials" :key="material.id" class="material_row">
            <b-col cols="3">
              {{ material.full_name }}
            </b-col>
            <b-col cols="3">
              {{ material.name }}
            </b-col>
            <b-col cols="1">
              {{ material.amount }}
            </b-col>
            <b-col cols="1">
              <b-form-radio-group
                v-model="material.usePrice"
              >
                <b-form-radio value="purchase"></b-form-radio>
                  Purchase <b-form-input
                  v-model="material.price_purchase_ex"
                  size="sm"
                ></b-form-input>
                <b-form-radio value="selling"></b-form-radio>
                  Selling <b-form-input
                  v-model="material.price_selling_ex"
                  size="sm"
                ></b-form-input>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <b-form-input
                v-model="material.margin"
                size="sm"
              ></b-form-input>
            </b-col>
            <b-col cols="1">
              <b-form-select
                :value="invoice_default_vat"
                v-model="material.vat.amount"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="1">
              <b-form-input
                v-model="material.total.amount"
                size="sm"
              ></b-form-input>
            </b-col>
          </b-row>
        </b-container>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import invoiceModel from '../../models/orders/Invoice.js'
import invoiceLineModel from '../../models/orders/InvoiceLine.js'
import memberModel from "../../models/member/Member";
import Dinero from 'dinero.js'

export default {
  name: 'InvoiceForm',
  props: {
    uuid: {
      type: [String],
      default: null
    },
    pk: {
      type: [String, Number],
      default: null
    }
  },
  data () {
    return {
      isLoading: false,
      invoiceLines: [],
      deletedInvoiceLines: [],
      submitClicked: false,
      invoice: invoiceModel.getFields(),
      errorMessage: null,

      order: null,
      member: null,
      invoice_id: null,
      invoice_default_margin: null,
      invoice_default_hourly_rate: null,
      invoice_default_vat: null,
      hourly_rate_engineer_customer: null,
      call_out_costs: null,
      call_out_costs_from_customer: null,

      used_materials: [],
      material_models: [],

      activity: [],
      activity_totals: {},
      extra_work: [],
      extra_work_totals: {},

      usePriceOptions: [
        { text: 'Purchase', value: 'purchase' },
        { text: 'Selling', value: 'selling' },
      ]
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
  },
  async created() {
    if (this.isCreate) {
      this.isLoading = true
      this.vat_types = await memberModel.getVATTypes()
      this.invoice = invoiceModel.getFields()
      const invoiceData = await invoiceModel.getData(this.uuid)
      console.log(invoiceData)

      this.order = invoiceData.order
      this.member = invoiceData.member
      this.invoice_id = invoiceData.invoice_id
      this.invoice_default_margin = invoiceData.invoice_default_margin
      this.invoice_default_hourly_rate = invoiceData.invoice_default_hourly_rate
      this.invoice_default_vat = invoiceData.invoice_default_vat
      this.call_out_costs = invoiceData.call_out_costs
      this.call_out_costs_from_customer = invoiceData.call_out_costs_from_customer

      for (let material of invoiceData.used_materials) {
        material.vat_type = this.invoice_default_vat
        material.margin = this.invoice_default_margin
        material.usePrice = 'purchase'
      }
      this.used_materials = invoiceData.used_materials
      this.material_models = this.setModelPrices(invoiceData.material_models)
      console.log(this.material_models)
      this.updateMaterialTotals()

      this.activity = invoiceData.activity
      this.activity_totals = invoiceData.activity_totals
      this.extra_work = invoiceData.extra_work
      this.extra_work_totals = invoiceData.extra_work_totals
      this.hourly_rate_engineer_customer = invoiceData.hourly_rate_engineer_customer
      this.isLoading = false
    } else {
      await this.loadInvoice()
    }
  },
  methods: {
    toDinero(priceDecimal, currency) {
      if (currency === 'EUR' || currency === 'USD') {
        const price = priceDecimal * 100
        return Dinero({ amount: price, currency })
      } else {
        throw `${currency} not supported`
      }
    },
    updateMaterial(material_id) {

    },
    recalcSelling(material_id) {
      const material = this.material_models.find((m) => m.id === material_id)
      if (!material) {
        throw `material ${material_id} not found`
      }
      material.price_selling_ex_dinero = material.price_purchase_ex_dinero.multiply(1+material.margin/100)
      let parts = material.price_selling_ex_dinero.toFormat('0.00').split('.')
      material.price_selling_ex_number = parts[0]
      material.price_selling_ex_decimal = parts[1]
    },
    setModelPrice(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      material.margin = this.invoice_default_margin
      material.price_purchase_ex_dinero = this.toDinero(material.price_purchase_ex, material.price_purchase_ex_currency)
      material.price_selling_ex_dinero = this.toDinero(material.price_selling_ex, material.price_selling_ex_currency)
    },
    setPageModelPrices() {
      this.material_models = this.setModelPrices(this.material_models)
    },
    setPurchasePrice(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      const price = parseInt(`${material.price_purchase_ex_number}${material.price_purchase_ex_decimal}`)
      material.price_purchase_ex_dinero = Dinero({ amount: price, currency: material.price_purchase_ex_currency })
    },
    setSellingPrice(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      const price = parseInt(`${material.price_selling_ex_number}${material.price_selling_ex_decimal}`)
      material.price_selling_ex_dinero = Dinero({ amount: price, currency: material.price_selling_ex_currency })
    },
    setModelPrices(material_models) {
      let new_models = []
      for (let material of material_models) {
        material.margin = this.invoice_default_margin
        console.log(material.price_purchase_ex_number)
        material.price_purchase_ex_dinero = this.toDinero(material.price_purchase_ex, material.price_purchase_ex_currency)
        let parts = material.price_purchase_ex_dinero.toFormat('0.00').split('.')
        material.price_purchase_ex_number = parts[0]
        material.price_purchase_ex_decimal = parts[1]

        material.price_selling_ex_dinero = this.toDinero(material.price_selling_ex, material.price_selling_ex_currency)
        parts = material.price_selling_ex_dinero.toFormat('0.00').split('.')
        material.price_selling_ex_number = parts[0]
        material.price_selling_ex_decimal = parts[1]

        new_models.push(material)
      }
      return new_models
    },
    getMaterialPrice(used_material) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        console.log('found model', model)
        let price = used_material.usePrice === 'purchase' ? model.price_purchase_ex : model.price_selling_ex
        const currency = used_material.usePrice === 'purchase' ? model.price_purchase_ex_currency : model.price_selling_ex_currency
        return this.toDinero(price, currency)
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    updateMaterialTotals() {
      let new_materials = []
      for (let material of this.used_materials) {
        const new_material = this.updateMaterialTotal(material)
        new_materials.push(new_material)
      }
      this.used_materials = new_materials
    },
    updateMaterialTotal(material) {
      const price = this.getMaterialPrice(material)
      const total = price.multiply(material.amount)
      const margin = total.multiply(material.margin)
      const total_with_margin = total.add(margin)
      const vat = total_with_margin.multiply(parseInt(material.vat_type))
      material.total = total_with_margin
      material.vat = vat

      return material
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        try {
          const invoice = invoiceModel.insert(this.invoice)
          for (let invoiceLine of this.invoiceLines) {
            invoiceLine.invoice = invoice.id
            await invoiceLineModel.insert(invoiceLine)
          }
        } catch(error) {
          this.errorToast(this.$trans('Error creating invoice lines'))
          this.isLoading = false
        }

        this.infoToast(this.$trans('Created'), this.$trans('Invoice has been created'))
        this.isLoading = false
        await this.$router.push({name: 'order-invoice-view', params: {pk: this.pk}})

        return
      }

      try {
        await invoiceModel.update(this.pk, this.invoice)

        // invoiceLine create/update
        for (let invoiceLine of this.invoiceLines) {
          invoiceLine.order = this.pk
          if (invoiceLine.id) {
            await invoiceLineModel.update(invoiceLine.id, invoiceLine)
          } else {
            await invoiceLineModel.insert(invoiceLine)
          }
        }

        // invoiceLine delete
        for (const invoiceLine of this.deletedInvoiceLines) {
          if (invoiceLine.id) {
            await invoiceLineModel.delete(invoiceLine.id)
          }
        }

        this.infoToast(this.$trans('Updated'), this.$trans('Invoice has been updated'))
        this.isLoading = false
        await this.$router.push({name: 'order-invoice-view', params: {pk: this.pk}})
      } catch(error) {
        console.log('Error updating invoice', error)
        this.errorToast(this.$trans('Error updating invoice'))
        this.isLoading = false
      }
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = await invoiceModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching invoice', error)
        this.errorToast(this.$trans('Error loading invoice'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style scoped>
.material_row {
  padding-bottom: 10px;
  padding-top: 5px;
  border-bottom: 1px silver solid;
}
.flex {
  display : flex;
  margin-top: auto;
}
.bottom {
  /*margin-bottom: auto;*/
  margin-top: auto;
}
.input-decimal {
  width: 45px;
}
.value-container {
  padding-top: 4px;
  padding-right: 4px;
}
.percentage-container {
  padding-top: 4px;
  padding-left: 4px;
}
.input-number {
  width: 60px;
}
.update-button {
  margin-bottom: 8px;
}
</style>
