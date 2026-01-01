<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-check-fill"></b-icon>{{ $trans("Sick leave") }}</h3>
        <div class="flex-columns">
          <router-link class="btn button" :to="{ name: 'sick-leave-list-add' }">
            <b-icon icon="file-earmark-plus"></b-icon>{{ $trans("Add sick leave") }}
          </router-link>
        </div>
      </div>
    </header>
    <div class="panel overflow-auto">
      <PillsLeave />
      <b-table
        small
        id="leave-table"
        :busy="isLoading"
        :fields="fields"
        :items="leaves"
        responsive="md"
        class="data-table"
      >
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
        <template #cell(full_name)="data">
          <b-link :to="{ name: 'leave-edit', params: { pk: data.item.id } }">{{
            data.item.full_name
          }}</b-link>
        </template>
        <template #cell(date)="data">
          <span v-if="!data.item.end_date">
            {{ data.item.start_date }}
          </span>
          <span v-else>
            {{ data.item.start_date }} - {{ data.item.end_date }}
          </span>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="sick-leave-list-edit"
              v-bind:router_params="{ pk: data.item.id }"
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
    <Pagination v-if="!isLoading" :model="this.sickLeavesService" :model_name="$trans('Sick leave')" />
    <SearchModal id="search-modal" ref="search-modal" @do-search="handleSearchOk" />
    <b-modal
      id="delete-sick-leave-modal"
      ref="delete-sick-leave-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans("Are you sure you want to delete this sick leave?") }}</p>
    </b-modal>
  </div>
</template>

<script>
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import PillsLeave from "./SubNav.vue";
import { SickLeavesService } from "@/models/company/SickLeave.js";
import IconLinkEdit from "../../../components/IconLinkEdit.vue";
import IconLinkDelete from "../../../components/IconLinkDelete.vue";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
    PillsLeave,
    IconLinkEdit,
    IconLinkDelete
  },
  data() {
    return {
      sickLeavesService: new SickLeavesService(),
      searchQuery: null,
      leavePk: null,
      isLoading: false,
      leaves: [],
      fields: [
        { key: "user_full_name", label: $trans("User"), thAttr: { width: "15%" } },
        { key: "date", label: $trans("Date") },
        { key: "created_by_fullname", label: $trans("Created by") },
        { key: "created", label: $trans("Created") },
        { key: "last_status_full", label: $trans("Status") },
        { key: "icons", thAttr: { width: "15%" } }
      ]
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs["search-modal"].hide();
      this.sickLeavesService.setSearchQuery(val);
      this.loadData();
    },
    showSearchModal() {
      this.$refs["search-modal"].show();
    },
    showDeleteModal() {
      this.leavePk = id;
      this.$refs["delete-sick-leave-modal"].show();
    },
    async doDelete() {
       this.isLoading = true;
      try {
        await this.sickLeavesService.delete(this.leavePk);
        infoToast(create, $trans("Deleted"), $trans("Sick leave has been deleted"));
        this.loadData();
      } catch (error) {
        this.isLoading = false;
        console.log("error deleting sick leave", error);
        errorToast(create, $trans("Error deleting sick leave"));
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.sickLeavesService.list();
        this.leaves = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching sick leave request", error);
        errorToast(create, $trans("Error loading sick leave request"));
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
