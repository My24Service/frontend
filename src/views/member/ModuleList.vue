<template>
  <div class="mt-4">

    <b-modal
      id="delete-module-modal"
      ref="delete-module-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Module')"
      />

      <b-table
        id="module-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="modules"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="module-add"
                  v-bind:title="$trans('New module')"
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
              router_name="module-edit"
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
  </div>
</template>

<script>
import moduleModel from '@/models/member/Module.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: moduleModel,
      modulePk: null,
      isLoading: false,
      modules: [],
      fields: [
        {key: 'name', label: $trans('Name'), thAttr: {width: '70%'}, sortable: true},
        {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}, sortable: true},
        {key: 'modified', label: $trans('Modified'), thAttr: {width: '10%'}, sortable: true},
        {key: 'icons', thAttr: {width: '10%'}}
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.modulePk = id
      this.$refs['delete-module-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.modulePk)
        infoToast(create, $trans('Deleted'), $trans('Module has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting module', error)
        errorToast(create, $trans('Error deleting module'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.modules = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching modules', error)
        errorToast(create, $trans('Error loading modules'))
        this.isLoading = false
      }
    }
  }
}
</script>
