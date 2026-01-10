<template>
  <div>
    <b-modal
      id="chapter-modal"
      ref="chapter-modal"
      v-bind:title="$trans('Search')"
      @ok="handleOk"
    >
      <form ref="search-form" @submit.stop.prevent="submitChapter">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <BFormGroup
                v-bind:label="$trans('Name')"
                label-for="name"
              >
                <BFormInput
                  id="name"
                  size="sm"
                  autofocus
                  v-model="chapter.name"
                  :state="submitClicked ? !v$.chapter.name.$error : null"
                ></BFormInput>
                <b-form-invalid-feedback
                :state="submitClicked ? !v$.chapter.name.$error : null">
                {{ $trans('Please enter the chapter name') }}
              </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>
          <b-row role="group">
            <b-col size="12">
              <BFormGroup
                v-bind:label="$trans('Description')"
                label-for="description"
              >
                <BFormTextarea
                  id="description"
                  size="sm"
                  v-model="chapter.description"
                  placeholder="Chapter description"
                ></BFormTextarea>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>
  </div>
</template>
<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'


export default {
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      chapter: {
        name: {
          required,
        }
      }
    }
  },
  props: {
    chapterName: {
      type: String,
      default: ''
    },
    chapterDescription: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      chapter: {
        name: this.chapterName,
        description: this.chapterDescription
      },
      submitClicked: false
    }
  },
  methods: {
    handleOk (bvModalEvent) {
      bvModalEvent.preventDefault()
      this.submitChapter()
    },
    submitChapter() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }
      this.$emit('create-chapter', this.chapter)
      this.chapter = {
        name: this.chapterName,
        description: this.chapterDescription
      }
      this.$nextTick(() => {
        this.hide()
      })
    },
    show() {
      this.$refs['chapter-modal'].show()
    },
    hide() {
      this.$refs['chapter-modal'].hide()
    }
  },
}
</script>
