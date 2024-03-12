<template>
  <div>

    <div v-if="chapters.length">
      <h3>{{ $trans('Chapters')}} </h3>
      <div v-for="chapter in chapters" :key="chapter.id">
        <h4>
          <b-link @click="function() { loadChapter(chapter) }">
            {{ chapter.name }}
          </b-link>
        </h4>
        <p>{{ chapter.description }}</p>
      </div>
    </div>

    <div>
      <h3>{{ $trans("New chapter" )}}</h3>
      <div>
        <b-form-group
          v-bind:label="$trans('Name')"
          label-for="name"
          label-cols="3"
        >
          <b-form-input
            id="name"
            size="sm"
            autofocus
            v-model="chapter.name"
            :state="submitClicked ? !v$.chapter.name.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="submitClicked ? !v$.chapter.name.$error : null">
            {{ $trans('Please enter the chapter name') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <b-form-group
          v-bind:label="$trans('Description')"
          label-for="description"
          label-cols="3"
        >
          <b-form-textarea
            id="description"
            size="sm"
            v-model="chapter.description"
            placeholder="Chapter description"
          ></b-form-textarea>
        </b-form-group>

        <footer
          class="modal-footer"
        >
          <b-button
            @click="addChapter"
            class="btn btn-primary update-button"
            type="button"
            variant="primary"
          >
            {{ $trans('Add new chapter') }}
          </b-button>
        </footer>
      </div>
    </div>
  </div>
</template>
<script>
import {QuotationModel} from '@/models/quotations/Quotation.js'
import {ChapterModel, ChapterService} from '@/models/quotations/Chapter'
import {useVuelidate} from "@vuelidate/core";
import {required} from "@vuelidate/validators";

export default {
  name: 'ChapterComponent',
  components: {
  },
  props: {
    quotation: {
      type: QuotationModel,
      default: null
    },
  },
  setup() {
    return { v$: useVuelidate() }
  },
  mounted() {
  },
  beforeDestroy() {
  },
  data() {
    return {
      submitClicked: false,
      chapter: new ChapterModel({}),
      chapterService: new ChapterService(),
      chapters: []
    }
  },
  async created () {
    this.chapterService.addListArg(`quotation=${this.quotation.id}`)
    await this.loadData()
  },
  validations() {
    return {
      chapter: {
        name: {
          required
        }
      }
    }
  },
  methods: {
    async addChapter() {
      this.submitClicked = true

      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.chapter.quotation = this.quotation.id
      const newChapter = await this.chapterService.insert(this.chapter)

      // emit created so the main form can load costs and lines
      this.$emit('chapterCreated', newChapter)

      this.v$.$reset()

      this.chapter = new ChapterModel({});
      await this.loadData()
    },
    loadChapter(chapter) {
      this.$emit('loadChapterClicked', chapter)
    },
    async loadData() {
      const response = await this.chapterService.list()
      this.chapters = response.results.map((c) => new ChapterModel(c))
    }
  },
}
</script>
<style scoped>
</style>
