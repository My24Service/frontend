<template>
  <div class="container app-form">
    <b-form>
      <h2>{{ $trans('Upload customer data') }}</h2>
      <b-row>
        <b-col cols="8" role="group">
          <b-form-group
            label-size="sm"
            v-bind:label="$trans('File')"
            label-for="customer-upload-file"
          >
            <b-form-file
              id="customer-upload-file"
              v-model="file"
              v-bind:placeholder="$trans('Choose a file or drop it here...')"
              @input="fileSelected"
            ></b-form-file>
            {{ current_file }}
          </b-form-group>
        </b-col>
      </b-row>
      <div class="mx-auto">
        <footer class="modal-footer">
          <b-button
            @click="submitForm"
            type="button"
            variant="primary"
            :disabled="isSubmitOk"
          >
            {{ $trans('Submit') }}</b-button>
        </footer>
      </div>
    </b-form>
    <div v-if="created">
      {{ headers }}
      <table>
        <tr v-for="head in Object.keys(headers)">
          <td width="150">{{head}}</td>
          <td width="500">
            <multiselect
              :searchable="false"
              :options="availableColumns"
              :value="headers[head]"
              :show-labels="false"
              @select="function(option) { selectColumn(head, option) }"
            />
          </td>
        </tr>
      </table>
      <table>
        <thead>
          <th v-for="head in Object.keys(headers)">
            {{ headers[head] }}
          </th>
        </thead>
        <tbody>
          <tr v-for="line of records">
            <td v-for="col in line">
              {{ col }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</template>

<script>
import {CustomerUpload, CustomerUploadService} from '../../models/customer/Upload.js'

import Multiselect from "vue-multiselect";
import {CustomerModel} from "@/models/customer/Customer";
export default {
  components: {Multiselect},
  computed: {
    availableColumns() {
      return this.columns.filter((field) =>
        Object.values(this.headers).indexOf(field) === -1
      )
    }
  },
  data() {
    return {
      file: null,
      current_file: null,
      base64data: null,
      service: new CustomerUploadService(),
      created: new CustomerUpload({}),
      isSubmitOk: false,
      records: [],
      headers: {},
      bla: {},
      columns: ['customer_id', 'name', 'address']
    }
  },
  methods: {
    selectColumn(key, column) {
      const val = {}
      val[key] = column
      this.headers = {
        ...this.headers,
        ...val
      }
    },
    getExtension(filename) {
      const parts = filename.split('.')
      return parts[parts.length-1].toLowerCase()
    },
    fileSelected(file) {
      const reader = new FileReader()
      const allowed_extensions = ['xls']
      reader.onload = (f) => {
        const b64 = f.target.result
        const extension = this.getExtension(file.name)
        this.isSubmitOk = allowed_extensions.indexOf(extension) === -1
        this.current_file = file.name
        this.base64data = b64
      }

      reader.readAsDataURL(file)
    },
    async submitForm() {
      const data = {
        file: this.base64data
      }

      const customer = new CustomerModel({})
      const exclude = [
        'default_currency', 'id', 'products_without_tax', 'maintenance_contract',
        'standard_hours_hour', 'standard_hours_minute', 'branch_partner', 'branch_id',
        'use_branch_address', 'call_out_costs', 'call_out_costs_currency', 'hourly_rate_engineer',
        'hourly_rate_engineer_currency', 'hourly_rate_partner_engineer', 'hourly_rate_partner_engineer_currency',
        'price_per_km', 'price_per_km_currency', 'priceFields', 'time', 'time2', 'timealt', 'timealt2',
        'customer_id'
      ]

      this.columns = Object.keys(customer).filter((field) => exclude.indexOf(field) === -1)

      this.created = await this.service.insert(data)
      // this.created = await this.service.detail(2)
      const records = await this.service.readHead(this.created.id)
      for (const header of Object.keys(records[0])) {
        this.headers[header] = '-'
      }

      this.records = records
    }
  },
  async beforeDestroy() {
    // delete created entry
    if (this.created.id) {
      await this.service.delete(this.created.id)
    }
  }
}
</script>

<style scoped>

</style>
