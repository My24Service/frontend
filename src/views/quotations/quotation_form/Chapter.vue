<template>
  <b-overlay :show="isLoading" rounded="sm">

    <h6>{{ $trans('Chapters') }}</h6>

    <div>
      <b-modal
        id="delete-chapter-modal"
        ref="delete-chapter-modal"
        v-bind:title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">
          {{ $trans("Are you sure you want to delete this chapter, it's quotation lines and costs?") }}
        </p>
      </b-modal>

      <div
        v-if="!chapterService.collection.length && isView"
      >
        <p><i>{{ $trans('No chapters') }}</i></p>
      </div>

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
        <template #cell(icons)="data" v-if="quotation.preliminary">
          <div
            class="h2 float-right"
            v-if="data.item.id && !isView"
          >
            <IconLinkEdit
              :method="function() { editChapter(data.item, data.index) }"
              v-bind:title="$trans('Edit')"
              class="pr-2"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
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
              :state="submitClicked ? !v$.chapterService.editItem.name.$error : null"
            ></b-form-input>
            <b-form-invalid-feedback
              :state="submitClicked ? !v$.chapterService.editItem.name.$error : null">
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

          <footer class="modal-footer">
            <b-button
              :disabled="isLoading"
              @click="cancelEditChapter"
              class="btn btn-secondary update-button"
              type="button"
              size="sm"
              variant="secondary"
            >
              {{ $trans('Cancel') }}
            </b-button>
            <b-button
              v-if="chapterService.isEdit"
              @click="doEditChapter"
              class="btn btn-primary"
              size="sm"
              type="button"
              variant="warning"
            >
              {{ $trans('Edit chapter') }}
            </b-button>
            <b-button
              v-if="!chapterService.isEdit"
              @click="addChapter"
              class="btn btn-primary"
              size="sm"
              type="button"
              variant="primary"
            >
              {{ $trans('Add chapter') }}
            </b-button>
          </footer>
        </div>
      </div>

      <footer
        class="modal-footer"
        v-if="!showForm && !isView && quotation.preliminary"
      >
        <b-button
          @click="newChapter"
          class="btn btn-primary update-button"
          type="button"
          variant="primary"
        >
          {{ $trans('New chapter') }}
        </b-button>
      </footer>
    </div>
  </b-overlay>
</template>
<script>
import {useVuelidate} from "@vuelidate/core";
import {required} from "@vuelidate/validators";

import IconLinkDelete from "@/components/IconLinkDelete.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";

import {QuotationModel} from '@/models/quotations/Quotation.js'
import {ChapterModel, ChapterService} from '@/models/quotations/Chapter'

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
    isView: {
      type: [Boolean],
      default: false
    }
  },
  setup() {
    return { v$: useVuelidate() }
  },
  computed: {
    showForm() {
      return !this.isView && (this.chapterService.isEdit || this.newItem)
    },
  },
  data() {
    return {
      submitClicked: false,
      chapterService: new ChapterService(),
      newItem: false,
      isLoading: false,
      fields: [
        {key: 'chapter', label: this.$trans('Chapter'), thAttr: {width: '80%'}},
        {key: 'icons', label: '', thAttr: {width: '20%'}},
      ],
      hasChanges: false,
      deletePk: null
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
    // delete
    showDeleteModal(id) {
      this.deletePk = id
      this.$refs['delete-chapter-modal'].show()
    },
    async doDelete() {
      this.isLoading = true

      try {
        await this.chapterService.delete(this.deletePk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Chapter has been deleted'))
        await this.loadData()
        this.isLoading = false
      } catch(error) {
        this.isLoading = false
        console.log('Error deleting chapter', error)
        this.errorToast(this.$trans('Error deleting chapter'))
      }
    },
    async doEditChapter() {
      if (this.chapterService.editItem.id) {
        this.isLoading = true
        await this.chapterService.doDirectEditCollectionItem()
        await this.loadData()
        this.isLoading = false
      } else {
        this.chapterService.doEditCollectionItem()
      }
    },
    editChapter(item, index) {
      this.chapterService.editCollectionItem(item, index)
    },
    cancelEditChapter() {
      this.chapterService.cancelEdit()
      this.newItem = false
    },
    newChapter() {
      this.chapterService.newEditItem()
      this.newItem = true
    },
    async addChapter() {
      this.submitClicked = true

      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.chapterService.editItem.quotation = this.quotation.id
      const newChapter = await this.chapterService.addDirectCollectionItem()

      // emit created so the main form can load costs and lines
      this.$emit('chapterCreated', newChapter)

      this.v$.$reset()

      await this.loadData()
    },
    loadChapter(chapter) {
      this.$emit('loadChapterClicked', chapter)
    },
    async loadData() {
      await this.chapterService.loadCollection()
      if (this.chapterService.collection.length === 0) {
        this.newChapter()
      }
    }
  },
}
</script>
<style scoped>
</style>
