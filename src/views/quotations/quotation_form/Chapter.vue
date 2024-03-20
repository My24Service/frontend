<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Chapters') }}</h6>
      <b-icon-chevron-down></b-icon-chevron-down>
    </summary>

    <b-table
      small
      :busy='isLoading'
      :fields="fields"
      :items="chapterService.collection"
      responsive="md"
      class="data-table"
      v-if="!showForm && chapterService.collection.length"
    >
      <template #cell(chapter)="data">
        <h4>
          <b-link @click="function() { loadChapter(data.item) }">
            {{ data.item.name }}
          </b-link>
        </h4>
        <p>{{ data.item.description }}</p>
      </template>
      <template #cell(icons)="data">
        <div
          class="h2 float-right"
          v-if="data.item.id"
        >
          <IconLinkEdit
            :method="function() { editChapter(data.item, data.index) }"
            v-bind:title="$trans('Edit')"
          />
          <IconLinkDelete
            v-bind:title="$trans('Delete')"
            v-bind:method="function() { deleteChapter(data.index) }"
          />
        </div>
      </template>
    </b-table>

    <div v-if="showForm">
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
            v-model="chapterService.editItem.name"
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
            v-model="chapterService.editItem.description"
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
  </details>
</template>
<script>
import {QuotationModel} from '@/models/quotations/Quotation.js'
import {ChapterModel, ChapterService} from '@/models/quotations/Chapter'
import {useVuelidate} from "@vuelidate/core";
import {required} from "@vuelidate/validators";
import IconLinkDelete from "@/components/IconLinkDelete.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";

export default {
  name: 'ChapterComponent',
  components: {
    IconLinkEdit,
    IconLinkDelete
  },
  emits: [
    'chapterCreated',
    'loadChapterClicked'
  ],
  props: {
    quotation: {
      type: QuotationModel,
      default: null
    },
  },
  setup() {
    return { v$: useVuelidate() }
  },
  computed: {
    showForm() {
      return this.chapterService.isEdit || this.newItem
    },
  },
  data() {
    return {
      submitClicked: false,
      chapter: new ChapterModel({}),
      chapterService: new ChapterService(),
      chapters: [],
      newItem: false,
      fields: [
        {key: 'chapter', label: this.$trans('Chapter'), thAttr: {width: '80%'}},
        {key: 'icons', label: '', thAttr: {width: '20%'}},
      ]
    }
  },
  async created () {
    this.chapterService.model = ChapterModel
    this.chapterService.addListArg(`quotation=${this.quotation.id}`)
    await this.loadData()
  },
  validations() {
    return {
      chapterService: {
        editItem: {
          name: {
            required
          }
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
      this.chapterService.collection = response.results.map((c) => new ChapterModel(c))
    }
  },
}
</script>
<style scoped>
</style>
