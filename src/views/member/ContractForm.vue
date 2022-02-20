<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New contract') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit contract') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="contract_name"
            >
              <b-form-input
                v-model="contract.name"
                id="contract_name"
                size="sm"
                :state="isSubmitClicked ? !v$.contract.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.contract.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row v-if="loaded">
          <b-col cols="12" role="group">
            <ul v-for="module in moduleData" :key="module.id">
              <li>
                {{ module.name }}
                (<b-link @click="selectAll(module.id)">{{ $trans('all') }}</b-link> /
                <b-link @click="selectNone(module.id)">{{ $trans('none') }}</b-link>)
              </li>
              <b-form-checkbox-group
                v-model="selected[module.id]"
              >
                <ul v-for="part in module.parts" :key="part.id">
                  <li>
                    <b-form-checkbox
                      :id="`el${part.id}`"
                      :value="part.id"
                    >
                      {{ part.name }}
                    </b-form-checkbox>
                  </li>
                </ul>
              </b-form-checkbox-group>
            </ul>
          </b-col>
        </b-row>

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </b-button>
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
    contractModel.getModuleData().then((data) => {
      let moduleData = {}, selected = {}
      for (var i=0; i<data.length; i++) {
        const module_id = data[i].id+''
        let parts = []
        for (let j=0; j<data[i].parts.length; j++) {
          data[i].parts[j].id += ''
          parts.push(data[i].parts[j])
        }
        moduleData[module_id] = {
          id: module_id,
          name: data[i].name,
          parts
        }
        selected[module_id] = []
      }
      this.selected = selected
      this.moduleData = moduleData

      if (!this.isCreate) {
        await this.loadData()
        this.isLoading = false
        this.loaded = true
      } else {
        this.contract = contractModel.getFields()
        this.isLoading = false
        this.loaded = true
      }
    })
  },
  methods: {
    selectNone(module_id) {
      this.selected[module_id] = []
    },
    selectAll(module_id) {
      this.selected[module_id] = this.moduleData[module_id].parts.map(
        item => item.id
      )
    },
    getPartsLengthForModuleId(module_id) {
      for (let i=0; i<this.moduleData.length; i++) {
        if (parseInt(this.moduleData[i].id) === parseInt(module_id)) {
          return this.moduleData[i].parts.length
        }
      }
      throw(`module_id "${module_id}" not found`)
    },
    submitForm() {
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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          contractModel.insert(token, this.contract).then((contract) => {
            this.infoToast(this.$trans('Created'), this.$trans('contract has been created'))
            this.buttonDisabled = false
            this.isLoading = false
            this.$router.go(-1)
          }).catch(() => {
            this.errorToast(this.$trans('Error creating contract'))
            this.buttonDisabled = false
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        this.isLoading = true

        contractModel.update(token, this.pk, this.contract).then(() => {
          this.infoToast(this.$trans('Updated'), this.$trans('contract has been updated'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        }).catch(() => {
          this.errorToast(this.$trans('Error updating contract'))
          this.isLoading = false
          this.buttonDisabled = false
        })
      })
    },
    async loadData() {
      try {
        this.contract = await contractModel.detail(this.pk)
        this.fillSelected(contract.module_paths_pks)
      } catch(error) {
        console.log('error fetching contract', error)
        this.errorToast(this.$trans('Error fetching contract'))
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
      let selected = {}
      const moduleElements = module_paths_pks.split('|')
      for (let i=0; i<moduleElements.length; i++) {
        const moduleElement = moduleElements[i].split(':')
        const module_id = moduleElement[0]
        let parts = []
        for (let j=0, p=moduleElement[1].split(','); j<p.length; j++) {
          parts.push(p[j] + '')
        }
        this.selected[module_id+''] = parts
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
