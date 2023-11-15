<template>
  <b-overlay :show="isLoading" rounded="sm">
    <h3>{{ $trans('Chapters')}} </h3>
    <div v-for="(chapter, index) in chapters" :key="chapter.id">
      <Collapse
        :title="chapter.name"
      >
        <b-row>
          <b-col cols="6" class="chapter-description">
            {{ chapter.description }}
          </b-col>
        </b-row>
        <QuotationLine
          :quotationData="quotationData"
          :chapter="chapter"
          @quotationLineSubmitted="quotationLineSubmitted"
          @chapterDeleted="() => loadData()"
        />
      </Collapse>
      <hr v-if="index !== chapters.length - 1">
    </div>
  </b-overlay>
</template>
<script>
import quotationService from '@/models/quotations/Quotation.js'
import QuotationLine from './QuotationLine.vue'
import Collapse from "../../../components/Collapse";
import { ChapterService } from '../../../models/quotations/Chapter.js'


export default {
  name: 'Chapter',
  components: {
    Collapse,
    QuotationLine
  },
  props: {
    quotationData: {
      type: Object,
      default: null
    },
    newChapter: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      model: quotationService,
      searchQuery: null,
      quotationPk: null,
      isLoading: false,
      quotations: [],
      chapters: [],
      chapterService: new ChapterService()
    }
  },
  created () {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    async loadData() {
      this.isLoading = true
      this.chapterService.listArgs = [`quotation=${this.quotationData.id}`]

      try {
        const data = await this.chapterService.list()
        this.chapters = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation chapters', error)
        this.errorToast(this.$trans('Error loading quotation chapters'))
        this.isLoading = false
      }
      this.chapterService.listArgs = []
    },
    quotationLineSubmitted() {
      this.loadData()
      this.$emit('quotationLineSubmitted')
    }
  },
  watch: {
    '$route.name': {
      handler: function(search) {
        if (this.$route.name === 'preliminary-quotations') {
          this.model.queryMode = 'preliminary'
        } else {
          this.model.queryMode = 'all'
        }
      },
      deep: true,
      immediate: true
    },
    newChapter: {
      handler(newChapter) {
        const chapter = {...newChapter}
        if (chapter.name) {
          chapter.new = true
          this.$set(this.chapters, this.chapters.length, chapter)
        }
      },
      deep: true
    }
  }
}
</script>
<style scoped>
.chapter-description {
  margin-top: 20px;
}
</style>
