<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Choose department')"
    ok-only
  >
    <b-table
      id="documents-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="departments"
      responsive="md"
      class="data-table"
      @row-clicked="onRowClicked"
    >
    </b-table>
  </b-modal>
</template>
<script>
import {TeamleaderService} from "@/models/company/Teamleader";

export default {
  name: "DepartmentChooser",
  mixins: [],
  components: {},
  props: {
  },
  emits: [
    'departmentChosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      departments: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
      ]
    }
  },
  created() {
  },
  methods: {
    onRowClicked(item, index, event) {
      console.log({item})
      this.$emit('departmentChosen', item.id)
    },
    async loadData() {
      this.isLoading = true
      try {
        this.departments = await this.service.departmentList()
        console.log(this.departments)
        this.isLoading = false

      } catch(error) {
        console.log('error fetching departments', error)
        this.errorToast(this.$trans('Error fetching departments'))
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
