<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-check-fill"></b-icon>{{ $trans("Unseen sick leave") }}</h3>
      </div>
    </header>
    <div class="panel overflow-auto">

      <SubNav />

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
            <b-link
              :title="$trans('Seen')"
              @click="() => showSeenModal(data.item.id)"
            >
              <b-icon-check-lg class="edit-icon"></b-icon-check-lg>
            </b-link>
          </div>
        </template>
      </b-table>
    </div>
    <Pagination v-if="!isLoading" :model="this.sickLeavesService" :model_name="$trans('Unseen sick leave')" />
    <SearchModal id="search-modal" ref="search-modal" @do-search="handleSearchOk" />
    <b-modal
      id="seen-leave-modal"
      ref="seen-leave-modal"
      v-bind:title="$trans('Mark leave as seen')"
      @ok="doSeen"
    >
      <p class="my-4">{{ $trans("Are you sure you want to mark this sick leave as seen") }}</p>
    </b-modal>
  </div>
</template>

<script>
import ButtonLinkRefresh from "../../../components/ButtonLinkRefresh.vue";
import ButtonLinkSearch from "../../../components/ButtonLinkSearch.vue";
import ButtonLinkAdd from "../../../components/ButtonLinkAdd.vue";
import SearchModal from "../../../components/SearchModal.vue";
import Pagination from "../../../components/Pagination.vue";
import SubNav from "./SubNav.vue";
import { SickLeavesService } from "@/models/company/SickLeaves.js";
import IconLinkEdit from "../../../components/IconLinkEdit.vue";

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    SubNav,
    IconLinkEdit
  },
  data() {
    return {
      sickLeavesService: new SickLeavesService(),
      searchQuery: null,
      leavePk: null,
      isLoading: false,
      leaves: [],
      fields: [
        { key: "user_full_name", label: this.$trans("User"), thAttr: { width: "15%" } },
        { key: "date", label: this.$trans("Date") },
        { key: "created_by_fullname", label: this.$trans("Created by") },
        { key: "created", label: this.$trans("Created") },
        { key: "last_status_full", label: this.$trans("Status") },
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
    showSeenModal(id) {
      this.leavePk = id;
      this.$refs["seen-leave-modal"].show();
    },
    async doSeen() {
       this.isLoading = true;
      try {
        await this.sickLeavesService.setAsSeen(this.leavePk);
        this.infoToast(this.$trans("Accepted"), this.$trans("Leave as been marked as seen"));
        this.loadData();
      } catch (error) {
        this.isLoading = false;
        console.log("error accepting leave", error);
        this.errorToast(this.$trans("Error accepting leave"));
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.sickLeavesService.getUnseenSickLeaves();
        this.leaves = data.results;
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching unseen sick leave request", error);
        this.errorToast(this.$trans("Error loading unseen sick leave request"));
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
