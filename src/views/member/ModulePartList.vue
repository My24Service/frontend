<template>
  <div class="mt-4">

    <b-modal
      id="delete-module-part-modal"
      ref="delete-module-part-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module part?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-pagination
      v-if="this.modulePartModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.modulePartModel.count"
      :per-page="this.modulePartModel.perPage"
      aria-controls="module-part-table"
    ></b-pagination>

    <b-table
      id="module-part-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="moduleParts"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="module-part-add"
                v-bind:title="$trans('New module part')"
              />
              <ButtonLinkRefresh
                v-bind:method="function() { loadData() }"
                v-bind:title="$trans('Refresh')"
              />
              <ButtonLinkSearch
                v-bind:method="function() { showSearchModal() }"
              />
            </b-button-group>
          </b-button-toolbar>
        </div>
      </template>
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="module-part-edit"
            v-bind:router_params="{pk: data.item.id}"
            v-bind:title="$trans('Edit')"
          />
          <IconLinkDelete
            v-bind:title="$trans('Delete')"
            v-bind:method="function() { showDeleteModal(data.item.id) }"
          />
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
import modulePartModel from '@/models/member/ModulePart.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'

export default {
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      modulePartModel,
      modulePartPk: null,
      isLoading: false,
      moduleParts: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), thAttr: {width: '50%'}, sortable: true},
        {key: 'module_name', label: this.$trans('Module'), thAttr: {width: '20%'}, sortable: true},
        {key: 'created', label: this.$trans('Created'), thAttr: {width: '10%'}, sortable: true},
        {key: 'modified', label: this.$trans('Modified'), thAttr: {width: '10%'}, sortable: true},
        {key: 'icons', thAttr: {width: '10%'}}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.modulePartModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = modulePartModel.currentPage
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      modulePartModel.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.modulePartPk = id
      this.$refs['delete-module-part-modal'].show()
    },
    async doDelete() {
      try {
        await modulePartModel.delete(this.modulePartPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Module part has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('Error deleting module part', error)
        this.errorToast(this.$trans('Error deleting module part'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await modulePartModel.list()
        this.moduleParts = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching module parts', error)
        this.errorToast(this.$trans('Error loading module parts'))
        this.isLoading = false
      }
    }
  }
}
</script>
