<template>
  <div class="app-page">
    <header>
      <div class='page-title'>

        <h3>
          <IBiImage></IBiImage> {{ $trans('Pictures') }}
        </h3>

        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
            v-bind:method="function() { loadData() }"
            v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
            v-bind:method="function() { showSearchModal() }"
            />
          </BButton-group>
          <router-link :to="{name: 'company-picture-add'}" class="btn">
            <IBiImage></IBiImage>
            {{ $trans('Add picture') }}</router-link>
        </BButton-toolbar>

      </div>
    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-picture-modal"
      ref="delete-picture-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this picture?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

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

        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(picture)="data">
          <router-link :to="{name: 'company-picture-edit', params: {pk: data.item.id}}">
            <img :src="data.item.picture || NO_IMAGE_URL" height="100" alt=""/>
          </router-link>
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

      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Picture')"
      />
    </div>
  </div>
</template>
<style scoped>
img {margin-inline: 0; height: 100%}
</style>
<script>
import pictureModel from '@/models/company/Picture.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import {NO_IMAGE_URL} from "@/constants"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: pictureModel,
      picturePk: null,
      isLoading: false,
      pictures: [],
      fields: [
        {key: 'picture', label: $trans('Picture'), sortable: true, },
        {key: 'name', label: $trans('Name'), sortable: true, },
        {key: 'created', label: $trans('Created'), sortable: true, },
        {key: 'icons', label: '', thAttr: {width: '10%'}}
      ],
      NO_IMAGE_URL
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
      this.picturePk = id
      this.$refs['delete-picture-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.picturePk)
        infoToast(this.create, $trans('Deleted'), $trans('Picture has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting picture', error)
        errorToast(this.create, $trans('Error deleting picture'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.pictures = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching pictures', error)
        errorToast(this.create, $trans('Error loading pictures'))
        this.isLoading = false
      }
    }
  }
}
</script>
