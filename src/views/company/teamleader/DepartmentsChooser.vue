<template>
  <b-modal
    id="modal"
    ref="modal"
    :title="$trans('Choose department')"
    ok-only
    @ok="hide"
  >
    <b-overlay :show="isLoading" rounded="sm">
      <b-table
        id="departments-table"
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
import {useToast} from "bootstrap-vue-next";
import {errorToast} from "@/utils";
import componentMixin from "@/mixins/common";

export default {
  name: "DepartmentChooser",
  mixins: [componentMixin],
  components: {},
  props: {},
  emits: [
    'department-chosen'
  ],
  data() {
    return {
      isLoading: false,
      service: new TeamleaderService(),
      products: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
      ]
    }
  },
  setup() {
    const {create} = useToast()

    return {
      create,
    }
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
        errorToast(this.create, this.$trans('Error fetching departments'))
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
.table-row {
  cursor: pointer;
}
</style>
