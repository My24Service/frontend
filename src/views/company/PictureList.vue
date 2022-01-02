<template>
  <div class="mt-4">

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

    <b-modal
      id="delete-picture-modal"
      ref="delete-picture-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this picture?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.pictureModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.pictureModel.count"
      :per-page="this.pictureModel.perPage"
      aria-controls="picture-table"
    ></b-pagination>

    <b-table
      id="picture-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="pictures"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="company-picture-add"
                v-bind:title="$trans('New picture')"
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
      <template #cell(picture)="data">
        <img :src="data.item.picture || '/static/core/img/noimg.png'" height="100" alt=""/>
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="company-picture-edit"
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
import pictureModel from '@/models/company/Picture'
import IconLinkEdit from '@/components/IconLinkEdit'
import IconLinkDelete from '@/components/IconLinkDelete'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'

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
      pictureModel,
      picturePk: null,
      isLoading: false,
      pictures: [],
      fields: [
        {key: 'picture', label: this.$trans('Picture'), sortable: true, thAttr: {width: '50%'}},
        {key: 'name', label: this.$trans('Name'), sortable: true, thAttr: {width: '30%'}},
        {key: 'created', label: this.$trans('Created'), sortable: true, thAttr: {width: '10%'}},
        {key: 'icons', thAttr: {width: '10%'}}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.pictureModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage =this.pictureModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      pictureModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.picturePk = id
      this.$refs['delete-picture-modal'].show()
    },
    doDelete() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        pictureModel.delete(token, this.picturePk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Picture has been deleted')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting picture')
          })
        })
      })
    },
    async loadData() {
      this.isLoading = true;

      pictureModel.list()
        .then((data) => {
          this.pictures = data.results
          this.isLoading = false
        })
        .catch((error) => {
          console.log('error fetching pictures', error);
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error loading pictures')
          })
          this.isLoading = false
        })
    }
  }
}
</script>
