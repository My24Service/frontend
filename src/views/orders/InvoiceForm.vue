<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <div v-if="isCreate">
          <h2>{{ $trans('New invoice') }}</h2>

        </div>

        <b-container fluid>
          <b-row>
            <b-col size="3">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col size="3">
              {{ $trans("Material") }}
            </b-col>
            <b-col size="1">
              {{ $trans("Amount") }}
            </b-col>
            <b-col size="1">
              {{ $trans("Price") }}
            </b-col>
            <b-col size="1">
              {{ $trans("Margin") }}
            </b-col>
            <b-col size="1">
              {{ $trans("VAT") }}
            </b-col>
            <b-col size="1">
              {{ $trans("Total") }}
            </b-col>
          </b-row>
          <b-row v-for="material in used_materials" :key="material.id" class="material_row">
            <b-col size="3">
              {{ material.full_name }}
            </b-col>
            <b-col size="3">
              {{ material.name }}
            </b-col>
            <b-col size="1">
              {{ material.amount }}
            </b-col>
            <b-col size="1">
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
            <b-col size="1">
              <b-form-input
                v-model="material.margin"
                size="sm"
              ></b-form-input>
            </b-col>
            <b-col size="1">
              <b-form-select
                :value="invoice_default_vat"
                v-model="material.vat"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col size="1">
              <b-form-input
                v-model="material.total"
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
      this.material_models = invoiceData.material_models
      this.updateMaterialTotals()

      this.activity = invoiceData.activity
      this.activity_totals = invoiceData.activity_totals
      this.extra_work = invoiceData.extra_work
      this.extra_work_totals = invoiceData.extra_work_totals
      this.hourly_rate_engineer_customer = invoiceData.hourly_rate_engineer_customer
    } else {
      await this.loadInvoice()
    }
  },
  methods: {
    getMaterialPrice(used_material) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        console.log('found model', model)
        const price = used_material.usePrice === 'purchase' ? model.price_purchase_ex : model.price_selling_ex
        console.log('found price', price)
        return price
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
      const total = material.amount * price
      const margin = (material.margin / 100) * total
      const total_with_margin = total + margin
      const vat = total_with_margin * (material.vat/100)
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
</style>
