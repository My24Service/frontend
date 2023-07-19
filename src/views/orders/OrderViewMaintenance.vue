<template>
  <div v-if="order">
    <b-modal ref="workorder-viewer" id="workorder-viewer" size="xl" scrollable title="Workorder">
      <iframe :src="this.workorderURL" style="min-height:720px; width: 100%;"></iframe>
      <template #modal-footer="{ ok }">
        <div class="flex-columns">
          <b-button size="sm">download pdf</b-button>
          <b-button size="sm">print</b-button>
          <!-- Emulate built in modal footer ok and cancel button actions -->
          <b-button size="sm" @click="ok()" variant="primary">
            close
          </b-button>
        </div>
      </template>
    </b-modal>
    <div class="flex-columns wrap">
      <div class="panel">
        <h6>
          <strong>{{ order.order_name }}</strong> <em>{{ order.order_type }}</em>
          <div v-if="isLoading">Loading</div>
        </h6>
        <dl>
          <dt>Dates</dt>
          <dd>{{ order.order_date }}</dd>
          <dt>Service &numero;</dt>
          <dd>{{ order.service_number }}</dd>
          <dt>Reference</dt>
          <dd>{{ order.order_reference }}</dd>
          <dt v-if="order.customer_remarks">Remarks</dt>
          <dd v-if="order.customer_remarks">{{ order.customer_remarks }}</dd>
        </dl>
        <hr>

        <h6>Workorder  {{ order.order_id }}</h6>
          <div class="flex-columns">
            <b-link class="" @click="openWorkorder()" target="_blank">
              <b-icon icon="file-earmark"></b-icon>{{ $trans('View workorder') }}
            </b-link>
            <button @click="showWorkorderDialog()"></button>
            &nbsp;
            <b-link class="" :href="order.workorder_pdf_url" target="_blank" :title="$trans('Download PDF') + ' (' + order.workorder_pdf_url + ')'">
              <b-icon icon="file-earmark-pdf"></b-icon>{{ $trans('Download PDF') }}
            </b-link>
          </div>
          <br>
          <div class="flex-columns">
            <b-button
              v-if="!past && !isCustomer && !isBranchEmployee"
              id="recreateWorkorderPdfButton"
              @click="recreateWorkorderPdf"
              :disabled="buttonDisabled"
              class="btn btn-secondary"
              type="button"
              variant="secondary"
            >
              {{ $trans('Generate PDF') }}
            </b-button>
            <b-button
              v-if="!past && !isCustomer && !isBranchEmployee"
              id="recreateWorkorderPdfButtonGotenberg"
              @click="recreateWorkorderPdfGotenberg"
              :disabled="buttonDisabled"
              class="btn btn-secondary"
              type="button"
              variant="secondary"
            >
              {{ $trans('re-generate PDF (new)') }}
            </b-button>
          </div>
        <hr>

        <h6>{{ $trans('Documents') }}</h6>
        <div class="my-2" v-if="order.workorder_documents.length > 0">
          <ul class="listing">
            <li v-for="doc in order.workorder_documents" :key="doc.url">
              <a class="listing-item" :href="doc.url" target="_blank">
                <span>{{ doc.name}}</span>
              </a>
            </li>
          </ul>
        </div>
        <div v-else>
          <p>No documents. </p>
        </div>

        <h6>Orderlines</h6>
        <ul class="listing" v-if="order.orderlines.length">
          <li v-for="line in order.orderlines" :key="line.id">
            <div class="listing-item flex-columns">
              <div>{{ line.product  }}</div>
              <div>{{ line.remarks  }}</div>
              <div>{{ line.location  }}</div>
            </div>
          </li> 
        </ul>
      </div>

      <div class="panel">
        <h6>Timeline</h6>
        <ul class="listing" style="max-height: 75vh; overflow: auto;">
          <li v-for="status in order.statuses.slice().reverse()" :key="status.id">
            <div class="listing-item">
              <span>{{ status.status }}</span>
              <span class="dimmed">{{ status.created }}</span> 
            </div>
          </li>
        </ul>
      </div>

      <div class="panel">
        <h6>Contact</h6>
        <p>
          {{ order.order_contact }}<br/>
          {{ order.order_tel }} {{ order.order_mobile }}<br/>
          <b-link v-bind:href="`mailto:${order.order_email}`">{{ order.order_email }}</b-link>
        </p>
        <hr>
        <address>
          {{ order.order_name }}<br />
          {{ order.order_address }}<br />
          {{ order.order_postal }}<br />
          {{ order.order_city }}, {{ order.order_country_code }}
        </address>
        <hr>
        <b-table  v-if="!isCustomer && !hasBranches && order.infolines.length > 0" borderless small :fields="infoLineFields" :items="order.infolines" responsive="sm"></b-table>
        
        <b-row class="my-2" v-if="order.workorder_documents_partners && order.workorder_documents_partners.length > 0">
          <b-col cols="12">
            <h6>{{ $trans('Workorder documents partner') }}</h6>
            <b-table borderless small :fields="workorderDocumentFields" :items="order.workorder_documents_partners" responsive="sm">
              <template #cell(url)="data">
                <b-link class="px-1" :href="data.item.url" target="_blank">
                  {{ $trans('Order') }} {{ order.order_id }}
                </b-link>
              </template>
            </b-table>
          </b-col>
        </b-row>
        <b-row v-if="order.reported_codes_extra_data.length">
          <b-col cols="12">
            <h6>{{ $trans('Reported extra text') }}</h6>
            <b-table
              borderless
              small
              id="extra-data-table"
              :fields="extraDataFields"
              :items="order.reported_codes_extra_data"
              responsive="sm"
            ></b-table>
          </b-col>
      </b-row>
      </div>
    </div>
  </div>
