<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Choose template')"
    ok-only
    @ok="hide"
  >
    <b-overlay :show="isLoading" rounded="sm">
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
          <b-row>
            <b-col cols="12">
              <b-table
                id="documents-table"
                small
                :busy="isLoading"
                :fields="fields"
                :items="documents"
                :hover="true"
                responsive="md"
                tbody-tr-class="table-row"
                @row-clicked="onRowClicked"
              >
              </b-table>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-overlay>
  </b-modal>
</template>
<script>
import {TeamleaderService} from "@/models/company/Teamleader";

export default {
  name: "DocumentTemplateChooser",
  mixins: [],
  components: {},
  props: {
    'departmentId': String
  },
  emits: [
    'template-chosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      query: null,
      documents: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
      ]
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    onRowClicked(item, _index, _event) {
      this.$emit('template-chosen', item)
    },
    async doSearch() {
      console.log('do search')
    },
    async loadData() {
      this.isLoading = true
      try {
        const response = await this.service.invoiceDocumentTemplateList(this.departmentId)
        this.documents = response.data
        this.isLoading = false

      } catch(error) {
        console.log('error fetching documents', error)
        this.errorToast(this.$trans('Error fetching documents'))
        this.isLoading = false
      }
    },
    async show() {
      this.$refs['modal'].show()
      await this.loadData()
    },
    hide() {
      this.$refs['modal'].hide()
    }
  }
}
</script>
<style scoped>

</style>
