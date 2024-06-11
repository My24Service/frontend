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
              v-for="(obj, index) in pills" :key="index"
              v-model="activePill"
            >
              <b-tab :title="obj.title">
                <b-card-text>
                  <h4>{{ importData[obj.key].length }} {{ $trans("entries") }}</h4>
                  <b-table
                    small
                    :fields="getFields(obj.key)"
                    :items="importData[obj.key]"
                    responsive="md"
                    class="data-table"
                  >
                  </b-table>
                </b-card-text>
              </b-tab>
            </b-tabs>
          </b-card>
          <footer class="modal-footer">
            <b-button @click="cancel" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button
              @click="importAll"
              type="button"
              variant="primary"
            >
              {{ $trans('Import all') }}
            </b-button>
          </footer>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import {ImportService, testData} from "../../models/company/Import";
import {componentMixin} from "../../utils";

export default {
  mixins: [componentMixin],
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
        'customers': this.$trans("Customers"),
        'branches': this.$trans("Branches"),
        'equipment': this.$trans("Equipment"),
        'locations': this.$trans("Locations"),
      },
      activePill: 0,
      branchesFields: [
        {key: 'name', label: this.$trans('Name') },
        {key: 'address', label: this.$trans('Address') },
        {key: 'postal', label: this.$trans('Postal') },
        {key: 'city', label: this.$trans('City') },
        {key: 'country_code', label: this.$trans('Country') },
        {key: 'tel', label: this.$trans('Phone') },
      ],
      customersFields: [
        {key: 'name', label: this.$trans('Name') },
        {key: 'address', label: this.$trans('Address') },
        {key: 'postal', label: this.$trans('Postal') },
        {key: 'city', label: this.$trans('City') },
        {key: 'country_code', label: this.$trans('Country') },
        {key: 'tel', label: this.$trans('Phone') },
      ],
      equipmentFieldsBranches: [
        {key: 'customer_branch_view.name', label: this.$trans('Branch') },
        {key: 'name', label: this.$trans('Equipment') },
        {key: 'brand', label: this.$trans('Brand') },
        {key: 'location_name', label: this.$trans('Location')},
      ],
      equipmentFieldsCustomers: [
        {key: 'customer_branch_view.name', label: this.$trans('Customer') },
        {key: 'name', label: this.$trans('Equipment') },
        {key: 'brand', label: this.$trans('Brand') },
        {key: 'location_name', label: this.$trans('Location')},
      ],
      locationFieldsCustomers: [
        {key: 'name', label: this.$trans('Name') },
        {key: 'customer_branch_view.name', label: this.$trans('Customer')},
      ],
      locationFieldsBranches: [
        {key: 'name', label: this.$trans('Name') },
        {key: 'customer_branch_view.name', label: this.$trans('Branch')},
      ],
    }
  },
  async created() {
    this.isLoading = true

    // this.importData = await this.service.previewImport(this.pk)
    this.importData = testData
    // let dataItems = []
    for (const key of Object.keys(this.availablePills)) {
      if (this.importData.hasOwnProperty(key) && this.importData[key].length > 0) {
        // dataItems.push(key)
        this.pills.push({
          title: this.availablePills[key],
          key
        })
      }
    }
    console.log(this.pills)

    // this.activePill = 1
    this.isLoading = false
  },
  methods: {
    async importAll() {
      const finalData = await this.service.doImport(this.pk)
      console.log(`final data: ${finalData}`)
      this.importData = finalData
    },
    cancel() {
      this.$router.go(-1)
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
        default:
          throw `Unknown field type: ${key} for has branches=${this.hasBranches}`
      }
    }
  },
}
</script>

<style scoped>
</style>
