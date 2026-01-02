<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New contract') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit contract') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="contract_name"
            >
              <BFormInput
                v-model="contract.name"
                id="contract_name"
                size="sm"
                :state="isSubmitClicked ? !v$.contract.name.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.contract.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
        </b-row>

        <b-row v-if="loaded">
          <b-col cols="12" role="group">
            <ul v-for="module in moduleData" :key="module.id">
              <li>
                <BFormCheckbox
                  :id="`module${module.id}`"
                  :value="`${module.id}`"
                  v-model="selected_modules"
                >
                  {{ module.name }}
                </BFormCheckbox>
                (<BLink @click="selectAll(module.id)">{{ $trans('all') }}</BLink> /
                <BLink @click="selectNone(module.id)">{{ $trans('none') }}</BLink>)
              </li>
              <BFormCheckboxGroup
                v-model="selected[module.id]"
              >
                <ul v-for="part in module.parts" :key="part.id">
                  <li>
                    <BFormCheckbox
                      :id="`el${part.id}`"
                      :value="part.id"
                      @change="checkClicked"
                      :disabled="always_selected[module.id] && always_selected[module.id].indexOf(part.id) !== -1"
                    >
                      {{ part.name }}
                    </BFormCheckbox>
                  </li>
                </ul>
              </BFormCheckboxGroup>
            </ul>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import contractModel from '@/models/member/Contract.js'

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      loaded: false,
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      moduleData: {},
      selected: {},
      selected_modules: [],
      always_selected: {},
      contract: contractModel.getFields(),
    }
  },
  validations: {
    contract: {
      name: {
        required,
      },
    },
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    this.isLoading = true

    const module_data = await contractModel.getModuleData()

    let moduleData = {}, selected = {}
    for (let i=0; i<module_data.length; i++) {
      const module_id = module_data[i].id+''
      let parts = []
      let always_selected = []
      for (let j=0; j<module_data[i].parts.length; j++) {
        module_data[i].parts[j].id += ''
        parts.push(module_data[i].parts[j])
        if (module_data[i].parts[j].is_always_selected) {
          always_selected.push(module_data[i].parts[j].id)
        }
      }

      moduleData[module_id] = {
        id: module_id,
        name: module_data[i].name,
        parts
      }

      selected[module_id] = []
      if (always_selected.length) {
        this.always_selected[module_id] = always_selected
      }
    }
    this.selected = selected
    this.moduleData = moduleData

    if (!this.isCreate) {
      await this.loadData()
      this.isLoading = false
      this.loaded = true
    } else {
      this.contract = contractModel.getFields()
      this.checkAlwaysSelected()
      this.isLoading = false
      this.loaded = true
    }
  },
  methods: {
    checkClicked() {
      this.checkModuleCheckboxes()
    },
    selectNone(module_id) {
      this.selected[module_id] = []
      this.checkModuleCheckboxes()
    },
    selectAll(module_id) {
      this.selected[module_id] = this.moduleData[module_id].parts.map(
        item => item.id
      )
      this.checkModuleCheckboxes()
    },
    getPartsLengthForModuleId(module_id) {
      for (let i=0; i<this.moduleData.length; i++) {
        if (parseInt(this.moduleData[i].id) === parseInt(module_id)) {
          return this.moduleData[i].parts.length
        }
      }
      throw(`module_id "${module_id}" not found`)
    },
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid, this.v$)
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      this.contract.module_paths_pks = this.getPathsFromModel()

      this.buttonDisabled = true

      if (this.isCreate) {
        this.isLoading = true
        try {
          await contractModel.insert(this.contract)
          infoToast(this.create, $trans('Created'), $trans('contract has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating contract', error)
          errorToast(this.create, $trans('Error creating contract'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        this.isLoading = true

        await contractModel.update(this.pk, this.contract)
        infoToast(this.create, $trans('Updated'), $trans('contract has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating contract', error)
        errorToast(this.create, $trans('Error updating contract'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      try {
        this.contract = await contractModel.detail(this.pk)
        this.fillSelected(this.contract.module_paths_pks)
      } catch(error) {
        console.log('error fetching contract', error)
        errorToast(this.create, $trans('Error fetching contract'))
      }
    },
    getPathsFromModel() {
      let paths = [];
      for (const [module_id, parts] of Object.entries(this.selected)) {
        if (parts.length) {
          paths.push(module_id + ':' + parts.join(','))
        }
      }

      return paths.join('|')
    },
    fillSelected(module_paths_pks) {
      const moduleElements = module_paths_pks.split('|')
      for (let i=0; i<moduleElements.length; i++) {
        const moduleElement = moduleElements[i].split(':')
        const module_id = moduleElement[0]
        let parts = []
        for (let j=0, p=moduleElement[1].split(','); j<p.length; j++) {
          parts.push(p[j] + '')
        }
        this.selected[module_id+''] = parts

        if (parts.length) {
          this.selected_modules.push(module_id)
        }
      }

      this.checkAlwaysSelected()
      this.checkModuleCheckboxes()
    },
    checkAlwaysSelected() {
      // make sure the always selected ones are also checked
      for (const [module_id, always_selected_parts] of Object.entries(this.always_selected)) {
        for (let k=0; k<always_selected_parts.length; k++) {
          if (!(module_id+'' in this.selected)) {
            this.selected[module_id+''] = []
          }
          if (this.selected_modules.indexOf(module_id+'') === -1) {
            this.selected_modules.push(module_id)
          }
          if (this.selected[module_id+''].indexOf(always_selected_parts[k]+'') === -1) {
            this.selected[module_id+''].push(always_selected_parts[k]+'')
          }
        }
      }
    },
    checkModuleCheckboxes() {
      this.selected_modules = []
      for (const [module_id, parts] of Object.entries(this.selected)) {
        if (parts.length) {
          this.selected_modules.push(module_id)
        }
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
ul {
  list-style-type: none;
}
</style>
