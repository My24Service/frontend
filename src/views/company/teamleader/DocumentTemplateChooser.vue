<template>
  <div>
    <form ref="search-form" @submit.stop.prevent="doSearch">
      <b-container fluid>
        <b-row>
          <b-col cols="12">
            <b-form-group
              v-bind:label="$trans('Search')"
              label-for="search-query"
            >
              <b-form-input
                size="sm"
                autofocus
                v-model="query"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>

      </b-container>
    </form>
  </div>
</template>
<script>
import {TeamleaderService} from "@/models/company/Teamleader";

export default {
  name: "DocumentTemplateChooser",
  mixins: [],
  components: {},
  props: {
  },
  emits: [
    'documentChosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      query: null,
      documents: null
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async doSearch() {
      console.log('do search')
    },
    async loadData() {
      this.isLoading = true
      try {
        this.documents = await this.service.invoiceDocumentTemplateList()
        this.isLoading = false

      } catch(error) {
        console.log('error fetching documents', error)
        this.errorToast(this.$trans('Error fetching documents'))
        this.isLoading = false
      }
    },
  }
}
</script>
<style scoped>

</style>
