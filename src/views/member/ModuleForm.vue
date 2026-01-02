<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New module') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit module') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="module_name"
            >
              <BFormInput
                v-model="module.name"
                id="module_name"
                size="sm"
                autofocus
                :state="isSubmitClicked ? !v$.module.name.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.module.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </BFormGroup>
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
      moduleData: {},
      selected: {},
      module: moduleModel.getFields(),
    }
  },
  validations: {
    module: {
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

    if (!this.isCreate) {
      await this.loadData()
      this.isLoading = false
    } else {
      this.module = moduleModel.getFields()
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
          await moduleModel.insert(this.module)
          infoToast(this.create, $trans('Created'), $trans('Module has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating module', error)
          errorToast(this.create, $trans('Error creating module'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        this.isLoading = true

        await moduleModel.update(this.pk, this.module)
        infoToast(this.create, $trans('Updated'), $trans('Module has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating module', error)
        errorToast(this.create, $trans('Error updating module'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true
      try {
        this.module = await moduleModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching module', error)
        errorToast(this.create, $trans('Error fetching module'))
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
