<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="subnav-pills">
      <PillsCompanyCompany />
    </div>
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Settings') }}</h2>
        <b-table-simple>
          <b-thead>
            <b-td><strong>{{ $trans('Key') }}:</strong></b-td>
            <b-td>{{ $trans('Value') }}</b-td>
          </b-thead>
          <tbody>
            <template v-for = "(value, key, index) in settings">
              <b-tr :key="key">
                <b-td>
                  {{ index+1 }}: {{ key }}
                </b-td>
                <b-td class="border px-4 py-2">
		              <b-form-checkbox
		              	v-if="typeof value === 'boolean'"
                    size="sm"
		                v-model="settings[key]"
		              >
		              </b-form-checkbox>
                  <b-form-input
		              	v-if="typeof value !== 'boolean'"
                    size="sm"
                    v-model="settings[key]"
                  ></b-form-input>
                </b-td>
                <b-td>
                </b-td>
              </b-tr>
            </template>
          </tbody>
        </b-table-simple>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import PillsCompanyCompany from "@/components/PillsCompanyCompany.vue"
import memberModel from '@/models/member/Member.js'

export default {
  components: {
    PillsCompanyCompany,
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      settings: {},
      dummy: [],
      settingsFields: [
        { key: 'key', label: this.$trans('Key') },
        { key: 'value', label: this.$trans('Value') },
      ],
      member: memberModel.getFields(),
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    this.loadData()
  },
  methods: {
  	toForm(values) {
  		let newValues = {}

	    for (let [key, value] of Object.entries(values)) {
        if (key === 'countries' || key === 'order_types') {
          newValues[key] = value.join(',')
        } else {
        	newValues[key] = value
        }
      }

      return newValues
  	},
  	fromForm(values) {
  		let newValues = {}

	    for (let [key, value] of Object.entries(values)) {
        if (key === 'countries' || key === 'order_types') {
          if (typeof value !== 'string') {
          	throw(`expecting a string, got: ${typeof value}`)
          }

          newValues[key] = value.split(',')
        } else {
        	newValues[key] = value
        }
      }

      return newValues
  	},
    async submitForm() {
      this.submitClicked = true
      this.buttonDisabled = true
      this.isLoading = true
      const newValues = this.fromForm(this.settings)

      try {
        await memberModel.updateSettings(newValues)
        this.infoToast(this.$trans('Updated'), this.$trans('Settings updated'))
        this.buttonDisabled = false
        this.isLoading = false
      } catch() {
        this.errorToast(this.$trans('Error updating settings'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await memberModel.getSettings()
        this.settings = this.toForm(data)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching settings', error)
        this.errorToast(this.$trans('Error fetching settings'))
        this.isLoading = false
      }
    },
  }
}
</script>
