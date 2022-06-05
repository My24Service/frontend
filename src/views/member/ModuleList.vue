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

    <b-modal
      id="search-modal"
      ref="search-modal"
      v-bind:title="$trans('Search')"
      @ok="handleSearchOk"
    >
      <form ref="search-form" @submit.stop.prevent="handleSearchSubmit">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Search')"
                label-for="search-query"
              >
                <b-form-input
                  size="sm"
                  autofocus
                  id="search-query"
                  ref="searchQuery"
                  v-model="searchQuery"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-pagination
      v-if="this.moduleModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.moduleModel.count"
      :per-page="this.moduleModel.perPage"
      aria-controls="module-table"
    ></b-pagination>

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
</template>

<script>
import moduleModel from '@/models/member/Module.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      moduleModel,
      modulePk: null,
      isLoading: false,
      modules: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), thAttr: {width: '70%'}, sortable: true},
        {key: 'created', label: this.$trans('Created'), thAttr: {width: '10%'}, sortable: true},
        {key: 'modified', label: this.$trans('Modified'), thAttr: {width: '10%'}, sortable: true},
        {key: 'icons', thAttr: {width: '10%'}}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.moduleModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = moduleModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      moduleModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.modulePk = id
      this.$refs['delete-module-modal'].show()
    },
    async doDelete() {
      try {
        await moduleModel.delete(this.modulePk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Module has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting module', error)
        this.errorToast(this.$trans('Error deleting module'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await moduleModel.list()
        this.modules = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching modules', error)
        this.errorToast(this.$trans('Error loading modules'))
        this.isLoading = false
      }
    }
  }
}
</script>
