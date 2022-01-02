<template>
  <div class="app-grid">

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
      id="delete-statuscode-modal"
      ref="delete-statuscode-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this statuscode?') }}</p>
    </b-modal>

    <b-table
      small
      id="statuscode-table"
      :busy='isLoading'
      :fields="fields"
      :items="statuscodes"
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
          <img width="12" src="/static/core/img/pixel.png" />
        </span>
      </template>
      <template #cell(start_order)="data">
        <div class="text-center">
          <b-icon-check2 v-if="data.item.start_order" class="h3" variant="info"></b-icon-check2>
        </div>
      </template>
      <template #cell(end_order)="data">
        <div class="text-center">
          <b-icon-check2 v-if="data.item.end_order" class="h3" variant="info"></b-icon-check2>
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
</template>

<script>
import statuscodeOrderModel from '@/models/orders/Statuscode'
import statuscodeTripModel from '@/models/mobile/TripStatuscode'
import IconLinkEdit from '@/components/IconLinkEdit'
import IconLinkPlus from '@/components/IconLinkPlus'
import IconLinkDelete from '@/components/IconLinkDelete'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'

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
        {key: 'statuscode', label: this.$trans('Statuscode')},
        {key: 'color', label: this.$trans('Color')},
        {key: 'start_order', label: this.$trans('Start order?')},
        {key: 'end_order', label: this.$trans('End order?')},
        {key: 'description', label: this.$trans('Description')},
        {key: 'actions', label: this.$trans('Actions')},
        {key: 'icons'},
      ],
      fieldsTrip: [
        {key: 'statuscode', label: this.$trans('Statuscode')},
        {key: 'color', label: this.$trans('Color')},
        {key: 'start_trip', label: this.$trans('Start trip?')},
        {key: 'end_trip', label: this.$trans('End trip?')},
        {key: 'description', label: this.$trans('Description')},
        {key: 'actions', label: this.$trans('Actions')},
        {key: 'icons'},
      ]
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

    this.currentPage = this.statuscodeModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      this.statuscodeModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.statuscodePk = id
      this.$refs['delete-statuscode-modal'].show()
    },
    doDelete() {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        this.statuscodeModel.delete(token, this.statuscodePk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('Statuscode has been deleted')
          })

          this.loadData()
        }).catch((error) => {
          console.log('error deleting statuscodes', error)
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting statuscode')
          })
        })
      })
    },
    loadData() {
      this.isLoading = true

      this.statuscodeModel.list().then((data) => {
        this.statuscodes = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching statuscodes', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading statuscodes')
        })

        this.isLoading = false
      })
    }
  }
}
</script>
