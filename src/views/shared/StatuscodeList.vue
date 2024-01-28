<template>
  <div class="app-grid">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-statuscode-modal"
      ref="delete-statuscode-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this statuscode?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.statuscodeModel"
        :model_name="$trans('Statuscode')"
      />
      <b-table
        small
        id="statuscode-table"
        :busy='isLoading'
        :fields="fields"
        :items="statuscodes"
        tbody-tr-class="statuscode-row"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  :router_name="`${linkAdd}`"
                  v-bind:title="`${titleAdd}`"
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
        <template #cell(color)="data">
          <span v-bind:style="{ backgroundColor: data.item.color }">
            <img width="12" :src="PIXEL_URL" />
          </span>
          <div class="color_text">{{data.item.color }}</div>
        </template>
        <template #cell(text_color)="data">
          <span v-bind:style="{ width: '10px', backgroundColor: data.item.text_color }">
            <img width="10" :src="PIXEL_URL" />
          </span>
          <div class="color_text">{{data.item.text_color }}</div>
        </template>
        <template #cell(type)="data">
          <div v-if="data.item.start_order">
            <span class="statuscode_type">{{ $trans('Start order') }}</span>
          </div>
          <div v-if="data.item.end_order">
            <span class="statuscode_type">{{ $trans('End order') }}</span>
          </div>
          <div v-if="data.item.after_end_order">
            <span class="statuscode_type">{{ $trans('After end order') }}</span>
          </div>
        </template>
        <template #cell(actions)="data">
          <b-table
            small
            :fields="action_fields"
            :items="data.item.actions"
            responsive="md"
            borderless
            thead-class="d-none"
          >
            <template #cell(id)="data">
              <router-link :to="{name: linkEditAction, params: {pk: data.item.id }}">
                {{ data.item.name }} ({{ data.item.type }})
              </router-link>
            </template>
          </b-table>
        </template>

        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkPlus
              type="tr"
              v-bind:title="$trans('Add action')"
              v-bind:router_name="`${linkAddAction}`"
              v-bind:router_params="{statuscode_pk: data.item.id}"
            />
            <IconLinkEdit
              v-bind:router_name="`${linkEdit}`"
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
import statuscodeOrderModel from '../../models/orders/Statuscode.js'
import statuscodeTripModel from '../../models/mobile/TripStatuscode.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkPlus from '../../components/IconLinkPlus.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {PIXEL_URL} from "../../constants";

export default {
  props: {
    list_type: {
      type: [String],
      default: 'order'
    },
  },
  components: {
    IconLinkEdit,
    IconLinkPlus,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      // type based variables
      titleAdd: null,
      linkAdd: null,
      linkEdit: null,
      linkAddAction: null,
      linkEditAction: null,
      statuscodeModel: null,

      searchQuery: null,
      statuscodePk: null,
      isLoading: false,
      statuscodes: [],
      action_fields: [
        {key: 'id'},
      ],
      fields: [],
      fieldsOrder: [
        {key: 'statuscode', label: this.$trans('Statuscode'), thAttr: {width: '15%'}},
        {key: 'color', label: this.$trans('Color'), thAttr: {width: '5%'}},
        {key: 'text_color', label: this.$trans('Text color'), thAttr: {width: '10%'}},
        {key: 'type', label: this.$trans('Type'), thAttr: {width: '10%'}},
        {key: 'description', label: this.$trans('Description'), thAttr: {width: '25%'}},
        {key: 'actions', label: this.$trans('Actions'), thAttr: {width: '20%'}},
        {key: 'icons', thAttr: {width: '15%'}},
      ],
      fieldsTrip: [
        {key: 'statuscode', label: this.$trans('Statuscode'), thAttr: {width: '20%'}},
        {key: 'color', label: this.$trans('Color'), thAttr: {width: '5%'}},
        {key: 'start_trip', label: this.$trans('Start trip?'), thAttr: {width: '10%'}},
        {key: 'end_trip', label: this.$trans('End trip?'), thAttr: {width: '10%'}},
        {key: 'description', label: this.$trans('Description'), thAttr: {width: '20%'}},
        {key: 'actions', label: this.$trans('Actions'), thAttr: {width: '20%'}},
        {key: 'icons', thAttr: {width: '15%'}},
      ],
      PIXEL_URL
    }
  },
  created() {
    this.linkAdd = `${this.list_type}-statuscode-add`
    this.linkEdit = `${this.list_type}-statuscode-edit`
    this.linkAddAction = `${this.list_type}-statuscode-action-add`
    this.linkEditAction = `${this.list_type}-statuscode-action-edit`

    switch(this.list_type) {
      case 'order':
        this.titleAdd = this.$trans('New statuscode'),

        this.statuscodeModel = statuscodeOrderModel
        this.fields = this.fieldsOrder
        break
      case 'trip':
        this.titleAdd = this.$trans('New trip statuscode'),

        this.statuscodeModel = statuscodeTripModel
        this.fields = this.fieldsTrip
        break
      default:
        throw `unknown list_type: ${this.list_type}`
    }

    this.statuscodeModel.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.statuscodeModel.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.statuscodePk = id
      this.$refs['delete-statuscode-modal'].show()
    },
    async doDelete() {
      try {
        await this.statuscodeModel.delete(this.statuscodePk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Statuscode has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('error deleting statuscodes', error)
        this.errorToast(this.$trans('Error deleting statuscode'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.statuscodeModel.list()
        this.statuscodes = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching statuscodes', error)
        this.errorToast(this.$trans('Error loading statuscodes'))
        this.isLoading = false
      }
    }
  }
}
</script>
<style scoped>
span.statuscode_type {
  font-style: italic;
}
.color_text {
  font-weight: bold;
  font-style: italic;
}
</style>
