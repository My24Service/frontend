<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-check-fill"></b-icon>Templates</h3>
        <div class="flex-columns">
          <router-link class="btn button" :to="{ name: 'customer-template-add' }">
            <b-icon icon="file-earmark-plus"></b-icon> Add template
          </router-link>
        </div>
      </div>
    </header>
    <div class="panel overflow-auto">
      <b-table
        small
        id="template-table"
        :busy="isLoading"
        :fields="fields"
        :items="templates"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner><br /><br />
            <strong>{{ $trans("loading templates...") }}</strong>
          </div>
        </template>
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkRefresh
                  v-bind:method="
                    function() {
                      loadData();
                    }
                  "
                  v-bind:title="$trans('Refresh')"
                />
                <ButtonLinkSearch
                  v-bind:method="
                    function() {
                      showSearchModal();
                    }
                  "
                />
              </b-button-group>
            </b-button-toolbar>
          </div>
        </template>
        <template #cell(name)="data">
          <router-link :to="{ name: 'customer-template-edit', params: { pk: data.item.id } }"
            >{{ data.item.name }}
          </router-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="customer-template-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="
                function() {
                  showDeleteModal(data.item.id);
                }
              "
            />
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.customerTemplateService"
      :model_name="$trans('Template')"
    />
    <SearchModal id="search-modal" ref="search-modal" @do-search="handleSearchOk" />
    <b-modal
      id="delete-template-modal"
      ref="delete-template-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans("Are you sure you want to delete this template?") }}</p>
    </b-modal>
  </div>
</template>

<script>
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from "../../../components/IconLinkDelete.vue";
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import {
  CustomerTemplateService,
  CustomerTemplateModel
} from "@/models/company/CustomerTemplate.js";

export default {
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination
  },
  data() {
    return {
      // type based variables
      titleAdd: null,
      customerTemplateService: new CustomerTemplateService(),
      searchQuery: null,
      templatePk: null,
      isLoading: false,
      templates: [],
      fields: [
        { key: "name", label: this.$trans("Name"), thAttr: { width: "15%" } },
        { key: "template_type", label: this.$trans("Type") },
        { key: "description", label: this.$trans("Description") },
        { key: "is_active", label: this.$trans("Is active") },
        { key: "created", label: this.$trans("Created") },
        { key: "modified", label: this.$trans("Modified") },
        { key: "icons", thAttr: { width: "15%" } }
      ]
    };
  },
  created() {
    this.customerTemplateService.currentPage = this.$route.query.page || 1;
    this.loadData();
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs["search-modal"].hide();
      this.customerTemplateService.setSearchQuery(val);
      this.loadData();
    },
    showSearchModal() {
      this.$refs["search-modal"].show();
    },
    // delete
    showDeleteModal(id) {
      this.templatePk = id;
      this.$refs["delete-template-modal"].show();
    },
    async doDelete() {
      try {
        await this.customerTemplateService.delete(this.templatePk);
        this.infoToast(this.$trans("Deleted"), this.$trans("Template has been deleted"));
        this.loadData();
      } catch (error) {
        console.log("error deleting templates", error);
        this.errorToast(this.$trans("Error deleting template"));
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.customerTemplateService.list();
        this.templates = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching templates", error);
        this.errorToast(this.$trans("Error loading templates"));
        this.isLoading = false;
      }
    },
    async setTemplateActive(id) {
      this.isLoading = true;

      try {
        await this.customerTemplateService.setTemplateActive(id, {});
        this.isLoading = false;
        this.loadData()
      } catch (error) {
        console.log("error setting template as active", error);
        this.errorToast(this.$trans("Error setting template as active"));
        this.isLoading = false;
      }
    }
  }
};
</script>
<style scoped>
.color_text {
  font-weight: bold;
  font-style: italic;
}
.subnav-pills {
  margin-bottom: 20px;
}
</style>
