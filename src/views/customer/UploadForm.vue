<template>
  <div class="container app-form">
    <b-form v-if="isCreate">
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
          <b-button @click="cancelForm" type="button" variant="secondary">
            {{ $trans('Cancel') }}</b-button>
          <b-button
            @click="submitForm"
            type="button"
            variant="primary"
            :disabled="isSubmitDisabled"
          >
            {{ $trans('Submit') }}
          </b-button>
        </footer>
      </div>
    </b-form>
    <div v-if="!isCreate && !isLoading">
      <div>
        <ul>
          <li>country_code: NL, BE, DE, etc.</li>
          <li>external_identifier: {{ $trans("internal ID used by company ") }}</li>
          <li>{{ $trans("Required fields") }}: {{ required.join(', ') }}</li>
        </ul>
      </div>
      <div v-if="missing.length" class="missing">
        {{ $trans("Missing fields") }}: {{ missing.join(', ') }}
      </div>
      <table>
        <tr>
          <th class="mapping_header_upload_field">{{ $trans('Upload field') }}</th>
          <th class="mapping_header_db_field">{{ $trans('Database field') }}</th>
          <th class="mapping_header_filter_field">{{ $trans('Use in filter?') }}</th>
        </tr>
        <tr v-for="head in Object.keys(customerUpload.mapping)" :key="head">
          <td class="mapping_td">{{ head }}</td>
          <td class="mapping_td">
<!--            <b-form-select-->
<!--              v-model="customerUpload.mapping[head]"-->
<!--              :options="availableColumns"-->
<!--              size="sm"-->
<!--            ></b-form-select>-->
            <multiselect
              :searchable="false"
              :options="availableColumns"
              :value="customerUpload.mapping[head]"
              :show-labels="false"
              @select="function(option) { selectColumn(head, option) }"
            />
          </td>
          <td class="mapping_td" style="text-align: center">
            <b-form-checkbox
              :value="head"
              v-model="customerUpload.filter_on"
            >
            </b-form-checkbox>
          </td>
        </tr>
      </table>
      <div class="mx-auto">
        <footer class="modal-footer">
          <b-button
            @click="submitUpdatePreview"
            type="button"
            variant="primary"
            :disabled="isUpdatePreviewDataDisabled"
          >
            {{ $trans('Save & preview') }}</b-button>
        </footer>
      </div>
      <div v-if="previewData">
        <p>{{ $trans("New customers") }}: <b>{{ previewData.num_insert }}</b></p>
        <p>{{ $trans("Existing customers") }}: <b>{{ previewData.num_existing }}</b></p>
        <div v-if="previewData.num_existing">
          <h3>{{ $trans("Existing customers")}}</h3>
          <table>
            <tr>
              <th>&nbsp;</th>
              <th style="width: 80px" v-for="(head, index) in Object.keys(customerUpload.mapping)" :key="`head-${index}`">
                {{ head }}
              </th>
            </tr>
          </table>
          <table v-for="(existingItem, index) of existingData" :key="`table-${index}`">
            <tr>
              <td class="preview-col">{{ $trans("Upload row") }}</td>
              <td class="preview-col" v-for="(col, index2) of existingItem.upload_row" :key="`${col}-${index}-${index2}`">
                {{ col }}
              </td>
            </tr>
            <tr v-for="(db_row, index3) of existingItem.database_rows" :key="`db_row-${index}-${index3}`">
              <td class="preview-col">{{ $trans("Database row") }}</td>
              <td class="preview-col" v-for="(col, index2) of db_row" :key="`${col}-${index}-${index2}-${index3}`">
                {{ col }}
              </td>
            </tr>
          </table>
        </div>
        <div v-if="errors.length">
          <h3>{{ $trans("Empty fields")}}</h3>
          <table>
            <tr v-for="(missing, index) of errors" :key="`missing-${index}`">
              <td>
                <div>
                  {{ $trans("Name")}}: <b>{{ missing.name }}</b><br/>
                  {{ $trans("fields") }}: <b><i>{{ missing.empty }}</i></b>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";

import {CustomerUpload, CustomerUploadService} from '@/models/customer/Upload'
import {CustomerModel} from "@/models/customer/Customer";