</template>

<script>
import orderModel from '@/models/orders/Order.js'
import { componentMixin } from '@/utils'

export default {
  mixins: [componentMixin],
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      order: orderModel.getFields(),
      workorderURL: '',
      orderLineFields: [
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Infolines') }
      ],
      workorderDocumentFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'url', label: this.$trans('URL') },
      ],
      extraDataFields: [
        { key: 'statuscode', label: this.$trans('Status') },
        { key: 'extra_data', label: this.$trans('Text') },
      ]
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    uuid: {
      type: [String],
      default: null
    },
    past: {
      type: [Boolean],
      default: false
    },
  },
  methods: {
    openWorkorder() {
      const routeData = this.$router.resolve({ name: 'workorder-view', params: { uuid: this.order.uuid } })
      window.open(`${document.location.origin}/${routeData.href}`, '_blank')
    },
    getWorkorderURL() {
      const routeData = this.$router.resolve({ name: 'workorder-view', params: { uuid: this.order.uuid } })
      return `${document.location.origin}/${routeData.href}`;
    },
    showWorkorderDialog() {
      this.workorderURL = this.getWorkorderURL();
      this.$refs['workorder-viewer'].show()
    },
    async recreateWorkorderPdf() {
      this.isLoading = true
      this.buttonDisabled = true

      try {
        await orderModel.recreateWorkorderPdf(this.pk)
        this.infoToast(this.$trans('Success'), this.$trans('Workorder recreated'))
        this.isLoading = false
        this.buttonDisabled = false
        await this.loadOrder()
      } catch(err) {
        console.log('Error recreating workorder', err)
        this.errorToast(this.$trans('Error recreating workorder'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async recreateWorkorderPdfGotenberg() {
      this.isLoading = true
      this.buttonDisabled = true

      try {
        await orderModel.recreateWorkorderPdfGotenberg(this.pk)
        this.infoToast(this.$trans('Success'), this.$trans('Workorder recreated'))
        this.isLoading = false
        this.buttonDisabled = false
        await this.loadOrder()
      } catch(err) {
        console.log('Error recreating workorder', err)
        this.errorToast(this.$trans('Error recreating workorder'))
        this.buttonDisabled = false
        this.isLoading = false
      }
    },
    async loadOrder() {
      this.isLoading = true

      try {
        this.order = this.pk !== null ? await orderModel.detail(this.pk) : await orderModel.detailUuid(this.uuid)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching order', error)
        this.errorToast(this.$trans('Error fetching order'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadOrder();
  }
}
</script>

<style scoped>
</style>
