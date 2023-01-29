<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New module part') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit module part') }}</h2>
        <b-row>
          <b-col cols="6" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="module-part_name"
            >
              <b-form-input
                v-model="modulePart.name"
                id="module-part_name"
                size="sm"
                autofocus
                :state="isSubmitClicked ? !v$.modulePart.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.modulePart.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Module')"
              label-for="module-part_module"
            >
              <b-form-select v-model="modulePart.module" :options="modules" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Always selected?')"
              label-for="module-part_is_always_selected"
            >
              <b-form-checkbox
                id="module-part_is_always_selected"
                size="sm"
                v-model="modulePart.is_always_selected"
              >
              </b-form-checkbox>
            </b-form-group>
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

import modulePartModel from '@/models/member/ModulePart.js'
import moduleModel from '@/models/member/Module.js'

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
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      modules: [],
      modulePart: modulePartModel.getFields(),
    }
  },
  validations: {
    modulePart: {
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

    const data = await moduleModel.list()

    let modules = []
    for (let i=0; i<data.results.length; i++) {
      modules.push({
        value: data.results[i].id,
        text: data.results[i].name,
      })
    }
    this.modules = modules

    if (!this.isCreate) {
      await this.loadData()
      this.isLoading = false
    } else {
      this.modulePart = modulePartModel.getFields()
      this.modulePart.module = this.modules[0].value
      this.isLoading = false
    }
  },
  methods: {
    async submitForm() {
      this.submitClicked = true
      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid, this.v$)
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      this.buttonDisabled = true

      if (this.isCreate) {
        this.isLoading = true
        try {
          await modulePartModel.insert(this.modulePart)
          this.infoToast(this.$trans('Created'), this.$trans('Module part has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating module part', error)
          this.errorToast(this.$trans('Error creating module part'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        this.isLoading = true

        await modulePartModel.update(this.pk, this.modulePart)
        this.infoToast(this.$trans('Updated'), this.$trans('Module part has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating module part', error)
        this.errorToast(this.$trans('Error updating module part'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true
      try {
        this.modulePart = await modulePartModel.detail(this.pk)
        this.isLoading = false
      } catch {
        this.errorToast(this.$trans('Error fetching module part'))
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
</style>
