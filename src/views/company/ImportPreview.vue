<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <b-icon icon="file-arrow-down"></b-icon>
            <span>{{ $trans('Import preview') }}</span>
          </h3>
        </div>
      </header>

      <div class="page-detail import-preview">
        <div class="app-detail">
          <b-card no-body>
            <b-tabs
              pills
              card
            >
              <b-tab
                v-for="(obj, index) in pills" :key="index"
                v-model="activePill"
                :title="obj.title"
              >
                <b-card-text>
                  <h4>{{ importData[obj.key].import.length }} {{ $trans("entries") }}</h4>
                  <p>
                    {{ $trans("Existing records will be checked on") }}:
                    <b><i>{{ lookupFields[obj.key.split('__'[0])].join(', ') }}</i></b>
                  </p>
                  <b-table
                    small
                    :fields="getFields(obj.key)"
                    :items="importData[obj.key].import"
                    responsive="md"
                    class="data-table"
                  >
                    <template #cell(mode)="data">
                      <span v-if="data.item.import_created" class="text-success">
                        {{ $trans("insert" )}}
                      </span>
                      <span v-else class="text-warning">
                        {{ $trans("update" )}}
                      </span>
                    </template>
                  </b-table>
                </b-card-text>
              </b-tab>
            </b-tabs>
          </b-card>
          <footer class="modal-footer">
            <BButton @click="cancel" type="button" variant="secondary">
              {{ $trans('Cancel') }}</BButton>
            <BButton
              @click="importAll"
              type="button"
              variant="primary"
            >
              {{ $trans('Import all') }}
            </BButton>
          </footer>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import {ImportService} from "@/models/company/Import";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {

  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  computed: {
  },
  data() {
    return {
      isLoading: true,
      service: new ImportService(),
      importData: {},
      pills: [],
      availablePills: {
        'customers': $trans("Customers"),
        'branches': $trans("Branches"),
        'equipment': $trans("Equipment"),
        'locations': $trans("Locations"),
        'materials': $trans("Materials"),
        'suppliers': $trans("Suppliers"),
      },
      activePill: 0,
      branchesFields: [
        {key: 'name', label: $trans('Name') },
        {key: 'address', label: $trans('Address') },
        {key: 'postal', label: $trans('Postal') },
        {key: 'city', label: $trans('City') },
        {key: 'country_code', label: $trans('Country') },
        {key: 'tel', label: $trans('Phone') },
        {key: 'mode', label: ''},
      ],
      customersFields: [
        {key: 'name', label: $trans('Name') },
        {key: 'address', label: $trans('Address') },
        {key: 'postal', label: $trans('Postal') },
        {key: 'city', label: $trans('City') },
        {key: 'country_code', label: $trans('Country') },
        {key: 'tel', label: $trans('Phone') },
        {key: 'mode', label: ''},
      ],
      equipmentFieldsBranches: [
        {key: 'customer_branch_view.name', label: $trans('Branch') },
        {key: 'name', label: $trans('Equipment') },
        {key: 'brand', label: $trans('Brand') },
        {key: 'location_name', label: $trans('Location')},
        {key: 'mode', label: ''},
      ],
      equipmentFieldsCustomers: [
        {key: 'customer_branch_view.name', label: $trans('Customer') },
        {key: 'name', label: $trans('Equipment') },
        {key: 'brand', label: $trans('Brand') },
        {key: 'location_name', label: $trans('Location')},
        {key: 'mode', label: ''},
      ],
      locationFieldsCustomers: [
        {key: 'name', label: $trans('Name') },
        {key: 'customer_branch_view.name', label: $trans('Customer')},
        {key: 'mode', label: ''},
      ],
      locationFieldsBranches: [
        {key: 'name', label: $trans('Name') },
        {key: 'customer_branch_view.name', label: $trans('Branch')},
        {key: 'mode', label: ''},
      ],
      materialFields: [
        {key: 'name', label: $trans('Name') },
        {key: 'show_name', label: $trans('Name')},
        {key: 'identifier', label: $trans('Identifier')},
        {key: 'price_purchase_ex', label: $trans('Purchase price ex.')},
        {key: 'price_selling_ex', label: $trans('Selling price ex.')},
        {key: 'supplier_name', label: $trans('Supplier')},
        {key: 'mode', label: ''},
      ],
      suppliersFields: [
        {key: 'name', label: $trans('Name') },
        {key: 'address', label: $trans('Address') },
        {key: 'postal', label: $trans('Postal') },
        {key: 'city', label: $trans('City') },
        {key: 'country_code', label: $trans('Country') },
        {key: 'tel', label: $trans('Phone') },
        {key: 'mode', label: ''},
      ],
      lookupFields: {}
    }
  },
  async created() {
    this.isLoading = true

    const lookupFields = await this.service.fetchLookupFields()

    this.importData = await this.service.previewImport(this.pk)
    for (const key of Object.keys(this.availablePills)) {
      if (this.importData.hasOwnProperty(key)) {
        this.pills.push({
          title: this.availablePills[key],
          key
        })
        this.lookupFields[key] = lookupFields[key]
      }
    }

    this.isLoading = false
  },
  methods: {
    async importAll() {
      if (confirm($trans("Import these records?"))) {
        try {
          await this.service.doImport(this.pk)
          infoToast(create, $trans('Imported'), $trans('Data has been imported'))
          await this.$router.push({name: 'company-import-list'})
        } catch (error) {
          console.log('Error importing data', error)
          errorToast(create, $trans('Error importing data'))
        }
      }
    },
    async cancel() {
      await this.$router.push({name: 'company-import-list'})
    },
    getFields(key) {
      switch (key) {
        case "customers":
          return this.customersFields
        case "branches":
          return this.branchesFields
        case "equipment":
          if (!this.hasBranches) {
            return this.equipmentFieldsCustomers
          } else {
            return this.equipmentFieldsBranches
          }
        case "locations":
          if (!this.hasBranches) {
            return this.locationFieldsCustomers
          } else {
            return this.locationFieldsBranches
          }
        case "materials":
          return this.materialFields
        case "suppliers":
          return this.suppliersFields
        default:
          throw `Unknown field type: ${key} for has branches=${this.hasBranches}`
      }
    }
  },
}
</script>

<style scoped>
</style>
