<template>
    <div class="pdf-container" v-if="data">
        <div class="row">
            <div class="col-sm-2 logo">
                <img class="thumbnail" :src="companyLogo" style="border:0; max-height: 120px; max-width: 120px" :alt="data.member.name" />
            </div>

            <div class="col-sm-4 info">
                <b>{{ data.member.name }}</b><br/>
                {{ data.member.address }}<br/>
                {{ data.member.postal }} {{ data.member.city }}<br/>
                {{ data.member.tel }} - {{ data.member.email}}<br/>
              <b>{{ $trans('VAT number') }}</b> {{ data.member.vat_number }}<br/>
              <b>{{ $trans('Chamber of commerce') }}</b> {{ data.member.chamber_of_commerce }}<br/>
            </div>
            <div class="col-sm-6 panel panel-default">
              <div class="panel-body">
                <div class="row">
                  <span class="pull-left col-sm-4"><b>{{ $trans('Invoice number') }}</b></span>
                  <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.invoice_id }}</span>
                  </span>
                </div>
                <div class="row">
                  <span class="pull-left col-sm-4"><b>{{ $trans('Reference') }}</b></span>
                  <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.reference }}&nbsp;</span>
                  </span>
                </div>
                <div class="row">
                  <span class="pull-left col-sm-4"><b>{{ $trans('Description') }}</b></span>
                  <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.description }}&nbsp;</span>
                  </span>
                </div>
                <div class="row">
                  <span class="pull-left col-sm-4"><b>{{ $trans('Order ID') }}</b></span>
                  <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order_id }}</span>
                  </span>
                </div>
                <div class="row">
                  <span class="pull-left col-sm-4"><b>{{ $trans('Order reference') }}</b></span>
                  <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.order_reference }}</span>
                  </span>
                </div>
              </div>
            </div>
        </div>

        <div class="row">
            <div class="col-sm-6">
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Customer') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.customer.name }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.customer.address }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.customer.country_code }}-{{ data.customer.postal }} {{ data.customer.city }}</span>
                </span>
              </div>
              <div class="row">
                <span class="pull-left col-sm-6"><b>{{ $trans('Term of payment') }}</b></span>
                <span class="col-sm-6 underline">
                    <span class="pull-right">{{ data.term_of_payment_days }} days</span>
                </span>
              </div>
            </div>
            <div class="col-sm-6">
              <div class="row"></div>
            </div>
        </div>

        <div class="row" v-if="data.invoicelines.length">
            <p><b>{{ $trans('Invoice lines') }}</b></p>
            <table class="table table-bordered">
                <thead>
                    <th>{{ $trans('Description') }}</th>
                    <th>{{ $trans('Amount') }}</th>
                    <th>{{ $trans('Price') }}</th>
                    <th>{{ $trans('Total') }}</th>
                    <th>{{ $trans('VAT') }}</th>
                </thead>
                <tbody>
                    <tr v-for="invoiceline in data.invoicelines" :key="invoiceline.id">
                        <td>{{ invoiceline.description }}</td>
                        <td>{{ invoiceline.amount }}</td>
                        <td>{{ invoiceline.price_dinero.toFormat('$0.00') }}</td>
                        <td>{{ invoiceline.total_dinero.toFormat('$0.00') }}</td>
                        <td>{{ invoiceline.vat_dinero.toFormat('$0.00') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class='flex-columns space-between'>
          <span class="total-text">{{ $trans('Invoice total') }}</span>

          <TotalsInputs
            :total="data.total_dinero"
            :is-final-total="true"
            :vat="data.vat_dinero"
          />
        </div>

      <br/>
        <br/>
        <br/>
        <br/>
    </div>
</template>
<script>
import invoiceService from '../../models/orders/Invoice'
import TotalsInputs from "../../components/TotalsInputs";

export default {
  name: "InvoiceView",
  components: {
    TotalsInputs,
  },
  data() {
    return {
      isLoaded: false,
      data: null,
      companyLogo: null
    }
  },
  props: {
    uuid: {
      type: String
    }
  },
  async mounted() {
    const createPDFHeader = this.$route.query.create_pdf
    const data = await invoiceService.getByUuid(this.uuid, createPDFHeader)

    this.data = new invoiceService.model(data)
    this.companyLogo = this.data.member.companylogo_url
  },
}
</script>

<style lang="less" scoped>
@import '@/less/my24.less';

.pdf-container {
  font-size: 12px !important;
  margin-top: 4px;
  font-size: 85%;

  .log, .info {
    padding-top: 12px;
  }

  .underline {
    border-bottom: 1px dotted;
  }

  div.row {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .panel-body {
    padding: 10px;
  }

  .signature {
    height: 150px;
  }
}
</style>
