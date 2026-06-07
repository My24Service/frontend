<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Choose template')"
    ok-only
    @ok="hide"
  >
    <form ref="search-form" @submit.stop.prevent="doSearch">
      <b-container fluid>
        <b-row>
          <b-col cols="12">
            <b-form-group
              label="Zoek"
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
              tbody-tr-class="tr-pointer"
              @row-clicked="onRowClicked"
            >
            </b-table>
          </b-col>
        </b-row>
      </b-container>
    </form>
  </b-modal>
</template>
<script>
import {TeamleaderService} from "@/models/company/Teamleader";
import {useToast} from "bootstrap-vue-next";
import componentMixin from "@/mixins/common";
import {errorToast} from "@/utils";

export default {
  name: "DocumentTemplateChooser",
  components: {},
  props: {
    'departmentId': String
  },
  emits: [
    'template-chosen'
  ],
  setup() {
    const {create} = useToast()

    return {
      create,
    }
  },
  mixins: [componentMixin],
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
    },
    async loadData() {
      this.isLoading = true
      try {
        const response = await this.service.invoiceDocumentTemplateList()
        this.documents = response.data
        this.isLoading = false

      } catch(error) {
        console.log('error fetching documents', error)
        errorToast(this.create,'Fout bij het ophalen van de templates')
        this.isLoading = false
      }
    },
    async show() {
      await this.$refs['modal'].show()
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
