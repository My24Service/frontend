<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New module') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit module') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="module_name"
            >
              <b-form-input
                v-model="module.name"
                id="module_name"
                size="sm"
                autofocus
                :state="isSubmitClicked ? !v$.module.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.module.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
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
  created() {
    this.isLoading = true

    if (!this.isCreate) {
      this.loadData(() => {
        this.isLoading = false
      })
    } else {
      this.module = moduleModel.getFields()
      this.isLoading = false
    }
  },
  methods: {
    submitForm() {
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
        return this.$store.dispatch('getCsrfToken').then((token) => {
          moduleModel.insert(token, this.module).then((module) => {
            this.flashMessage.show({
              status: 'info',
              title: this.$trans('Created'),
              message: this.$trans('Module has been created')
            })

            this.buttonDisabled = false
            this.isLoading = false
            this.$router.go(-1)
          }).catch(() => {
            this.flashMessage.show({
              status: 'error',
              title: this.$trans('Error'),
              message: this.$trans('Error creating module')
            })

            this.buttonDisabled = false
            this.isLoading = false
          })
        })
      }

      this.$store.dispatch('getCsrfToken').then((token) => {
        this.isLoading = true

        moduleModel.update(token, this.pk, this.module).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Updated'),
            message: this.$trans('Module has been updated')
          })

          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error updating module')
          })

          this.isLoading = false
          this.buttonDisabled = false
        })
      })
    },
    loadData(cb) {
      moduleModel.detail(this.pk).then((module) => {
        this.module = module
        cb()
      }).catch((error) => {
        console.log('error fetching module', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching module')
        })
        cb()
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
</style>
