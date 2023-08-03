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
              {{ $trans("Price purchase ex.") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="3">
              {{ $trans("Price selling ex.") }}
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
                  @blur="material.setPurchasePrice() && updateMaterialTotals()"
                  v-model="material.price_purchase_ex_number"
                  size="sm"
                  class="input-number"
                ></b-form-input>
                <span class="bottom">.</span>
                <b-form-input
                  @blur="material.setPurchasePrice() && updateMaterialTotals()"
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
                  @blur="material.setSellingPrice() && updateMaterialTotals()"
                  v-model="material.price_selling_ex_number"
                  size="sm"
                  class="input-number"
                ></b-form-input>
                <span class="bottom">.</span>
                <b-form-input
                  @blur="material.setSellingPrice() && updateMaterialTotals()"
                  v-model="material.price_selling_ex_decimal"
                  size="sm"
                  class="input-decimal"
                ></b-form-input>
                <b-link
                  @click="() => { material.recalcSelling() && updateMaterialTotals() }"
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
            <b-col cols="2">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="2">
              {{ $trans("Material") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Amount") }}
            </b-col>
            <b-col cols="3">
              {{ $trans("Use price") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1">
              {{ $trans("VAT type") }}
            </b-col>
            <b-col cols="2"></b-col>
          </b-row>
          <b-row v-for="material in used_materials" :key="material.id" class="material_row">
            <b-col cols="2">
              {{ material.full_name }}
            </b-col>
            <b-col cols="2">
              {{ material.name }}
            </b-col>
            <b-col cols="1">
              {{ material.amount }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateMaterialTotals()"
                v-model="material.usePrice"
              >
                <b-form-radio value="purchase">
                  Pur. {{ getMaterialPriceFor(material, "purchase").toFormat('$0.00') }}
                </b-form-radio>

                <b-form-radio value="selling">
                  Sel. {{ getMaterialPriceFor(material, "selling").toFormat('$0.00') }}
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateMaterialTotals()"
                  v-model="material.margin"
                  size="sm"
                  class="input-decimal"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateMaterialTotals"
                :value="invoice_default_vat"
                v-model="material.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <b-container>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("Total") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      v-model="material.total"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("Margin") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      v-model="material.margin_amount"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("VAT") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      v-model="material.vat"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
              </b-container>
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
import { MaterialModel } from "../../models/inventory/Material";
import materialService from "../../models/inventory/Material";

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
      vat_types: [],
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

      this.order = invoiceData.order
      this.member = invoiceData.member
      this.invoice_id = invoiceData.invoice_id
      this.invoice_default_margin = invoiceData.invoice_default_margin
      this.invoice_default_hourly_rate = invoiceData.invoice_default_hourly_rate
      this.invoice_default_vat = invoiceData.invoice_default_vat
      this.call_out_costs = invoiceData.call_out_costs
      this.call_out_costs_from_customer = invoiceData.call_out_costs_from_customer

      this.used_materials = invoiceData.used_materials.map((m) => ({
        ...m,
        vat_type: this.invoice_default_vat,
        margin:  this.invoice_default_margin,
        usePrice: 'purchase',
      }))

      this.material_models = invoiceData.material_models.map((m) => new MaterialModel(
        {...m, margin: this.invoice_default_margin})
      )
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
    async updateMaterial(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      delete material.image
      const updatedMaterialJson = await materialService.update(material_id, material)
      material.setPriceFields(updatedMaterialJson)
      this.updateMaterialTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Material has been updated'))
    },
    getMaterialPrice(used_material) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        return used_material.usePrice === 'purchase' ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    getMaterialPriceFor(used_material, usePrice) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        return usePrice === 'purchase' ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    updateMaterialTotals() {
      this.used_materials = this.used_materials.map((m) => this.updateUsedMaterialTotals(m))
    },
    updateUsedMaterialTotals(material) {
      const price = this.getMaterialPrice(material)
      const total = price.multiply(material.amount)
      let total_with_margin = total
      let margin_txt = "0.00"
      if (material.margin > 0) {
        const margin_perc = material.margin/100
        const margin = total.multiply(margin_perc)
        total_with_margin = total.add(margin)
        margin_txt = margin.toFormat("$0.00")
      }
      const vat = total_with_margin.multiply(parseInt(material.vat_type)/100)
      material.total = total_with_margin.toFormat("$0.00")
      material.vat = vat.toFormat("$0.00")
      material.margin_amount = margin_txt

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
.input-vat-used {
  width: 90px;
}
.input-total-used {
  width: 90px;
}
.update-button {
  margin-bottom: 8px;
}
.used-total {
  margin-right: 8px;
}
</style>
