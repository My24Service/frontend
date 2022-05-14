<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New picture') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit picture') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-for="picture_name"
            >
              <b-form-input
                v-model="picture.name"
                id="picture_name"
                size="sm"
                :state="isSubmitClicked ? !v$.picture.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.picture.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Image')"
              label-for="picture-image"
            >
              <b-form-file
                id="picture-image"
                accept="image/*"
                :placeholder="$trans('Choose a file or drop it here...')"
                @input="imageSelected"
              ></b-form-file>
            </b-form-group>
          </b-col>
          <b-col cols="4">
            <h3>{{ $trans('Current image') }}</h3>
            <img width="200px" :src="current_image" alt=""/>
          </b-col>
          <b-col cols="4">
            <h3>{{ $trans('Upload preview') }}</h3>
            <img width="200px" :src="upload_preview" alt=""/>
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

import pictureModel from '@/models/company/Picture.js'

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
      picture: pictureModel.getFields(),
      errorMessage: null,
      current_image: '/static/core/img/noimg.png',
      upload_preview: '/static/core/img/noimg.png',
      fileChanged: false
    }
  },
  validations: {
    picture: {
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
    if (!this.isCreate) {
      this.loadData()
    } else {
      this.picture = pictureModel.getFields()
    }
  },
  methods: {
    imageSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.upload_preview = b64
        this.picture.picture = b64
      }

      reader.readAsDataURL(file)
      this.fileChanged = true
    },
    await submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      if (this.isCreate) {
        try {
          await pictureModel.insert(this.picture)
          this.infoToast(this.$trans('Created'), this.$trans('Picture has been created'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch() {
          this.errorToast(this.$trans('Error creating picture'))
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        if (!this.fileChanged) {
          delete this.picture.image
        }

        try {
          await pictureModel.update(this.pk, this.picture)
          this.infoToast(this.$trans('Updated'), this.$trans('Picture has been updated'))
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch() {
          this.errorToast(this.$trans('Error updating picture'))
          this.isLoading = false
          this.buttonDisabled = false
        }
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.picture = await pictureModel.detail(this.pk)
        this.current_image = this.picture.picture ? this.picture.picture : '/static/core/img/noimg.png'
        this.isLoading = false
      } catch(error) {
        console.log('error fetching picture', error)
        this.errorToast(this.$trans('Error fetching picture'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
