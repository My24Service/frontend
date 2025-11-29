<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Choose department')"
    ok-only
  >
    <b-overlay :show="isLoading" rounded="sm">
      <b-table
        id="documents-table"
        small
        :busy="isLoading"
        :fields="fields"
        :items="departments"
        :hover="true"
        responsive="md"
        tbody-tr-class="table-row"
        @row-clicked="onRowClicked"
      >
      </b-table>
    </b-overlay>
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
    'department-chosen'
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
    onRowClicked(item, _index, _event) {
      this.$emit('department-chosen', item)
    },
    async loadData() {
      this.isLoading = true
      try {
        const response = await this.service.departmentList()
        this.departments = response.data
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
.table-row {
  cursor: pointer;
}
</style>