export default {
  components: {Multiselect},
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitDisabled() {
      if (!this.current_file) {
        return true
      }

      const allowed_extensions = ['xls']
      const extension = this.getExtension(this.current_file)
      return this.customerUpload.file === null && allowed_extensions.indexOf(extension) === -1
    },
    availableColumns() {
      // return this.columns;
      return this.columns.filter((field) =>
        Object.values(this.customerUpload.mapping).indexOf(field) === -1
      )
    },
    missing() {
      if (!this.customerUpload.mapping) {
        return []
      }

      const chosenFields = Object.values(this.customerUpload.mapping)
      return this.required.filter((field) => chosenFields.indexOf(field) === -1)
    },
    isUpdatePreviewDataDisabled() {
      return this.missing.length > 0
    }
  },
  data() {
    return {
      file: null,
      current_file: null,
      base64data: null,
      service: new CustomerUploadService(),
      customerUpload: new CustomerUpload({}),
      columns: [],
      previewData: null,
      required: [],
      existingData: [],
      errors: [],
      isPreviewLoading: false,
      isLoading: true,
    }
  },
  async created() {
    if (this.isCreate) {
      // not really stuff to do here
    } else {
      this.isLoading = true
      this.required = await this.service.fetchRequired()

      // load
      this.customerUpload = await this.service.detail(this.pk)
      // define this here and not in the backend because the JS model contains more fields
      const exclude = [
        'default_currency', 'id', 'products_without_tax', 'maintenance_contract',
        'standard_hours_hour', 'standard_hours_minute', 'branch_partner', 'branch_id',
        'use_branch_address', 'call_out_costs', 'call_out_costs_currency', 'hourly_rate_engineer',
        'hourly_rate_engineer_currency', 'hourly_rate_partner_engineer', 'hourly_rate_partner_engineer_currency',
        'price_per_km', 'price_per_km_currency', 'priceFields', 'time', 'time2', 'timealt', 'timealt2',
        'customer_id'
      ]

      // set our available database columns
      const customer = new CustomerModel(({}))
      this.columns = Object.keys(customer).filter((field) => exclude.indexOf(field) === -1)

      // create mapping data
      // const line = await this.service.readHead(this.pk)
      // if (Object.keys()
      // for (const header of Object.keys(line)) {
      //   this.customerUpload.mapping[header] = '-'
      // }

      this.isLoading = false
    }
  },
  methods: {
    selectColumn(key, column) {
      console.log(key, column)
      const val = {}
      val[key] = column
      this.customerUpload.mapping = {
        ...this.customerUpload.mapping,
        ...val
      }
    },
    getExtension(filename) {
      const parts = filename.split('.')
      return parts[parts.length-1].toLowerCase()
    },
    fileSelected(file) {
      const reader = new FileReader()

      reader.onload = (f) => {
        const b64 = f.target.result
        this.current_file = file.name
        this.customerUpload.file = b64
      }

      reader.readAsDataURL(file)
    },
    async submitUpdatePreview() {
      this.isPreviewLoading = true
      delete this.customerUpload.file
      await this.service.update(this.pk, this.customerUpload)
      this.previewData = await this.service.previewUpload(this.pk)

      // transform existing
      const headers = Object.keys(this.customerUpload.mapping)
      this.existingData = []

      /*
      {
            'num_update': num_update,
            'num_insert': num_insert,
            'updates': {
              {name}: {
                        'upload_rec': rec,
                        'num_entries': len(entries),
                        'entries': serializers.CustomerSerializer(data=entries, many=True).data,
                        'seen': 1
                      }
            }
            'errors': [
              {
                'upload_rec': rec,
                'empty_fields': []
              }
            ]
        }
       */
      for (const name of Object.keys(this.previewData.updates)) {
        let row = {
          upload_row: [],
          database_rows: []
        }

        for (const field of headers) {
          row.upload_row.push(this.previewData.updates[name].upload_rec[field])
        }

        for (const customerData of this.previewData.updates[name].entries) {
          let db_row = []
          for (const field of headers) {
            db_row.push(customerData[this.customerUpload.mapping[field]])
          }
          row.database_rows.push(db_row)
        }

        this.existingData.push(row)
      }

      this.errors = []
      const nameField = Object.keys(this.customerUpload.mapping).find(
        (field) => this.customerUpload.mapping[field] === 'name')
      console.log(nameField)
      for (const row of this.previewData.errors) {
        this.errors.push({
          name: row.upload_rec[nameField],
          empty: row.empty_fields.join(', ')
        })
      }

      this.isPreviewLoading = false
    },
    async submitForm() {
      try {
        const created = await this.service.insert(this.customerUpload)
        await this.$router.push({name: 'customer-upload-edit', params: {pk: created.id}})
      } catch (e) {
        this.errorToast(this.$trans('Error uploading file'))
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  },
  // async beforeDestroy() {
  //   // delete created entry
  //   if (this.created.id) {
  //     await this.service.delete(this.created.id)
  //     this.created = new CustomerUpload({})
  //   }
  // }
}
</script>

<style scoped>
.missing {
  font-size: 16px;
  font-weight: bold;
  padding-bottom: 6px;
  color: red;
}
.mapping_header_upload_field {
  width: 150px;
  padding: 4px
}
.mapping_header_db_field {
  width: 500px;
  padding: 4px
}
.mapping_header_filter_field {
  width: 100px;
  padding: 4px
}
.mapping_td {
  padding: 4px
}
.preview-col {
  width: 100px;
}
</style>
